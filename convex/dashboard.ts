import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc } from './_generated/dataModel';
import {
  assertDistributionReady,
  contentKindValidator,
  distributionTypeValidator,
  funnelStageValidator,
  primaryMetricValidator,
} from './distributionValidators';

const approvalStateValidator = v.union(
  v.literal('pending'),
  v.literal('in_review'),
  v.literal('approved'),
  v.literal('rejected'),
  v.literal('needs_changes')
);

const assetVersionStatusValidator = v.union(
  v.literal('candidate'),
  v.literal('in_review'),
  v.literal('approved'),
  v.literal('rejected'),
  v.literal('needs_changes')
);

const feedbackScopeValidator = v.union(v.literal('asset'), v.literal('slide'));
const feedbackStatusValidator = v.union(v.literal('open'), v.literal('resolved'));

async function getCurrentVersionForAsset(ctx: any, asset: Doc<'assets'>) {
  if (asset.currentVersionId) {
    return await ctx.db.get(asset.currentVersionId);
  }

  return await ctx.db
    .query('assetVersions')
    .withIndex('by_asset', (q: any) => q.eq('assetId', asset._id))
    .order('desc')
    .first();
}

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query('projects').take(50);

    return await Promise.all(
      projects.map(async (project) => {
        const reviewAssets = await ctx.db
          .query('assets')
          .withIndex('by_project', (q) => q.eq('projectId', project._id))
          .take(200);

        return {
          ...project,
          inReviewCount: reviewAssets.filter((asset) => asset.status !== 'done').length,
          assetCount: reviewAssets.length,
        };
      })
    );
  },
});

export const getProjectChannelSummary = query({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    const assets = await ctx.db
      .query('assets')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .take(500);

    const counts = new Map<string, { assetCount: number; needsReviewCount: number }>();
    for (const asset of assets) {
      const entry = counts.get(asset.platform) ?? { assetCount: 0, needsReviewCount: 0 };
      entry.assetCount += 1;
      if (asset.status !== 'done') {
        entry.needsReviewCount += 1;
      }
      counts.set(asset.platform, entry);
    }

    const platformIds = new Set<string>(project.activeChannels ?? []);
    for (const asset of assets) {
      platformIds.add(asset.platform);
    }

    const activeOrder = project.activeChannels ?? [];
    const channels = [...platformIds].sort((a, b) => {
      const ai = activeOrder.indexOf(a);
      const bi = activeOrder.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });

    return {
      project,
      channels: channels.map((id) => ({
        id,
        assetCount: counts.get(id)?.assetCount ?? 0,
        needsReviewCount: counts.get(id)?.needsReviewCount ?? 0,
      })),
      totalAssets: assets.length,
    };
  },
});

export const listAssetsByProject = query({
  args: {
    projectId: v.id('projects'),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    const assets = args.platform
      ? await ctx.db
          .query('assets')
          .withIndex('by_project_platform', (q) =>
            q.eq('projectId', args.projectId).eq('platform', args.platform!)
          )
          .order('desc')
          .take(200)
      : await ctx.db
          .query('assets')
          .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
          .order('desc')
          .take(200);

    const items = await Promise.all(
      assets.map(async (asset) => {
        const currentVersion = await getCurrentVersionForAsset(ctx, asset);
        return {
          ...asset,
          approvalState: asset.approvalState ?? 'pending',
          thumbnailUrl: currentVersion?.coverImageUrl ?? null,
          currentVersionLabel: currentVersion?.versionLabel ?? asset.version ?? null,
        };
      })
    );

    return { project, assets: items };
  },
});

export const getAssetDetail = query({
  args: {
    assetId: v.id('assets'),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      return null;
    }

    const project = await ctx.db.get(asset.projectId);
    const versions = await ctx.db
      .query('assetVersions')
      .withIndex('by_asset', (q) => q.eq('assetId', asset._id))
      .order('desc')
      .take(50);
    const notes = await ctx.db
      .query('reviewNotes')
      .withIndex('by_asset', (q) => q.eq('assetId', asset._id))
      .order('desc')
      .take(100);
    const feedbackComments = await ctx.db
      .query('feedbackComments')
      .withIndex('by_asset', (q) => q.eq('assetId', asset._id))
      .order('desc')
      .take(200);

    const currentVersion = asset.currentVersionId
      ? await ctx.db.get(asset.currentVersionId)
      : versions[0] ?? null;

    const primaryReference = asset.primaryReferenceId
      ? await ctx.db.get(asset.primaryReferenceId)
      : null;

    return {
      asset: {
        ...asset,
        approvalState: asset.approvalState ?? 'pending',
      },
      project,
      currentVersion,
      versions,
      notes,
      feedbackComments,
      primaryReference,
    };
  },
});

export const createFeedbackComment = mutation({
  args: {
    assetId: v.id('assets'),
    assetVersionId: v.optional(v.id('assetVersions')),
    scopeType: feedbackScopeValidator,
    slideIndex: v.optional(v.number()),
    body: v.string(),
    referenceImageUrl: v.optional(v.string()),
    referenceLabel: v.optional(v.string()),
    authorType: v.optional(v.union(v.literal('human'), v.literal('agent'))),
    authorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    if (args.assetVersionId) {
      const version = await ctx.db.get(args.assetVersionId);
      if (!version || version.assetId !== args.assetId || version.projectId !== asset.projectId) {
        throw new Error('Version not found for asset');
      }
    }

    if (args.scopeType === 'slide' && (args.slideIndex === undefined || args.slideIndex < 0)) {
      throw new Error('slideIndex is required for slide feedback');
    }

    const now = new Date().toISOString();
    return await ctx.db.insert('feedbackComments', {
      projectId: asset.projectId,
      assetId: args.assetId,
      assetVersionId: args.assetVersionId,
      scopeType: args.scopeType,
      slideIndex: args.slideIndex,
      body: args.body,
      referenceImageUrl: args.referenceImageUrl,
      referenceLabel: args.referenceLabel,
      authorType: args.authorType ?? 'human',
      authorId: args.authorId,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateFeedbackCommentStatus = mutation({
  args: {
    commentId: v.id('feedbackComments'),
    status: feedbackStatusValidator,
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error('Feedback comment not found');
    }

    await ctx.db.patch(args.commentId, {
      status: args.status,
      updatedAt: new Date().toISOString(),
    });

    return args.commentId;
  },
});

const workflowStageValidator = v.union(
  v.literal('planning'),
  v.literal('preproduction'),
  v.literal('production'),
  v.literal('postproduction'),
  v.literal('review'),
  v.literal('approved'),
  v.literal('scheduled'),
  v.literal('published'),
  v.literal('measured'),
  v.literal('archived')
);

const assetDistributionArgs = {
  distributionType: v.optional(distributionTypeValidator),
  destination: v.optional(v.string()),
  primaryMetric: v.optional(primaryMetricValidator),
  hook: v.optional(v.string()),
  centralIdea: v.optional(v.string()),
  copy: v.optional(v.string()),
  contentKind: v.optional(contentKindValidator),
  workflowStage: v.optional(workflowStageValidator),
  productionMethod: v.optional(v.string()),
  durationTarget: v.optional(v.string()),
  visualDirection: v.optional(v.string()),
  publishUrl: v.optional(v.string()),
  notionPacketUrl: v.optional(v.string()),
  brief: v.optional(v.string()),
  script: v.optional(v.string()),
  caption: v.optional(v.string()),
  adConcept: v.optional(v.string()),
};

export const createAsset = mutation({
  args: {
    projectId: v.id('projects'),
    title: v.string(),
    platform: v.string(),
    format: v.string(),
    funnelStage: v.string(),
    status: v.string(),
    approvalState: v.optional(approvalStateValidator),
    notionPageUrl: v.optional(v.string()),
    objective: v.optional(v.string()),
    audienceSummary: v.optional(v.string()),
    version: v.optional(v.string()),
    sourceIdeaTitle: v.optional(v.string()),
    cta: v.optional(v.string()),
    campaignId: v.optional(v.string()),
    primaryReferenceId: v.optional(v.id('references')),
    ...assetDistributionArgs,
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const now = new Date().toISOString();
    return await ctx.db.insert('assets', {
      projectId: args.projectId,
      title: args.title,
      platform: args.platform,
      format: args.format,
      funnelStage: args.funnelStage,
      status: args.status,
      approvalState: args.approvalState ?? 'pending',
      notionPageUrl: args.notionPageUrl,
      objective: args.objective,
      audienceSummary: args.audienceSummary,
      version: args.version,
      sourceIdeaTitle: args.sourceIdeaTitle,
      cta: args.cta,
      campaignId: args.campaignId,
      primaryReferenceId: args.primaryReferenceId,
      distributionType: args.distributionType,
      destination: args.destination,
      primaryMetric: args.primaryMetric,
      hook: args.hook,
      centralIdea: args.centralIdea,
      copy: args.copy,
      contentKind: args.contentKind,
      workflowStage: args.workflowStage ?? 'planning',
      productionMethod: args.productionMethod,
      durationTarget: args.durationTarget,
      visualDirection: args.visualDirection,
      publishUrl: args.publishUrl,
      notionPacketUrl: args.notionPacketUrl,
      brief: args.brief,
      script: args.script,
      caption: args.caption,
      adConcept: args.adConcept,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAsset = mutation({
  args: {
    assetId: v.id('assets'),
    title: v.optional(v.string()),
    platform: v.optional(v.string()),
    format: v.optional(v.string()),
    funnelStage: v.optional(v.string()),
    status: v.optional(v.string()),
    approvalState: v.optional(approvalStateValidator),
    notionPageUrl: v.optional(v.string()),
    objective: v.optional(v.string()),
    audienceSummary: v.optional(v.string()),
    cta: v.optional(v.string()),
    campaignId: v.optional(v.string()),
    ...assetDistributionArgs,
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error('Asset not found');

    const { assetId, ...patch } = args;
    const merged = { ...asset, ...patch };
    if (patch.approvalState === 'approved') {
      assertDistributionReady(
        {
          cta: merged.cta,
          destination: merged.destination,
          primaryMetric: merged.primaryMetric,
          funnelStage: merged.funnelStage,
        },
        'asset_approval'
      );
      const workflowStage = merged.workflowStage ?? 'planning';
      const copyOnly = merged.contentKind === 'copy';
      const hasCurrentVersion = !!merged.currentVersionId;
      if (!(workflowStage === 'review' || workflowStage === 'approved' || workflowStage === 'scheduled' || workflowStage === 'published' || workflowStage === 'measured')) {
        throw new Error('Asset must be in review or later before approval.');
      }
      if (!copyOnly && !hasCurrentVersion) {
        throw new Error('Media assets need a current version before approval.');
      }
    }

    await ctx.db.patch(assetId, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    return assetId;
  },
});

export const createReviewNote = mutation({
  args: {
    assetId: v.id('assets'),
    note: v.string(),
    assetVersionId: v.optional(v.id('assetVersions')),
    authorType: v.optional(v.union(v.literal('human'), v.literal('agent'))),
    authorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    if (args.assetVersionId) {
      const version = await ctx.db.get(args.assetVersionId);
      if (!version || version.assetId !== args.assetId || version.projectId !== asset.projectId) {
        throw new Error('Version not found for asset');
      }
    }

    return await ctx.db.insert('reviewNotes', {
      projectId: asset.projectId,
      assetId: args.assetId,
      assetVersionId: args.assetVersionId,
      note: args.note,
      authorType: args.authorType ?? 'human',
      authorId: args.authorId,
      createdAt: new Date().toISOString(),
    });
  },
});

export const setCurrentVersion = mutation({
  args: {
    assetId: v.id('assets'),
    versionId: v.id('assetVersions'),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    const version = await ctx.db.get(args.versionId);

    if (!asset || !version || version.assetId !== args.assetId || version.projectId !== asset.projectId) {
      throw new Error('Version not found for asset');
    }

    await ctx.db.patch(args.assetId, {
      currentVersionId: args.versionId,
      updatedAt: new Date().toISOString(),
    });

    return args.versionId;
  },
});

export const setAssetVersionReviewState = mutation({
  args: {
    assetId: v.id('assets'),
    versionId: v.id('assetVersions'),
    reviewState: assetVersionStatusValidator,
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    const version = await ctx.db.get(args.versionId);

    if (!asset || !version || version.assetId !== args.assetId || version.projectId !== asset.projectId) {
      throw new Error('Version not found for asset');
    }

    if (args.reviewState === 'approved') {
      assertDistributionReady(
        {
          cta: asset.cta,
          destination: asset.destination,
          primaryMetric: asset.primaryMetric,
          funnelStage: asset.funnelStage,
        },
        'asset_approval'
      );
      const workflowStage = asset.workflowStage ?? 'planning';
      if (!(workflowStage === 'review' || workflowStage === 'approved' || workflowStage === 'scheduled' || workflowStage === 'published' || workflowStage === 'measured')) {
        throw new Error('Asset must be in review or later before approval.');
      }
    }

    const now = new Date().toISOString();
    await ctx.db.patch(args.versionId, {
      status: args.reviewState,
      updatedAt: now,
    });

    const mappedApprovalState =
      args.reviewState === 'candidate'
        ? 'pending'
        : args.reviewState;

    await ctx.db.patch(args.assetId, {
      approvalState: mappedApprovalState,
      workflowStage:
        args.reviewState === 'in_review'
          ? 'review'
          : args.reviewState === 'approved'
            ? 'approved'
            : args.reviewState === 'needs_changes'
              ? 'review'
              : asset.workflowStage,
      currentVersionId: args.reviewState === 'approved' ? args.versionId : asset.currentVersionId,
      updatedAt: now,
    });

    return args.reviewState;
  },
});

export const setAssetApprovalState = mutation({
  args: {
    assetId: v.id('assets'),
    approvalState: approvalStateValidator,
    versionId: v.optional(v.id('assetVersions')),
    skipDistributionCheck: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    if (args.approvalState === 'approved' && !args.skipDistributionCheck) {
      assertDistributionReady(
        {
          cta: asset.cta,
          destination: asset.destination,
          primaryMetric: asset.primaryMetric,
          funnelStage: asset.funnelStage,
        },
        'asset_approval'
      );
      const workflowStage = asset.workflowStage ?? 'planning';
      const copyOnly = asset.contentKind === 'copy';
      const hasCurrentVersion = !!(args.versionId || asset.currentVersionId);
      if (!(workflowStage === 'review' || workflowStage === 'approved' || workflowStage === 'scheduled' || workflowStage === 'published' || workflowStage === 'measured')) {
        throw new Error('Asset must be in review or later before approval.');
      }
      if (!copyOnly && !hasCurrentVersion) {
        throw new Error('Media assets need a current version before approval.');
      }
    }

    if (args.versionId) {
      const version = await ctx.db.get(args.versionId);
      if (!version || version.assetId !== args.assetId || version.projectId !== asset.projectId) {
        throw new Error('Version not found for asset');
      }

      if (args.approvalState !== 'pending') {
        await ctx.db.patch(args.versionId, {
          status: args.approvalState,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await ctx.db.patch(args.assetId, {
      approvalState: args.approvalState,
      currentVersionId: args.approvalState === 'approved' && args.versionId ? args.versionId : asset.currentVersionId,
      updatedAt: new Date().toISOString(),
    });

    return args.approvalState;
  },
});
