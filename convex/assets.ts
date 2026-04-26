import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const approvalStateValidator = v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'));
const assetVersionStatusValidator = v.union(v.literal('candidate'), v.literal('approved'), v.literal('rejected'));
const authorTypeValidator = v.union(v.literal('human'), v.literal('agent'));

async function getAssetOrThrow(ctx: any, assetId: any) {
  const asset = await ctx.db.get(assetId);
  if (!asset) {
    throw new Error('Asset not found');
  }
  return asset;
}

async function getAssetVersionOrThrow(ctx: any, assetVersionId: any) {
  const version = await ctx.db.get(assetVersionId);
  if (!version) {
    throw new Error('Asset version not found');
  }
  return version;
}

export const listAssetsByProject = query({
  args: {
    projectId: v.id('projects'),
    approvalState: v.optional(approvalStateValidator),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let assets = args.status
      ? await ctx.db.query('assets').withIndex('by_project_status', (q) => q.eq('projectId', args.projectId).eq('status', args.status!)).collect()
      : await ctx.db.query('assets').withIndex('by_project', (q) => q.eq('projectId', args.projectId)).collect();

    if (args.approvalState) {
      assets = assets.filter((asset) => asset.approvalState === args.approvalState);
    }

    return assets;
  },
});

export const getAssetDetail = query({
  args: {
    assetId: v.id('assets'),
  },
  handler: async (ctx, args) => {
    const asset = await getAssetOrThrow(ctx, args.assetId);
    const [currentVersion, versions, notes] = await Promise.all([
      asset.currentVersionId ? ctx.db.get(asset.currentVersionId) : null,
      ctx.db.query('assetVersions').withIndex('by_asset', (q) => q.eq('assetId', args.assetId)).collect(),
      ctx.db.query('reviewNotes').withIndex('by_asset', (q) => q.eq('assetId', args.assetId)).collect(),
    ]);

    return {
      asset,
      currentVersion,
      versions,
      notes,
    };
  },
});

export const listVersionsByAsset = query({
  args: {
    assetId: v.id('assets'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query('assetVersions').withIndex('by_asset', (q) => q.eq('assetId', args.assetId)).collect();
  },
});

export const listNotesByAsset = query({
  args: {
    assetId: v.id('assets'),
    assetVersionId: v.optional(v.id('assetVersions')),
  },
  handler: async (ctx, args) => {
    if (args.assetVersionId) {
      return await ctx.db
        .query('reviewNotes')
        .withIndex('by_asset_version', (q) => q.eq('assetVersionId', args.assetVersionId!))
        .collect();
    }

    return await ctx.db.query('reviewNotes').withIndex('by_asset', (q) => q.eq('assetId', args.assetId)).collect();
  },
});

export const createAssetVersion = mutation({
  args: {
    projectId: v.id('projects'),
    assetId: v.id('assets'),
    versionLabel: v.string(),
    coverImageUrl: v.optional(v.string()),
    previewUrls: v.optional(v.array(v.string())),
    status: assetVersionStatusValidator,
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    setAsCurrent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const asset = await getAssetOrThrow(ctx, args.assetId);
    if (asset.projectId !== args.projectId) {
      throw new Error('Asset does not belong to project');
    }

    const versionId = await ctx.db.insert('assetVersions', {
      projectId: args.projectId,
      assetId: args.assetId,
      versionLabel: args.versionLabel,
      coverImageUrl: args.coverImageUrl,
      previewUrls: args.previewUrls,
      status: args.status,
      notes: args.notes,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });

    if (args.setAsCurrent) {
      await ctx.db.patch(args.assetId, {
        currentVersionId: versionId,
        updatedAt: args.updatedAt,
      });
    }

    return versionId;
  },
});

export const createReviewNote = mutation({
  args: {
    projectId: v.id('projects'),
    assetId: v.id('assets'),
    assetVersionId: v.optional(v.id('assetVersions')),
    note: v.string(),
    authorType: authorTypeValidator,
    authorId: v.optional(v.string()),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const asset = await getAssetOrThrow(ctx, args.assetId);
    if (asset.projectId !== args.projectId) {
      throw new Error('Asset does not belong to project');
    }

    if (args.assetVersionId) {
      const version = await getAssetVersionOrThrow(ctx, args.assetVersionId);
      if (version.assetId !== args.assetId || version.projectId !== args.projectId) {
        throw new Error('Asset version does not belong to asset/project');
      }
    }

    return await ctx.db.insert('reviewNotes', args);
  },
});

export const setCurrentVersion = mutation({
  args: {
    assetId: v.id('assets'),
    assetVersionId: v.id('assetVersions'),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const [asset, version] = await Promise.all([
      getAssetOrThrow(ctx, args.assetId),
      getAssetVersionOrThrow(ctx, args.assetVersionId),
    ]);

    if (version.assetId !== args.assetId || version.projectId !== asset.projectId) {
      throw new Error('Asset version does not belong to asset');
    }

    await ctx.db.patch(args.assetId, {
      currentVersionId: args.assetVersionId,
      updatedAt: args.updatedAt,
    });

    return args.assetId;
  },
});

export const updateAssetVersionPreviewUrls = mutation({
  args: {
    assetVersionId: v.id('assetVersions'),
    previewUrls: v.array(v.string()),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const version = await getAssetVersionOrThrow(ctx, args.assetVersionId);
    await ctx.db.patch(version._id, {
      previewUrls: args.previewUrls,
      updatedAt: args.updatedAt,
    });
    return version._id;
  },
});

export const approveVersion = mutation({
  args: {
    assetId: v.id('assets'),
    assetVersionId: v.id('assetVersions'),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const [asset, version] = await Promise.all([
      getAssetOrThrow(ctx, args.assetId),
      getAssetVersionOrThrow(ctx, args.assetVersionId),
    ]);

    if (version.assetId !== args.assetId || version.projectId !== asset.projectId) {
      throw new Error('Asset version does not belong to asset');
    }

    await Promise.all([
      ctx.db.patch(args.assetVersionId, {
        status: 'approved',
        updatedAt: args.updatedAt,
      }),
      ctx.db.patch(args.assetId, {
        currentVersionId: args.assetVersionId,
        approvalState: 'approved',
        updatedAt: args.updatedAt,
      }),
    ]);

    return args.assetVersionId;
  },
});

export const rejectVersion = mutation({
  args: {
    assetId: v.id('assets'),
    assetVersionId: v.id('assetVersions'),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const [asset, version] = await Promise.all([
      getAssetOrThrow(ctx, args.assetId),
      getAssetVersionOrThrow(ctx, args.assetVersionId),
    ]);

    if (version.assetId !== args.assetId || version.projectId !== asset.projectId) {
      throw new Error('Asset version does not belong to asset');
    }

    await Promise.all([
      ctx.db.patch(args.assetVersionId, {
        status: 'rejected',
        updatedAt: args.updatedAt,
      }),
      ctx.db.patch(args.assetId, {
        approvalState: 'rejected',
        updatedAt: args.updatedAt,
      }),
    ]);

    return args.assetVersionId;
  },
});
