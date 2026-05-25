import { CALENDAR_PLATFORMS, type CalendarPlatformId } from "./calendar-constants";

export { CALENDAR_PLATFORMS, type CalendarPlatformId };

export const FUNNEL_STAGES = [
  { id: "attention", label: "Attention" },
  { id: "trust", label: "Trust" },
  { id: "bridge", label: "Bridge (masterclass signup)" },
  { id: "nurture", label: "Nurture" },
  { id: "conversion", label: "Conversion" },
  { id: "depth", label: "Depth" },
] as const;

export type FunnelStageId = (typeof FUNNEL_STAGES)[number]["id"];

export const PRIMARY_METRICS = [
  { id: "reach", label: "Reach", category: "attention" },
  { id: "views", label: "Views", category: "attention" },
  { id: "retention", label: "Retention", category: "attention" },
  { id: "saves", label: "Saves", category: "trust" },
  { id: "shares", label: "Shares", category: "trust" },
  { id: "profile_visits", label: "Profile visits", category: "trust" },
  { id: "link_clicks", label: "Link clicks", category: "conversion" },
  { id: "registrations", label: "Registrations", category: "conversion" },
  { id: "attendance", label: "Attendance", category: "conversion" },
  { id: "purchases", label: "Purchases", category: "conversion" },
  { id: "ctr", label: "CTR", category: "paid" },
  { id: "cpc", label: "CPC", category: "paid" },
  { id: "cpa", label: "CPA", category: "paid" },
  { id: "roas", label: "ROAS", category: "paid" },
] as const;

export type PrimaryMetricId = (typeof PRIMARY_METRICS)[number]["id"];

export const DISTRIBUTION_TYPES = [
  { id: "organic", label: "Organic" },
  { id: "paid", label: "Paid" },
  { id: "both", label: "Both" },
] as const;

export const CONTENT_KINDS = [
  { id: "video", label: "Video / Reel" },
  { id: "carousel", label: "Carousel" },
  { id: "image", label: "Image" },
  { id: "copy", label: "Copy only" },
  { id: "mixed", label: "Mixed (copy + media)" },
] as const;

export type ContentKindId = (typeof CONTENT_KINDS)[number]["id"];

export const FORMATS_BY_PLATFORM: Record<string, { id: string; label: string }[]> = {
  instagram: [
    { id: "reel", label: "Reel" },
    { id: "carousel", label: "Carousel" },
    { id: "story", label: "Story" },
    { id: "post", label: "Post" },
    { id: "live", label: "Live" },
  ],
  meta_ads: [
    { id: "reel_ad", label: "Reel ad" },
    { id: "carousel_ad", label: "Carousel ad" },
    { id: "story_ad", label: "Story ad" },
    { id: "video_ad", label: "Video ad" },
  ],
  linkedin: [
    { id: "post", label: "Post" },
    { id: "document", label: "Document post" },
    { id: "carousel", label: "Carousel" },
  ],
  whatsapp: [{ id: "message", label: "Message" }],
  telegram: [{ id: "message", label: "Message" }],
  newsletter: [{ id: "email", label: "Email" }],
  tiktok: [{ id: "short", label: "Short video" }],
  youtube_shorts: [{ id: "short", label: "Short" }],
  youtube_long: [{ id: "long", label: "Long form" }],
  x_twitter: [{ id: "post", label: "Post" }, { id: "thread", label: "Thread" }],
};

export const CHANNEL_PRIORITY: Record<
  CalendarPlatformId,
  { priority: 1 | 2 | 3 | 4; label: string }
> = {
  instagram: { priority: 1, label: "P1" },
  meta_ads: { priority: 1, label: "P1" },
  whatsapp: { priority: 2, label: "P2" },
  newsletter: { priority: 2, label: "P2" },
  linkedin: { priority: 3, label: "P3" },
  tiktok: { priority: 4, label: "P4" },
  youtube_shorts: { priority: 4, label: "P4" },
  x_twitter: { priority: 4, label: "P4" },
  youtube_long: { priority: 4, label: "P4" },
  telegram: { priority: 4, label: "P4" },
  blog: { priority: 4, label: "P4" },
  forum: { priority: 4, label: "P4" },
  landing_page: { priority: 1, label: "P1" },
  google_ads: { priority: 4, label: "P4" },
  youtube_ads: { priority: 4, label: "P4" },
  tiktok_ads: { priority: 4, label: "P4" },
  linkedin_ads: { priority: 4, label: "P4" },
};

export const WEEK_ONE_QUOTAS = [
  { format: "reel", platform: "instagram", target: 3, label: "Reels" },
  { format: "carousel", platform: "instagram", target: 2, label: "Carousels" },
  { format: "story", platform: "instagram", target: 5, label: "Stories" },
  { format: "post", platform: "linkedin", target: 1, label: "LinkedIn posts" },
  { format: "message", platform: "whatsapp", target: 1, label: "WhatsApp/Telegram" },
  { format: "reel_ad", platform: "meta_ads", target: 2, label: "Meta ad creatives (min)" },
] as const;

export const MASTERCLASS_PROJECT = {
  name: "Psicología Digital – Masterclass",
  slug: "psicologia-digital-masterclass",
  description: "Fase 7 distribution: masterclass registration funnel for psychologists.",
  primaryGoals: [
    "Drive masterclass registrations",
    "Build trust on Instagram profile",
    "Validate paid acquisition via Meta Ads",
  ],
  primaryMonetizationPath:
    "Content → profile/landing → free masterclass → attendance → paid course",
  activeChannels: ["instagram", "meta_ads", "whatsapp", "newsletter", "linkedin"],
} as const;

export function labelForFunnel(id: string) {
  return FUNNEL_STAGES.find((f) => f.id === id)?.label ?? id;
}

export function labelForMetric(id: string) {
  return PRIMARY_METRICS.find((m) => m.id === id)?.label ?? id;
}

export function labelForContentKind(id: string) {
  return CONTENT_KINDS.find((k) => k.id === id)?.label ?? id;
}

export function formatsForPlatform(platform: string) {
  return FORMATS_BY_PLATFORM[platform] ?? [{ id: "other", label: "Other" }];
}

export function inferContentKind(format: string): ContentKindId {
  const f = format.toLowerCase();
  if (f.includes("reel") || f.includes("video") || f.includes("short")) return "video";
  if (f.includes("carousel")) return "carousel";
  if (f.includes("message") || f.includes("email") || f.includes("post") && !f.includes("carousel"))
    return "copy";
  if (f.includes("story") || f.includes("image")) return "image";
  return "mixed";
}

export function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(weekStart: Date) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function isoWeekKey(date: Date) {
  const start = getWeekStart(date);
  return start.toISOString().slice(0, 10);
}

export type DistributionWarning = { code: string; message: string };

export function distributionWarnings(meta: {
  distributionType?: string | null;
  cta?: string | null;
  destination?: string | null;
  primaryMetric?: string | null;
  funnelStage?: string | null;
  status?: string | null;
}): DistributionWarning[] {
  const warnings: DistributionWarning[] = [];
  const needsSchedule =
    meta.status === "scheduled" || meta.status === "approved" || meta.status === "published";

  if (needsSchedule && !meta.cta?.trim()) {
    warnings.push({ code: "missing_cta", message: "CTA is required before scheduling or publishing." });
  }
  if (needsSchedule && !meta.destination?.trim()) {
    warnings.push({ code: "missing_destination", message: "Destination is required before scheduling or publishing." });
  }
  if (needsSchedule && !meta.primaryMetric?.trim()) {
    warnings.push({ code: "missing_metric", message: "Primary metric is required before scheduling or publishing." });
  }
  if (needsSchedule && !meta.funnelStage?.trim()) {
    warnings.push({ code: "missing_funnel", message: "Funnel stage is required before scheduling or publishing." });
  }
  if (
    (meta.distributionType === "paid" || meta.distributionType === "both") &&
    (!meta.destination?.trim() || !meta.primaryMetric?.trim())
  ) {
    warnings.push({
      code: "paid_incomplete",
      message: "Paid distribution needs destination and primary metric defined.",
    });
  }
  return warnings;
}
