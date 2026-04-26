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

    for (const doc of [...comments, ...notes, ...versions, ...assets, ...refs, ...tasks, ...runs, ...approvals, ...memoryEntries, ...decisions, ...learnings, ...metrics, ...workspaces]) {
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
