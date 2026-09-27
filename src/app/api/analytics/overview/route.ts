import { NextRequest, NextResponse } from "next/server";
import {
  isPostHogQueryConfigured,
  rangeIntervalSql,
  runHogQL,
  siteFilterSql,
} from "@/lib/posthog-query";

export const dynamic = "force-dynamic";

function num(row: unknown[] | undefined, index = 0) {
  const value = row?.[index];
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function str(row: unknown[] | undefined, index = 0) {
  const value = row?.[index];
  return value == null ? "" : String(value);
}

export async function GET(request: NextRequest) {
  if (!isPostHogQueryConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        error:
          "Missing POSTHOG_PERSONAL_API_KEY or POSTHOG_PROJECT_ID. Add them in Vercel (server-only, not NEXT_PUBLIC_).",
      },
      { status: 503 },
    );
  }

  const site = request.nextUrl.searchParams.get("site") || "all";
  const range = request.nextUrl.searchParams.get("range") || "7d";
  const interval = rangeIntervalSql(range);
  const siteSql = siteFilterSql(site);
  const where = `event = '$pageview' AND timestamp >= now() - ${interval}${siteSql}`;

  try {
    const [totals, trend, pages, sources] = await Promise.all([
      runHogQL(
        `SELECT count() AS pageviews, count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${where}`,
        "mos_overview_totals",
      ),
      runHogQL(
        `SELECT toDate(timestamp) AS day, count() AS pageviews, count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${where}
         GROUP BY day
         ORDER BY day`,
        "mos_overview_trend",
      ),
      runHogQL(
        `SELECT properties.$pathname AS path, count() AS views, count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${where}
         GROUP BY path
         ORDER BY views DESC
         LIMIT 8`,
        "mos_overview_pages",
      ),
      runHogQL(
        `SELECT
           coalesce(nullIf(properties.$referring_domain, ''), '(direct)') AS source,
           count() AS views,
           count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${where}
         GROUP BY source
         ORDER BY views DESC
         LIMIT 8`,
        "mos_overview_sources",
      ),
    ]);

    const totalRow = totals.results?.[0];
    const pageviews = num(totalRow, 0);
    const visitors = num(totalRow, 1);

    return NextResponse.json({
      configured: true,
      site,
      range,
      generatedAt: new Date().toISOString(),
      kpis: {
        visitors,
        pageviews,
        pagesPerVisit: visitors > 0 ? Math.round((pageviews / visitors) * 10) / 10 : 0,
      },
      trend: (trend.results || []).map((row) => ({
        day: str(row, 0),
        pageviews: num(row, 1),
        visitors: num(row, 2),
      })),
      topPages: (pages.results || []).map((row) => ({
        path: str(row, 0) || "/",
        views: num(row, 1),
        visitors: num(row, 2),
      })),
      topSources: (sources.results || []).map((row) => ({
        source: str(row, 0),
        views: num(row, 1),
        visitors: num(row, 2),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown PostHog error";
    return NextResponse.json({ configured: true, error: message }, { status: 502 });
  }
}
