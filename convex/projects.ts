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
