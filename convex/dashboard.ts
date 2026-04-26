import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Doc } from './_generated/dataModel';

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

export const listAssetsByProject = query({
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
      createdAt: now,
      updatedAt: now,
    });
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
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) {
      throw new Error('Asset not found');
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
