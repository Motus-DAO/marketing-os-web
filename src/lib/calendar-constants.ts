export const CALENDAR_PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x_twitter", label: "X/Twitter" },
  { id: "youtube_shorts", label: "YouTube Shorts" },
  { id: "youtube_long", label: "YouTube Long" },
  { id: "newsletter", label: "Newsletter" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telegram", label: "Telegram" },
  { id: "blog", label: "Blog" },
  { id: "forum", label: "Forum" },
  { id: "landing_page", label: "Landing Page" },
  { id: "meta_ads", label: "Meta Ads" },
  { id: "google_ads", label: "Google Ads" },
  { id: "youtube_ads", label: "YouTube Ads" },
  { id: "tiktok_ads", label: "TikTok Ads" },
  { id: "linkedin_ads", label: "LinkedIn Ads" },
] as const;

export type CalendarPlatformId = (typeof CALENDAR_PLATFORMS)[number]["id"];

export const CALENDAR_STATUSES = [
  { id: "idea", label: "Idea" },
  { id: "brief", label: "Brief" },
  { id: "in_production", label: "In Production" },
  { id: "needs_review", label: "Needs Review" },
  { id: "approved", label: "Approved" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
  { id: "measured", label: "Measured" },
] as const;

export type CalendarStatusId = (typeof CALENDAR_STATUSES)[number]["id"];

export const CALENDAR_DISTRIBUTION_TYPES = [
  { id: "organic", label: "Organic" },
  { id: "paid", label: "Paid" },
  { id: "both", label: "Both" },
] as const;

export type CalendarDistributionId = (typeof CALENDAR_DISTRIBUTION_TYPES)[number]["id"];

export const CALENDAR_ASSET_STATUSES = [
  { id: "missing", label: "Missing" },
  { id: "in_progress", label: "In Progress" },
  { id: "ready", label: "Ready" },
  { id: "needs_review", label: "Needs Review" },
] as const;

export type CalendarAssetStatusId = (typeof CALENDAR_ASSET_STATUSES)[number]["id"];

export function labelForPlatform(id: string) {
  return CALENDAR_PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

export function labelForStatus(id: string) {
  return CALENDAR_STATUSES.find((s) => s.id === id)?.label ?? id;
}

export function labelForDistribution(id: string) {
  return CALENDAR_DISTRIBUTION_TYPES.find((d) => d.id === id)?.label ?? id;
}

export function labelForAssetStatus(id: string) {
  return CALENDAR_ASSET_STATUSES.find((s) => s.id === id)?.label ?? id;
}

export function statusTone(status: string): "neutral" | "success" | "warning" | "danger" {
  if (status === "published" || status === "measured" || status === "approved") return "success";
  if (status === "needs_review") return "danger";
  if (status === "in_production" || status === "scheduled") return "warning";
  return "neutral";
}

export function assetStatusTone(status: string): "neutral" | "success" | "warning" | "danger" {
  if (status === "ready") return "success";
  if (status === "missing") return "danger";
  if (status === "needs_review") return "warning";
  return "neutral";
}
