import { v } from 'convex/values';

export const platformValidator = v.union(
  v.literal('instagram'),
  v.literal('tiktok'),
  v.literal('linkedin'),
  v.literal('x_twitter'),
  v.literal('youtube_shorts'),
  v.literal('youtube_long'),
  v.literal('newsletter'),
  v.literal('whatsapp'),
  v.literal('telegram'),
  v.literal('blog'),
  v.literal('forum'),
  v.literal('landing_page'),
  v.literal('meta_ads'),
  v.literal('google_ads'),
  v.literal('youtube_ads'),
  v.literal('tiktok_ads'),
  v.literal('linkedin_ads')
);

export const distributionTypeValidator = v.union(
  v.literal('organic'),
  v.literal('paid'),
  v.literal('both')
);

export const funnelStageValidator = v.union(
  v.literal('attention'),
  v.literal('trust'),
  v.literal('bridge'),
  v.literal('nurture'),
  v.literal('conversion'),
  v.literal('depth')
);

export const primaryMetricValidator = v.union(
  v.literal('reach'),
  v.literal('views'),
  v.literal('retention'),
  v.literal('saves'),
  v.literal('shares'),
  v.literal('profile_visits'),
  v.literal('link_clicks'),
  v.literal('registrations'),
  v.literal('attendance'),
  v.literal('purchases'),
  v.literal('ctr'),
  v.literal('cpc'),
  v.literal('cpa'),
  v.literal('roas')
);

export const contentKindValidator = v.union(
  v.literal('video'),
  v.literal('carousel'),
  v.literal('image'),
  v.literal('copy'),
  v.literal('mixed')
);

export const calendarStatusValidator = v.union(
  v.literal('idea'),
  v.literal('brief'),
  v.literal('in_production'),
  v.literal('needs_review'),
  v.literal('approved'),
  v.literal('scheduled'),
  v.literal('published'),
  v.literal('measured')
);

export type DistributionMetadata = {
  cta?: string | null;
  destination?: string | null;
  primaryMetric?: string | null;
  funnelStage?: string | null;
};

export function assertDistributionReady(
  meta: DistributionMetadata,
  context: 'asset_approval' | 'calendar_scheduled'
) {
  const missing: string[] = [];
  if (!meta.cta?.trim()) missing.push('cta');
  if (!meta.destination?.trim()) missing.push('destination');
  if (!meta.primaryMetric?.trim()) missing.push('primaryMetric');
  if (!meta.funnelStage?.trim()) missing.push('funnelStage');
  if (missing.length === 0) return;
  throw new Error(
    `Missing required distribution fields for ${context}: ${missing.join(', ')}`
  );
}

export function assetFieldsFromDistribution(args: {
  platform?: string;
  format?: string;
  funnelStage?: string;
  distributionType?: 'organic' | 'paid' | 'both';
  cta?: string;
  destination?: string;
  primaryMetric?: string;
  hook?: string;
  centralIdea?: string;
  copy?: string;
  objective?: string;
  contentKind?: 'video' | 'carousel' | 'image' | 'copy' | 'mixed';
  publishUrl?: string;
  notionPacketUrl?: string;
  brief?: string;
  script?: string;
  caption?: string;
  adConcept?: string;
}) {
  return args;
}
