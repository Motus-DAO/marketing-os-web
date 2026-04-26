import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal('active'), v.literal('paused'), v.literal('archived')),
    primaryGoals: v.optional(v.array(v.string())),
    primaryMonetizationPath: v.optional(v.string()),
    activeChannels: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_slug', ['slug'])
    .index('by_status', ['status']),

  workspaces: defineTable({
    projectId: v.id('projects'),
    type: v.union(v.literal('notion'), v.literal('filesystem'), v.literal('convex'), v.literal('openclaw'), v.literal('other')),
    identifier: v.string(),
    label: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_type', ['projectId', 'type']),

  references: defineTable({
    projectId: v.id('projects'),
    type: v.union(
      v.literal('notion_page'),
      v.literal('file'),
      v.literal('folder'),
      v.literal('url'),
      v.literal('image'),
      v.literal('render_output'),
      v.literal('prompt'),
      v.literal('other')
    ),
    title: v.string(),
    location: v.string(),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_related_entity', ['relatedEntityType', 'relatedEntityId'])
    .index('by_type', ['type']),

  assets: defineTable({
    projectId: v.id('projects'),
    title: v.string(),
    platform: v.string(),
    format: v.string(),
    funnelStage: v.string(),
    objective: v.optional(v.string()),
    audienceSummary: v.optional(v.string()),
    status: v.string(),
    version: v.optional(v.string()),
    sourceIdeaTitle: v.optional(v.string()),
    cta: v.optional(v.string()),
    campaignId: v.optional(v.string()),
    primaryReferenceId: v.optional(v.id('references')),
    currentVersionId: v.optional(v.id('assetVersions')),
    notionPageUrl: v.optional(v.string()),
    approvalState: v.optional(v.union(v.literal('pending'), v.literal('in_review'), v.literal('approved'), v.literal('rejected'), v.literal('needs_changes'))),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_status', ['projectId', 'status'])
    .index('by_project_platform', ['projectId', 'platform'])
    .index('by_project_approval_state', ['projectId', 'approvalState'])
    .index('by_campaign', ['campaignId']),

  assetVersions: defineTable({
    projectId: v.id('projects'),
    assetId: v.id('assets'),
    versionLabel: v.string(),
    coverImageUrl: v.optional(v.string()),
    previewUrls: v.optional(v.array(v.string())),
    status: v.union(v.literal('candidate'), v.literal('in_review'), v.literal('approved'), v.literal('rejected'), v.literal('needs_changes')),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_asset', ['assetId'])
    .index('by_asset_status', ['assetId', 'status'])
    .index('by_project', ['projectId']),

  reviewNotes: defineTable({
    projectId: v.id('projects'),
    assetId: v.id('assets'),
    assetVersionId: v.optional(v.id('assetVersions')),
    note: v.string(),
    authorType: v.union(v.literal('human'), v.literal('agent')),
    authorId: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index('by_asset', ['assetId'])
    .index('by_asset_version', ['assetVersionId'])
    .index('by_project', ['projectId']),

  feedbackComments: defineTable({
    projectId: v.id('projects'),
    assetId: v.id('assets'),
    assetVersionId: v.optional(v.id('assetVersions')),
    scopeType: v.union(v.literal('asset'), v.literal('slide')),
    slideIndex: v.optional(v.number()),
    body: v.string(),
    referenceImageUrl: v.optional(v.string()),
    referenceLabel: v.optional(v.string()),
    authorType: v.union(v.literal('human'), v.literal('agent')),
    authorId: v.optional(v.string()),
    status: v.union(v.literal('open'), v.literal('resolved')),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_asset', ['assetId'])
    .index('by_asset_version', ['assetVersionId'])
    .index('by_asset_scope', ['assetId', 'scopeType'])
    .index('by_asset_version_scope', ['assetVersionId', 'scopeType'])
    .index('by_project', ['projectId']),

  tasks: defineTable({
    projectId: v.id('projects'),
    title: v.string(),
    type: v.string(),
    status: v.string(),
    priority: v.string(),
    ownerType: v.union(v.literal('human'), v.literal('agent')),
    ownerId: v.optional(v.string()),
    relatedAssetId: v.optional(v.id('assets')),
    relatedCampaignId: v.optional(v.string()),
    nextActionSummary: v.optional(v.string()),
    dueAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_status', ['projectId', 'status'])
    .index('by_owner', ['ownerType', 'ownerId'])
    .index('by_related_asset', ['relatedAssetId']),

  agentRuns: defineTable({
    projectId: v.id('projects'),
    agentType: v.string(),
    taskType: v.string(),
    inputSummary: v.optional(v.string()),
    outputSummary: v.optional(v.string()),
    status: v.string(),
    relatedAssetId: v.optional(v.id('assets')),
    relatedTaskId: v.optional(v.id('tasks')),
    relatedReferenceIds: v.optional(v.array(v.id('references'))),
    startedAt: v.optional(v.string()),
    finishedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_status', ['projectId', 'status'])
    .index('by_agent_type', ['agentType'])
    .index('by_related_asset', ['relatedAssetId'])
    .index('by_related_task', ['relatedTaskId']),

  approvals: defineTable({
    projectId: v.id('projects'),
    resourceType: v.string(),
    resourceId: v.string(),
    requestedByType: v.string(),
    requestedById: v.optional(v.string()),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_status', ['projectId', 'status'])
    .index('by_resource', ['resourceType', 'resourceId']),

  memoryEntries: defineTable({
    projectId: v.id('projects'),
    type: v.union(
      v.literal('summary'),
      v.literal('decision'),
      v.literal('next_action'),
      v.literal('learning'),
      v.literal('reference'),
      v.literal('genesis')
    ),
    title: v.string(),
    body: v.string(),
    tags: v.optional(v.array(v.string())),
    sourceRefIds: v.optional(v.array(v.id('references'))),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    status: v.optional(v.string()),
    supersededById: v.optional(v.id('memoryEntries')),
    createdByType: v.optional(v.string()),
    createdById: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_type', ['projectId', 'type'])
    .index('by_related_entity', ['relatedEntityType', 'relatedEntityId'])
    .index('by_status', ['status']),

  decisions: defineTable({
    projectId: v.id('projects'),
    title: v.string(),
    decision: v.string(),
    rationale: v.optional(v.string()),
    impactArea: v.optional(v.string()),
    relatedRefIds: v.optional(v.array(v.id('references'))),
    supersededById: v.optional(v.id('decisions')),
    createdAt: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_impact_area', ['impactArea']),

  learnings: defineTable({
    projectId: v.id('projects'),
    title: v.string(),
    hypothesis: v.optional(v.string()),
    actionTaken: v.optional(v.string()),
    outcome: v.optional(v.string()),
    interpretation: v.optional(v.string()),
    replicate: v.union(v.literal('yes'), v.literal('no'), v.literal('conditional')),
    conditions: v.optional(v.string()),
    relatedAssetId: v.optional(v.id('assets')),
    relatedCampaignId: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_replicate', ['replicate'])
    .index('by_related_asset', ['relatedAssetId'])
    .index('by_related_campaign', ['relatedCampaignId']),

  metricsSnapshots: defineTable({
    projectId: v.id('projects'),
    channel: v.string(),
    metricName: v.string(),
    metricValue: v.float64(),
    timeframe: v.optional(v.string()),
    relatedAssetId: v.optional(v.id('assets')),
    relatedCampaignId: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_channel', ['projectId', 'channel'])
    .index('by_metric_name', ['metricName'])
    .index('by_related_asset', ['relatedAssetId'])
    .index('by_related_campaign', ['relatedCampaignId']),
});
