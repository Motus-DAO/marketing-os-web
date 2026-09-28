type HogQLResult = {
  results?: unknown[][];
  columns?: string[];
  error?: string;
};

export const TRACKED_SITES = [
  { id: "academia", label: "Academia", url: "https://academia.motusdao.org" },
  { id: "hub", label: "Hub", url: "https://app.motusdao.org" },
  { id: "landing", label: "Landing", url: "https://www.motusdao.org" },
] as const;

export type TrackedSiteId = (typeof TRACKED_SITES)[number]["id"];

function posthogConfig() {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
  const host = (process.env.POSTHOG_HOST || "https://us.posthog.com").replace(/\/$/, "");
  return { apiKey, projectId, host };
}

export function isPostHogQueryConfigured() {
  const { apiKey, projectId } = posthogConfig();
  return Boolean(apiKey && projectId);
}

/** Public PostHog app base for deep links (prefer NEXT_PUBLIC_POSTHOG_APP_URL with /project/<id>). */
export function posthogProjectAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_POSTHOG_APP_URL?.trim().replace(/\/$/, "");
  if (appUrl && /\/project\/[^/]+/.test(appUrl)) return appUrl;

  const { host, projectId } = posthogConfig();
  if (projectId) return `${host}/project/${projectId}`;
  return appUrl || host;
}

/**
 * Deep link into PostHog Heatmaps. Prefer project-scoped app URL.
 * `pageUrl` is passed as a hint query param; operators may still need to confirm the URL in PostHog.
 */
export function posthogHeatmapsUrl(pageUrl?: string) {
  const base = `${posthogProjectAppUrl()}/heatmaps`;
  if (!pageUrl) return base;
  const params = new URLSearchParams({ url: pageUrl });
  return `${base}?${params.toString()}`;
}

export function heatmapLinksForSite(site: string | null | undefined) {
  const filtered =
    site && site !== "all"
      ? TRACKED_SITES.filter((s) => s.id === site)
      : [...TRACKED_SITES];

  return filtered.map((s) => ({
    id: s.id,
    label: s.label,
    url: s.url,
    heatmapUrl: posthogHeatmapsUrl(s.url),
  }));
}

export async function runHogQL(query: string, name: string): Promise<HogQLResult> {
  const { apiKey, projectId, host } = posthogConfig();
  if (!apiKey || !projectId) {
    throw new Error("PostHog query API is not configured");
  }

  const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: { kind: "HogQLQuery", query },
      name,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as HogQLResult & { detail?: string };
  if (!response.ok) {
    throw new Error(data.detail || data.error || `PostHog query failed (${response.status})`);
  }
  return data;
}

export function siteFilterSql(site: string | null | undefined) {
  if (!site || site === "all") return "";
  if (!["academia", "hub", "landing"].includes(site)) return "";
  return ` AND properties.site = '${site}'`;
}

export function rangeIntervalSql(range: string | null | undefined) {
  if (range === "30d") return "INTERVAL 30 DAY";
  if (range === "24h") return "INTERVAL 1 DAY";
  return "INTERVAL 7 DAY";
}
