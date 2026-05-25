import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import {
  assertDistributionReady,
  calendarStatusValidator,
  distributionTypeValidator,
  funnelStageValidator,
  platformValidator,
  primaryMetricValidator,
} from './distributionValidators';

const assetStatusValidator = v.union(
  v.literal('missing'),
  v.literal('in_progress'),
  v.literal('ready'),
  v.literal('needs_review')
);

const calendarItemFields = {
  projectId: v.optional(v.id('projects')),
  title: v.string(),
  platform: platformValidator,
  format: v.string(),
  scheduledAt: v.string(),
  status: calendarStatusValidator,
  distributionType: distributionTypeValidator,
  cta: v.optional(v.string()),
  assetStatus: assetStatusValidator,
  copy: v.optional(v.string()),
  assetUrl: v.optional(v.string()),
  notes: v.optional(v.string()),
  destination: v.optional(v.string()),
  relatedAssetId: v.optional(v.id('assets')),
  campaignId: v.optional(v.string()),
  funnelStage: v.optional(funnelStageValidator),
  primaryMetric: v.optional(primaryMetricValidator),
  hook: v.optional(v.string()),
  centralIdea: v.optional(v.string()),
  publishUrl: v.optional(v.string()),
};

function matchesDistribution(
  itemDistribution: 'organic' | 'paid' | 'both',
  filter: 'organic' | 'paid' | 'both' | 'all'
) {
  if (filter === 'all') return true;
  if (filter === 'both') return itemDistribution === 'both';
  return itemDistribution === filter || itemDistribution === 'both';
}

function inWeekRange(scheduledAt: string, weekStartIso: string, weekEndIso: string) {
  return scheduledAt >= weekStartIso && scheduledAt <= weekEndIso;
}

function mergeWithAsset<T extends Record<string, unknown>>(item: T, asset: Record<string, unknown> | null): T {
  if (!asset) return item;
  return {
    ...item,
    cta: (item.cta as string | undefined) ?? (asset.cta as string | undefined),
    destination: (item.destination as string | undefined) ?? (asset.destination as string | undefined),
    primaryMetric: (item.primaryMetric as string | undefined) ?? (asset.primaryMetric as string | undefined),
    funnelStage: (item.funnelStage as string | undefined) ?? (asset.funnelStage as string | undefined),
    hook: (item.hook as string | undefined) ?? (asset.hook as string | undefined),
    centralIdea: (item.centralIdea as string | undefined) ?? (asset.centralIdea as string | undefined),
    copy: (item.copy as string | undefined) ?? (asset.copy as string | undefined),
    campaignId: (item.campaignId as string | undefined) ?? (asset.campaignId as string | undefined),
  };
}

export const listCalendarItems = query({
  args: {
    projectId: v.optional(v.id('projects')),
    platform: v.optional(platformValidator),
    status: v.optional(calendarStatusValidator),
    distributionType: v.optional(v.union(distributionTypeValidator, v.literal('all'))),
    weekStart: v.optional(v.string()),
    weekEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const items = args.projectId
      ? await ctx.db
          .query('calendarItems')
          .withIndex('by_project_scheduled', (q) => q.eq('projectId', args.projectId))
          .take(500)
      : await ctx.db.query('calendarItems').withIndex('by_scheduled_at').take(500);

    const filtered = items
      .filter((item) => {
        if (args.platform && item.platform !== args.platform) return false;
        if (args.status && item.status !== args.status) return false;
        if (args.distributionType && args.distributionType !== 'all') {
          if (!matchesDistribution(item.distributionType, args.distributionType)) return false;
        }
        if (args.weekStart && args.weekEnd) {
          if (!inWeekRange(item.scheduledAt, args.weekStart, args.weekEnd)) return false;
        }
        return true;
      })
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

    return filtered;
  },
});

export const getCalendarItem = query({
  args: { itemId: v.id('calendarItems') },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) return null;

    const project = item.projectId ? await ctx.db.get(item.projectId) : null;
    const relatedAsset = item.relatedAssetId ? await ctx.db.get(item.relatedAssetId) : null;
    let relatedVersion = null;
    if (relatedAsset?.currentVersionId) {
      relatedVersion = await ctx.db.get(relatedAsset.currentVersionId);
    }

    const displayItem = mergeWithAsset(item, relatedAsset);

    return { item: displayItem, rawItem: item, project, relatedAsset, relatedVersion };
  },
});

export const createCalendarItem = mutation({
  args: calendarItemFields,
  handler: async (ctx, args) => {
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) throw new Error('Project not found');
    }

    if (args.relatedAssetId) {
      const asset = await ctx.db.get(args.relatedAssetId);
      if (!asset) throw new Error('Related asset not found');
    }

    if (args.status === 'scheduled' || args.status === 'published') {
      assertDistributionReady(
        {
          cta: args.cta,
          destination: args.destination,
          primaryMetric: args.primaryMetric,
          funnelStage: args.funnelStage,
        },
        'calendar_scheduled'
      );
    }

    const now = new Date().toISOString();
    return await ctx.db.insert('calendarItems', {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCalendarItem = mutation({
  args: {
    itemId: v.id('calendarItems'),
    ...calendarItemFields,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.itemId);
    if (!existing) throw new Error('Calendar item not found');

    const { itemId, ...fields } = args;
    const merged = { ...existing, ...fields };

    if (merged.status === 'scheduled' || merged.status === 'published') {
      let meta = {
        cta: merged.cta,
        destination: merged.destination,
        primaryMetric: merged.primaryMetric,
        funnelStage: merged.funnelStage,
      };
      if (merged.relatedAssetId) {
        const asset = await ctx.db.get(merged.relatedAssetId);
        if (asset) {
          meta = {
            cta: meta.cta ?? asset.cta,
            destination: meta.destination ?? asset.destination,
            primaryMetric: meta.primaryMetric ?? asset.primaryMetric,
            funnelStage: meta.funnelStage ?? asset.funnelStage,
          };
        }
      }
      assertDistributionReady(meta, 'calendar_scheduled');
    }

    await ctx.db.patch(itemId, {
      ...fields,
      updatedAt: new Date().toISOString(),
    });

    return itemId;
  },
});

export const syncFromAsset = mutation({
  args: { itemId: v.id('calendarItems') },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error('Calendar item not found');
    if (!item.relatedAssetId) throw new Error('No related asset to sync from');

    const asset = await ctx.db.get(item.relatedAssetId);
    if (!asset) throw new Error('Related asset not found');

    await ctx.db.patch(args.itemId, {
      title: item.title || asset.title,
      platform: (asset.platform as typeof item.platform) || item.platform,
      format: asset.format || item.format,
      cta: asset.cta,
      destination: asset.destination,
      primaryMetric: asset.primaryMetric as typeof item.primaryMetric,
      funnelStage: asset.funnelStage as typeof item.funnelStage,
      hook: asset.hook,
      centralIdea: asset.centralIdea,
      copy: asset.copy,
      campaignId: asset.campaignId,
      distributionType: asset.distributionType ?? item.distributionType,
      updatedAt: new Date().toISOString(),
    });

    return args.itemId;
  },
});

export const createAssetFromCalendarItem = mutation({
  args: { itemId: v.id('calendarItems') },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error('Calendar item not found');
    if (!item.projectId) throw new Error('Calendar item needs a project to create an asset');

    const now = new Date().toISOString();
    const assetId = await ctx.db.insert('assets', {
      projectId: item.projectId,
      title: item.title,
      platform: item.platform,
      format: item.format,
      funnelStage: item.funnelStage ?? 'bridge',
      status: 'draft',
      approvalState: 'pending',
      cta: item.cta,
      destination: item.destination,
      primaryMetric: item.primaryMetric,
      hook: item.hook,
      centralIdea: item.centralIdea,
      copy: item.copy,
      distributionType: item.distributionType,
      campaignId: item.campaignId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.itemId, {
      relatedAssetId: assetId,
      updatedAt: now,
    });

    return assetId;
  },
});

export const seedSampleCalendarItems = mutation({
  args: {
    projectId: v.optional(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('calendarItems').take(1);
    if (existing.length > 0) {
      return { inserted: 0, message: 'Calendar already has items; skipping seed.' };
    }

    const base = new Date();
    const day = (offset: number, hour: number, minute = 0) => {
      const d = new Date(base);
      d.setDate(d.getDate() + offset);
      d.setHours(hour, minute, 0, 0);
      return d.toISOString();
    };

    const samples = [
      {
        title: 'Founder reel — Venice cohort hook',
        platform: 'instagram' as const,
        format: 'reel',
        scheduledAt: day(0, 10, 30),
        status: 'scheduled' as const,
        distributionType: 'organic' as const,
        cta: 'DM VENICE',
        assetStatus: 'ready' as const,
        copy: 'Venice is not a vacation. It is a 48h sprint to ship your next product narrative.',
        destination: 'Instagram profile → link in bio',
        funnelStage: 'attention' as const,
        primaryMetric: 'registrations' as const,
      },
      {
        title: 'LinkedIn thought post — agentic marketing OS',
        platform: 'linkedin' as const,
        format: 'post',
        scheduledAt: day(1, 9, 0),
        status: 'needs_review' as const,
        distributionType: 'organic' as const,
        cta: 'Register for masterclass',
        assetStatus: 'needs_review' as const,
        copy: 'We are building Marketing OS as the control plane for MotusDAO distribution.',
        destination: 'Masterclass landing page',
        funnelStage: 'trust' as const,
        primaryMetric: 'link_clicks' as const,
      },
    ];

    const now = new Date().toISOString();
    let inserted = 0;
    for (const sample of samples) {
      await ctx.db.insert('calendarItems', {
        projectId: args.projectId,
        ...sample,
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
    }

    return { inserted, message: `Seeded ${inserted} calendar items.` };
  },
});

export const seedWeekOneParrilla = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');

    const marker = await ctx.db
      .query('calendarItems')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .filter((q) => q.eq(q.field('campaignId'), 'week-one-parrilla'))
      .first();

    if (marker) {
      return { inserted: 0, assets: 0, message: 'Week one parrilla already seeded for this project.' };
    }

    const base = new Date();
    const day = (offset: number, hour: number) => {
      const d = new Date(base);
      d.setDate(d.getDate() + offset);
      d.setHours(hour, 0, 0, 0);
      return d.toISOString();
    };

    const now = new Date().toISOString();
    type PlatformId =
      | 'instagram'
      | 'linkedin'
      | 'whatsapp'
      | 'meta_ads';

    const templates: Array<{
      title: string;
      platform: PlatformId;
      format: string;
      scheduledAt: string;
      distributionType: 'organic' | 'paid' | 'both';
      contentKind?: 'video' | 'carousel' | 'copy' | 'image';
    }> = [
      { title: 'Reel 1 — pain point hook', platform: 'instagram', format: 'reel', scheduledAt: day(0, 10), distributionType: 'both', contentKind: 'video' },
      { title: 'Reel 2 — masterclass bridge', platform: 'instagram', format: 'reel', scheduledAt: day(1, 11), distributionType: 'organic', contentKind: 'video' },
      { title: 'Reel 3 — social proof', platform: 'instagram', format: 'reel', scheduledAt: day(2, 18), distributionType: 'organic', contentKind: 'video' },
      { title: 'Carousel 1 — problem framework', platform: 'instagram', format: 'carousel', scheduledAt: day(1, 9), distributionType: 'organic', contentKind: 'carousel' },
      { title: 'Carousel 2 — masterclass FAQ', platform: 'instagram', format: 'carousel', scheduledAt: day(3, 9), distributionType: 'organic', contentKind: 'carousel' },
      { title: 'Story 1 — reminder CTA', platform: 'instagram', format: 'story', scheduledAt: day(0, 20), distributionType: 'organic', contentKind: 'image' },
      { title: 'Story 2 — poll / question', platform: 'instagram', format: 'story', scheduledAt: day(1, 20), distributionType: 'organic', contentKind: 'image' },
      { title: 'Story 3 — testimonial', platform: 'instagram', format: 'story', scheduledAt: day(2, 20), distributionType: 'organic', contentKind: 'image' },
      { title: 'Story 4 — countdown', platform: 'instagram', format: 'story', scheduledAt: day(3, 20), distributionType: 'organic', contentKind: 'image' },
      { title: 'Story 5 — link sticker', platform: 'instagram', format: 'story', scheduledAt: day(4, 20), distributionType: 'organic', contentKind: 'image' },
      { title: 'LinkedIn — professional authority post', platform: 'linkedin', format: 'post', scheduledAt: day(2, 8), distributionType: 'organic', contentKind: 'copy' },
      { title: 'WhatsApp — direct invite', platform: 'whatsapp', format: 'message', scheduledAt: day(3, 12), distributionType: 'organic', contentKind: 'copy' },
      { title: 'Meta ad creative 1 — reel cutdown', platform: 'meta_ads', format: 'reel_ad', scheduledAt: day(4, 14), distributionType: 'paid', contentKind: 'video' },
      { title: 'Meta ad creative 2 — carousel ad', platform: 'meta_ads', format: 'carousel_ad', scheduledAt: day(5, 14), distributionType: 'paid', contentKind: 'carousel' },
    ];

    let inserted = 0;
    let assetsCreated = 0;

    for (const t of templates) {
      const assetId = await ctx.db.insert('assets', {
        projectId: args.projectId,
        title: t.title,
        platform: t.platform,
        format: t.format,
        funnelStage: t.distributionType === 'paid' ? 'bridge' : 'attention',
        status: 'draft',
        approvalState: 'pending',
        distributionType: t.distributionType,
        contentKind: t.contentKind,
        cta: 'Register for the free masterclass',
        destination: 'Masterclass landing page',
        primaryMetric: t.distributionType === 'paid' ? 'cpa' : 'registrations',
        objective: 'Week one parrilla placeholder',
        createdAt: now,
        updatedAt: now,
      });
      assetsCreated += 1;

      await ctx.db.insert('calendarItems', {
        projectId: args.projectId,
        title: t.title,
        platform: t.platform,
        format: t.format,
        scheduledAt: t.scheduledAt,
        status: 'idea',
        distributionType: t.distributionType,
        cta: 'Register for the free masterclass',
        destination: 'Masterclass landing page',
        primaryMetric: t.distributionType === 'paid' ? 'cpa' : 'registrations',
        funnelStage: t.distributionType === 'paid' ? 'bridge' : 'attention',
        assetStatus: 'missing',
        relatedAssetId: assetId,
        campaignId: 'week-one-parrilla',
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
    }

    return {
      inserted,
      assets: assetsCreated,
      message: `Seeded ${inserted} calendar items and ${assetsCreated} linked assets.`,
    };
  },
});
