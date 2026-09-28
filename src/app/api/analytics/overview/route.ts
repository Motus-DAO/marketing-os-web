import { NextRequest, NextResponse } from "next/server";
import {
  heatmapLinksForSite,
  isPostHogQueryConfigured,
  posthogHeatmapsUrl,
  posthogProjectAppUrl,
  rangeIntervalSql,
  runHogQL,
  siteFilterSql,
} from "@/lib/posthog-query";
import {
  isCallerResponse,
  requireHumanOrAgent,
} from "@/lib/auth/require-caller";

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

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export async function GET(request: NextRequest) {
  const caller = await requireHumanOrAgent(request);
  if (isCallerResponse(caller)) return caller;

  const site = request.nextUrl.searchParams.get("site") || "all";
  const range = request.nextUrl.searchParams.get("range") || "7d";
  const heatmaps = {
    projectUrl: posthogProjectAppUrl(),
    heatmapsHome: posthogHeatmapsUrl(),
    sites: heatmapLinksForSite(site),
  };

  if (!isPostHogQueryConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        site,
        range,
        heatmaps,
        error:
          "Missing POSTHOG_PERSONAL_API_KEY or POSTHOG_PROJECT_ID. Add them in Vercel (server-only, not NEXT_PUBLIC_).",
      },
      { status: 503 },
    );
  }

  const interval = rangeIntervalSql(range);
  const siteSql = siteFilterSql(site);
  const pageviewWhere = `event = '$pageview' AND timestamp >= now() - ${interval}${siteSql}`;
  const pageleaveWhere = `event = '$pageleave' AND timestamp >= now() - ${interval}${siteSql}`;

  try {
    // UTM params are set on $pageview when the landing URL includes ?utm_*.
    // Prefer event properties (utm_source / utm_medium / utm_campaign) over person $initial_*.
    const utmSourceExpr = `coalesce(nullIf(toString(properties.utm_source), ''), '(none)')`;
    const utmMediumExpr = `coalesce(nullIf(toString(properties.utm_medium), ''), '(none)')`;
    const utmCampaignExpr = `coalesce(nullIf(toString(properties.utm_campaign), ''), '(none)')`;

    const [
      totals,
      trend,
      pages,
      sources,
      timeOnPage,
      sessionDuration,
      bounce,
      devices,
      countries,
      utmSources,
      utmCampaigns,
      utmCombos,
      topCtas,
    ] = await Promise.all([
      runHogQL(
        `SELECT count() AS pageviews, count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${pageviewWhere}`,
        "mos_overview_totals",
      ),
      runHogQL(
        `SELECT toDate(timestamp) AS day, count() AS pageviews, count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${pageviewWhere}
         GROUP BY day
         ORDER BY day`,
        "mos_overview_trend",
      ),
      runHogQL(
        `SELECT properties.$pathname AS path, count() AS views, count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${pageviewWhere}
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
         WHERE ${pageviewWhere}
         GROUP BY source
         ORDER BY views DESC
         LIMIT 8`,
        "mos_overview_sources",
      ),
      // Avg time on page from $pageleave.$prev_pageview_duration (seconds).
      runHogQL(
        `SELECT avg(toFloat(properties.$prev_pageview_duration)) AS avg_time_on_page
         FROM events
         WHERE ${pageleaveWhere}
           AND properties.$prev_pageview_duration IS NOT NULL`,
        "mos_overview_time_on_page",
      ),
      // Avg session duration = span of pageviews within $session_id.
      runHogQL(
        `SELECT avg(duration) AS avg_session_seconds
         FROM (
           SELECT
             properties.$session_id AS sid,
             dateDiff('second', min(timestamp), max(timestamp)) AS duration
           FROM events
           WHERE ${pageviewWhere}
             AND properties.$session_id IS NOT NULL
           GROUP BY sid
         )`,
        "mos_overview_session_duration",
      ),
      // Bounce ≈ sessions with exactly one $pageview.
      runHogQL(
        `SELECT
           countIf(pv = 1) AS bounced_sessions,
           count() AS sessions
         FROM (
           SELECT
             properties.$session_id AS sid,
             count() AS pv
           FROM events
           WHERE ${pageviewWhere}
             AND properties.$session_id IS NOT NULL
           GROUP BY sid
         )`,
        "mos_overview_bounce",
      ),
      runHogQL(
        `SELECT
           coalesce(nullIf(properties.$device_type, ''), 'Unknown') AS device,
           count() AS views,
           count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${pageviewWhere}
         GROUP BY device
         ORDER BY views DESC
         LIMIT 8`,
        "mos_overview_devices",
      ),
      runHogQL(
        `SELECT
           coalesce(nullIf(properties.$geoip_country_name, ''), 'Unknown') AS country,
           count() AS views,
           count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${pageviewWhere}
         GROUP BY country
         ORDER BY views DESC
         LIMIT 10`,
        "mos_overview_countries",
      ),
      runHogQL(
        `SELECT
           ${utmSourceExpr} AS utm_source,
           count() AS views,
           count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${pageviewWhere}
         GROUP BY utm_source
         ORDER BY views DESC
         LIMIT 8`,
        "mos_overview_utm_sources",
      ),
      runHogQL(
        `SELECT
           ${utmCampaignExpr} AS utm_campaign,
           count() AS views,
           count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${pageviewWhere}
         GROUP BY utm_campaign
         ORDER BY views DESC
         LIMIT 8`,
        "mos_overview_utm_campaigns",
      ),
      runHogQL(
        `SELECT
           ${utmSourceExpr} AS source,
           ${utmMediumExpr} AS medium,
           ${utmCampaignExpr} AS campaign,
           count() AS views,
           count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE ${pageviewWhere}
         GROUP BY source, medium, campaign
         ORDER BY views DESC
         LIMIT 15`,
        "mos_overview_utm_combos",
      ),
      runHogQL(
        `SELECT
           coalesce(nullIf(toString(properties.label), ''), '(untitled)') AS label,
           count() AS clicks,
           count(DISTINCT distinct_id) AS visitors
         FROM events
         WHERE event = 'cta_click'
           AND timestamp >= now() - ${interval}${siteSql}
         GROUP BY label
         ORDER BY clicks DESC
         LIMIT 12`,
        "mos_overview_top_ctas",
      ),
    ]);

    const totalRow = totals.results?.[0];
    const pageviews = num(totalRow, 0);
    const visitors = num(totalRow, 1);

    const avgTimeOnPageSeconds = round1(num(timeOnPage.results?.[0], 0));
    const avgSessionSeconds = round1(num(sessionDuration.results?.[0], 0));

    const bounceRow = bounce.results?.[0];
    const bouncedSessions = num(bounceRow, 0);
    const sessions = num(bounceRow, 1);
    const bounceRate =
      sessions > 0 ? round1((bouncedSessions / sessions) * 100) : 0;

    const topPages = (pages.results || []).map((row) => ({
      path: str(row, 0) || "/",
      views: num(row, 1),
      visitors: num(row, 2),
    }));

    return NextResponse.json({
      configured: true,
      site,
      range,
      generatedAt: new Date().toISOString(),
      kpis: {
        visitors,
        pageviews,
        pagesPerVisit: visitors > 0 ? round1(pageviews / visitors) : 0,
        avgTimeOnPageSeconds,
        avgSessionSeconds,
        bounceRate,
        sessions,
      },
      trend: (trend.results || []).map((row) => ({
        day: str(row, 0),
        pageviews: num(row, 1),
        visitors: num(row, 2),
      })),
      topPages,
      topSources: (sources.results || []).map((row) => ({
        source: str(row, 0),
        views: num(row, 1),
        visitors: num(row, 2),
      })),
      devices: (devices.results || []).map((row) => ({
        device: str(row, 0),
        views: num(row, 1),
        visitors: num(row, 2),
      })),
      countries: (countries.results || []).map((row) => ({
        country: str(row, 0),
        views: num(row, 1),
        visitors: num(row, 2),
      })),
      utmSources: (utmSources.results || []).map((row) => ({
        source: str(row, 0) || "(none)",
        views: num(row, 1),
        visitors: num(row, 2),
      })),
      utmCampaigns: (utmCampaigns.results || []).map((row) => ({
        campaign: str(row, 0) || "(none)",
        views: num(row, 1),
        visitors: num(row, 2),
      })),
      utmCombos: (utmCombos.results || []).map((row) => ({
        source: str(row, 0) || "(none)",
        medium: str(row, 1) || "(none)",
        campaign: str(row, 2) || "(none)",
        views: num(row, 3),
        visitors: num(row, 4),
      })),
      topCtas: (topCtas.results || []).map((row) => ({
        label: str(row, 0) || "(untitled)",
        clicks: num(row, 1),
        visitors: num(row, 2),
      })),
      heatmaps: {
        ...heatmaps,
        // Extra deep links for top paths when a single site is selected.
        topPaths:
          site !== "all" && heatmaps.sites[0]
            ? topPages.slice(0, 5).map((page) => {
                const origin = heatmaps.sites[0].url.replace(/\/$/, "");
                const path = page.path.startsWith("/") ? page.path : `/${page.path}`;
                const fullUrl = `${origin}${path === "/" ? "" : path}` || origin;
                return {
                  path: page.path,
                  views: page.views,
                  url: fullUrl,
                  heatmapUrl: posthogHeatmapsUrl(fullUrl),
                };
              })
            : [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown PostHog error";
    return NextResponse.json(
      { configured: true, site, range, heatmaps, error: message },
      { status: 502 },
    );
  }
}
