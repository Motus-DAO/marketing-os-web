import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const createProject = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal('active'), v.literal('paused'), v.literal('archived')),
    primaryGoals: v.optional(v.array(v.string())),
    primaryMonetizationPath: v.optional(v.string()),
    activeChannels: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('projects', args);
  },
});

export const listProjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('projects').collect();
  },
});

export const MASTERCLASS_SLUG = 'psicologia-digital-masterclass';

export const getMasterclassProject = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('projects')
      .withIndex('by_slug', (q) => q.eq('slug', MASTERCLASS_SLUG))
      .first();
  },
});

export const seedMasterclassProject = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('projects')
      .withIndex('by_slug', (q) => q.eq('slug', MASTERCLASS_SLUG))
      .first();

    if (existing) {
      return { projectId: existing._id, created: false, message: 'Masterclass project already exists.' };
    }

    const now = new Date().toISOString();
    const projectId = await ctx.db.insert('projects', {
      name: 'Psicología Digital – Masterclass',
      slug: MASTERCLASS_SLUG,
      description:
        'Fase 7 distribution: masterclass registration funnel for psychologists.',
      status: 'active',
      primaryGoals: [
        'Drive masterclass registrations',
        'Build trust on Instagram profile',
        'Validate paid acquisition via Meta Ads',
      ],
      primaryMonetizationPath:
        'Content → profile/landing → free masterclass → attendance → paid course',
      activeChannels: ['instagram', 'meta_ads', 'whatsapp', 'newsletter', 'linkedin'],
      createdAt: now,
      updatedAt: now,
    });

    return { projectId, created: true, message: 'Masterclass project created.' };
  },
});

export const listProjectMetricSummary = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query('metricsSnapshots')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .take(500);

    const sum = (name: string) =>
      snapshots
        .filter((s) => s.metricName === name)
        .reduce((acc, s) => acc + s.metricValue, 0);

    return {
      registrations: sum('registrations'),
      cpa: snapshots.find((s) => s.metricName === 'cpa')?.metricValue ?? null,
      link_clicks: sum('link_clicks'),
      snapshotCount: snapshots.length,
    };
  },
});
