import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const listMetricsByAsset = query({
  args: {
    relatedAssetId: v.optional(v.id('assets')),
    relatedCampaignId: v.optional(v.string()),
    projectId: v.optional(v.id('projects')),
  },
  handler: async (ctx, args) => {
    if (args.relatedAssetId) {
      return await ctx.db
        .query('metricsSnapshots')
        .withIndex('by_related_asset', (q) => q.eq('relatedAssetId', args.relatedAssetId!))
        .collect();
    }
    if (args.projectId) {
      return await ctx.db
        .query('metricsSnapshots')
        .withIndex('by_project', (q) => q.eq('projectId', args.projectId!))
        .take(200);
    }
    return [];
  },
});

export const recordMetricSnapshot = mutation({
  args: {
    projectId: v.id('projects'),
    channel: v.string(),
    metricName: v.string(),
    metricValue: v.float64(),
    timeframe: v.optional(v.string()),
    relatedAssetId: v.optional(v.id('assets')),
    relatedCampaignId: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');

    return await ctx.db.insert('metricsSnapshots', {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const createLearningFromMetric = mutation({
  args: {
    projectId: v.id('projects'),
    title: v.string(),
    outcome: v.optional(v.string()),
    interpretation: v.optional(v.string()),
    relatedAssetId: v.optional(v.id('assets')),
    relatedCampaignId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('learnings', {
      projectId: args.projectId,
      title: args.title,
      outcome: args.outcome,
      interpretation: args.interpretation,
      relatedAssetId: args.relatedAssetId,
      relatedCampaignId: args.relatedCampaignId,
      replicate: 'conditional',
      createdAt: new Date().toISOString(),
    });
  },
});
