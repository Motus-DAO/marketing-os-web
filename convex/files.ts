import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createAssetReference = mutation({
  args: {
    projectId: v.id('projects'),
    storageId: v.string(),
    title: v.string(),
    mimeType: v.optional(v.string()),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId as any);
    const refId = await ctx.db.insert('references', {
      projectId: args.projectId,
      type: 'image',
      title: args.title,
      location: url ?? args.storageId,
      relatedEntityType: args.relatedEntityType,
      relatedEntityId: args.relatedEntityId,
      notes: args.notes,
      createdAt: args.createdAt,
    });
    return { refId, url };
  },
});

export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as any);
  },
});
