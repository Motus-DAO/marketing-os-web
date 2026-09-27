type HogQLResult = {
  results?: unknown[][];
  columns?: string[];
  error?: string;
};

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
