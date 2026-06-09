import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteProjectCascade = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const assets = await ctx.db
      .query("assets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const versions = await ctx.db
      .query("assetVersions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const notes = await ctx.db
      .query("reviewNotes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const comments = await ctx.db
      .query("feedbackComments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const refs = await ctx.db
      .query("references")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const memoryEntries = await ctx.db
      .query("memoryEntries")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const decisions = await ctx.db
      .query("decisions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const learnings = await ctx.db
      .query("learnings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const metrics = await ctx.db
      .query("metricsSnapshots")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const calendarItems = await ctx.db
      .query("calendarItems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const doc of [...comments, ...notes, ...versions, ...calendarItems, ...assets, ...refs, ...tasks, ...runs, ...approvals, ...memoryEntries, ...decisions, ...learnings, ...metrics, ...workspaces]) {
      await ctx.db.delete(doc._id);
    }

    await ctx.db.delete(args.projectId);
    return args.projectId;
  },
});

export const renameProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    await ctx.db.patch(args.projectId, {
      name: args.name,
      slug: args.slug,
      description: args.description,
      updatedAt: new Date().toISOString(),
    });

    return args.projectId;
  },
});

export const deleteProjectContentOutsideCampaign = mutation({
  args: {
    projectId: v.id("projects"),
    keepCampaignId: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const calendarItems = await ctx.db
      .query("calendarItems")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const assets = await ctx.db
      .query("assets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const removableCalendar = calendarItems.filter((item) => (item.campaignId ?? "") !== args.keepCampaignId);
    const removableAssetIds = new Set(
      assets
        .filter((asset) => (asset.campaignId ?? "") !== args.keepCampaignId)
        .map((asset) => String(asset._id))
    );

    const versions = await ctx.db
      .query("assetVersions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const notes = await ctx.db
      .query("reviewNotes")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const comments = await ctx.db
      .query("feedbackComments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const refs = await ctx.db
      .query("references")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const learnings = await ctx.db
      .query("learnings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const metrics = await ctx.db
      .query("metricsSnapshots")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const doc of removableCalendar) {
      await ctx.db.delete(doc._id);
    }

    for (const doc of comments) {
      if (removableAssetIds.has(String(doc.assetId))) await ctx.db.delete(doc._id);
    }
    for (const doc of notes) {
      if (removableAssetIds.has(String(doc.assetId))) await ctx.db.delete(doc._id);
    }
    for (const doc of versions) {
      if (removableAssetIds.has(String(doc.assetId))) await ctx.db.delete(doc._id);
    }
    for (const doc of tasks) {
      if (doc.relatedAssetId && removableAssetIds.has(String(doc.relatedAssetId))) await ctx.db.delete(doc._id);
    }
    for (const doc of approvals) {
      if (doc.resourceType === "asset" && removableAssetIds.has(doc.resourceId)) await ctx.db.delete(doc._id);
    }
    for (const doc of runs) {
      if (doc.relatedAssetId && removableAssetIds.has(String(doc.relatedAssetId))) await ctx.db.delete(doc._id);
    }
    for (const doc of refs) {
      if (doc.relatedEntityType === "asset" && doc.relatedEntityId && removableAssetIds.has(doc.relatedEntityId)) {
        await ctx.db.delete(doc._id);
      }
    }
    for (const doc of learnings) {
      if (doc.relatedAssetId && removableAssetIds.has(String(doc.relatedAssetId))) await ctx.db.delete(doc._id);
    }
    for (const doc of metrics) {
      if (doc.relatedAssetId && removableAssetIds.has(String(doc.relatedAssetId))) await ctx.db.delete(doc._id);
    }

    for (const asset of assets) {
      if (removableAssetIds.has(String(asset._id))) await ctx.db.delete(asset._id);
    }

    return {
      keptCampaignId: args.keepCampaignId,
      removedCalendar: removableCalendar.length,
      removedAssets: removableAssetIds.size,
    };
  },
});
