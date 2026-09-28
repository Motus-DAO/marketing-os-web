"use client";

import { useEffect, useMemo, useState } from "react";

type HeatmapSiteLink = {
  id: string;
  label: string;
  url: string;
  heatmapUrl: string;
};

type HeatmapPathLink = {
  path: string;
  views: number;
  url: string;
  heatmapUrl: string;
};

type OverviewResponse = {
  configured: boolean;
  error?: string;
  site?: string;
  range?: string;
  generatedAt?: string;
  kpis?: {
    visitors: number;
    pageviews: number;
    pagesPerVisit: number;
    avgTimeOnPageSeconds?: number;
    avgSessionSeconds?: number;
    bounceRate?: number;
    sessions?: number;
  };
  trend?: Array<{ day: string; pageviews: number; visitors: number }>;
  topPages?: Array<{ path: string; views: number; visitors: number }>;
  topSources?: Array<{ source: string; views: number; visitors: number }>;
  devices?: Array<{ device: string; views: number; visitors: number }>;
  countries?: Array<{ country: string; views: number; visitors: number }>;
  utmSources?: Array<{ source: string; views: number; visitors: number }>;
  utmCampaigns?: Array<{ campaign: string; views: number; visitors: number }>;
  utmCombos?: Array<{
    source: string;
    medium: string;
    campaign: string;
    views: number;
    visitors: number;
  }>;
  heatmaps?: {
    projectUrl: string;
    heatmapsHome: string;
    sites: HeatmapSiteLink[];
    topPaths?: HeatmapPathLink[];
  };
};

const SITES = [
  { id: "all", label: "All sites" },
  { id: "academia", label: "Academia" },
  { id: "hub", label: "Hub" },
  { id: "landing", label: "Landing" },
] as const;

const RANGES = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
] as const;

const FALLBACK_HEATMAP_SITES: HeatmapSiteLink[] = [
  {
    id: "academia",
    label: "Academia",
    url: "https://academia.motusdao.org",
    heatmapUrl: "",
  },
  {
    id: "hub",
    label: "Hub",
    url: "https://app.motusdao.org",
    heatmapUrl: "",
  },
  {
    id: "landing",
    label: "Landing",
    url: "https://www.motusdao.org",
    heatmapUrl: "",
  },
];

const POSTHOG_APP_URL =
  process.env.NEXT_PUBLIC_POSTHOG_APP_URL ?? "https://us.posthog.com";
const EMBED_URL = process.env.NEXT_PUBLIC_POSTHOG_EMBED_DASHBOARD_URL ?? "";

const ROADMAP = [
  { title: "Visitors & pageviews", status: "now", note: "KPI cards + trend" },
  { title: "Traffic sources", status: "now", note: "Referring domains" },
  { title: "Top pages", status: "now", note: "Paths by views" },
  { title: "Embedded PostHog dashboard", status: "now", note: "Optional iframe share link" },
  {
    title: "Heatmaps / click maps",
    status: "now",
    note: "Deep links into PostHog Heatmaps per site URL",
  },
  {
    title: "Time on page / bounce",
    status: "now",
    note: "Avg time, session duration, bounce via HogQL",
  },
  {
    title: "Devices & geo",
    status: "now",
    note: "Desktop/mobile/tablet + country breakdown",
  },
  {
    title: "UTM campaigns",
    status: "now",
    note: "utm_source / utm_campaign / combined source·medium·campaign",
  },
  { title: "Funnels (Academia → Hub pay)", status: "next", note: "MF-14 academy funnel" },
  { title: "Session replay", status: "later", note: "Keep off until sampling + privacy review" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDuration(seconds: number | undefined) {
  if (seconds == null || Number.isNaN(seconds) || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatPercent(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value}%`;
}

function BarList({
  items,
  labelKey,
  valueKey,
}: {
  items: Array<Record<string, string | number>>;
  labelKey: string;
  valueKey: string;
}) {
  const max = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);
  return (
    <ul className="analytics-bar-list">
      {items.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const width = `${Math.max(6, (value / max) * 100)}%`;
        return (
          <li key={String(item[labelKey])}>
            <div className="analytics-bar-meta">
              <span className="analytics-bar-label">{String(item[labelKey])}</span>
              <span className="analytics-bar-value">{formatNumber(value)}</span>
            </div>
            <div className="analytics-bar-track">
              <div className="analytics-bar-fill" style={{ width }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TrendChart({
  trend,
}: {
  trend: Array<{ day: string; pageviews: number; visitors: number }>;
}) {
  const max = Math.max(...trend.map((d) => d.pageviews), 1);
  return (
    <div className="analytics-trend" role="img" aria-label="Pageviews trend">
      {trend.map((day) => (
        <div key={day.day} className="analytics-trend-col">
          <div
            className="analytics-trend-bar"
            style={{ height: `${Math.max(8, (day.pageviews / max) * 100)}%` }}
            title={`${day.day}: ${day.pageviews} views / ${day.visitors} visitors`}
          />
          <span className="analytics-trend-label">
            {day.day.slice(5) || day.day}
          </span>
        </div>
      ))}
    </div>
  );
}

function PostHogEmbed({ src }: { src: string }) {
  const [height, setHeight] = useState(720);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.event === "posthog:dimensions" && event.data?.name === "MotusPostHogDash") {
        if (typeof event.data.height === "number") setHeight(event.data.height);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      name="MotusPostHogDash"
      title="PostHog shared dashboard"
      src={src.includes("?") ? `${src}&refresh=true` : `${src}?refresh=true`}
      className="analytics-embed"
      style={{ height }}
      loading="lazy"
    />
  );
}

function HeatmapsPanel({
  heatmaps,
  siteFilter,
}: {
  heatmaps?: OverviewResponse["heatmaps"];
  siteFilter: (typeof SITES)[number]["id"];
}) {
  const heatmapsHome =
    heatmaps?.heatmapsHome ||
    (POSTHOG_APP_URL.includes("/project/")
      ? `${POSTHOG_APP_URL.replace(/\/$/, "")}/heatmaps`
      : `${POSTHOG_APP_URL.replace(/\/$/, "")}/heatmaps`);

  const sites = useMemo(() => {
    const fromApi = heatmaps?.sites?.length ? heatmaps.sites : FALLBACK_HEATMAP_SITES;
    if (siteFilter === "all") return fromApi;
    return fromApi.filter((s) => s.id === siteFilter);
  }, [heatmaps, siteFilter]);

  const topPaths = heatmaps?.topPaths ?? [];

  return (
    <section className="panel">
      <div className="card-header">
        <div>
          <p className="eyebrow">Heatmaps</p>
          <h2>Click maps in PostHog</h2>
          <p className="muted">
            Marketing OS does not invent heatmap overlays — open PostHog Heatmaps for each
            tracked homepage. If the page URL does not load automatically, paste it into
            PostHog’s URL field.
          </p>
        </div>
        <a className="secondary-button" href={heatmapsHome} target="_blank" rel="noreferrer">
          Open Heatmaps
        </a>
      </div>

      <ul className="analytics-heatmap-list">
        {sites.map((site) => {
          const href = site.heatmapUrl || heatmapsHome;
          return (
            <li key={site.id} className="analytics-heatmap-item">
              <div>
                <strong>{site.label}</strong>
                <p className="muted">{site.url}</p>
              </div>
              <div className="analytics-heatmap-actions">
                <a className="secondary-button" href={href} target="_blank" rel="noreferrer">
                  Heatmap
                </a>
                <a className="chip" href={site.url} target="_blank" rel="noreferrer">
                  Visit site
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      {topPaths.length > 0 && (
        <div className="analytics-heatmap-paths">
          <p className="eyebrow">Top paths (this site)</p>
          <ul className="analytics-heatmap-path-list">
            {topPaths.map((item) => (
              <li key={item.url}>
                <span className="analytics-bar-label">
                  {item.path} · {formatNumber(item.views)} views
                </span>
                <a href={item.heatmapUrl} target="_blank" rel="noreferrer">
                  Open heatmap
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function WebAnalyticsPage() {
  const [site, setSite] = useState<(typeof SITES)[number]["id"]>("all");
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("7d");
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics/overview?site=${site}&range=${range}`);
        const json = (await res.json()) as OverviewResponse;
        if (!cancelled) setData(json);
      } catch (error) {
        if (!cancelled) {
          setData({
            configured: false,
            error: error instanceof Error ? error.message : "Failed to load analytics",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [site, range]);

  const emptyPages = useMemo(() => (data?.topPages?.length ?? 0) === 0, [data]);
  const emptySources = useMemo(() => (data?.topSources?.length ?? 0) === 0, [data]);
  const emptyDevices = useMemo(() => (data?.devices?.length ?? 0) === 0, [data]);
  const emptyCountries = useMemo(() => (data?.countries?.length ?? 0) === 0, [data]);

  const taggedUtmSources = useMemo(
    () => (data?.utmSources || []).filter((row) => row.source !== "(none)"),
    [data],
  );
  const taggedUtmCampaigns = useMemo(
    () => (data?.utmCampaigns || []).filter((row) => row.campaign !== "(none)"),
    [data],
  );
  const taggedUtmCombos = useMemo(
    () =>
      (data?.utmCombos || []).filter(
        (row) =>
          row.source !== "(none)" || row.medium !== "(none)" || row.campaign !== "(none)",
      ),
    [data],
  );
  const hasAnyUtm =
    taggedUtmSources.length > 0 ||
    taggedUtmCampaigns.length > 0 ||
    taggedUtmCombos.length > 0;

  return (
    <div className="page-stack analytics-page">
      <section className="panel analytics-hero">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">Web analytics</p>
            <h1>Site dashboard</h1>
            <p className="muted">
              Wix-style overview for MotusDAO public traffic — visitors, engagement, devices,
              geo, and heatmap entry points — powered by PostHog.
            </p>
          </div>
          <a
            className="secondary-button"
            href={data?.heatmaps?.projectUrl || POSTHOG_APP_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open PostHog
          </a>
        </div>

        <div className="analytics-filters">
          <div className="analytics-filter-group" role="tablist" aria-label="Site">
            {SITES.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={site === option.id}
                className={site === option.id ? "chip is-active" : "chip"}
                onClick={() => setSite(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="analytics-filter-group" role="tablist" aria-label="Range">
            {RANGES.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={range === option.id}
                className={range === option.id ? "chip is-active" : "chip"}
                onClick={() => setRange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading && (
        <section className="loading-state">
          <p className="muted">Loading analytics…</p>
        </section>
      )}

      {!loading && data?.error && (
        <section className="panel analytics-setup">
          <p className="eyebrow">Setup required</p>
          <h2>Connect PostHog query API</h2>
          <p className="muted">{data.error}</p>
          <ol className="muted analytics-setup-list">
            <li>
              In PostHog → Personal API keys, create a key with <strong>Query Read</strong>.
            </li>
            <li>
              Copy your numeric <strong>Project ID</strong> from the project URL (
              <code>/project/12345</code>).
            </li>
            <li>
              In Vercel (Marketing OS), set server env vars (no <code>NEXT_PUBLIC_</code>):
              <br />
              <code>POSTHOG_PERSONAL_API_KEY</code>, <code>POSTHOG_PROJECT_ID</code>, optional{" "}
              <code>POSTHOG_HOST=https://us.posthog.com</code>
            </li>
            <li>
              Optional: set <code>NEXT_PUBLIC_POSTHOG_APP_URL</code> to{" "}
              <code>https://us.posthog.com/project/&lt;id&gt;</code> for heatmap deep links.
            </li>
            <li>Redeploy Marketing OS, then refresh this page.</li>
          </ol>
        </section>
      )}

      {!loading && (
        <HeatmapsPanel heatmaps={data?.heatmaps} siteFilter={site} />
      )}

      {!loading && data?.configured && !data.error && data.kpis && (
        <>
          <section className="analytics-kpi-grid analytics-kpi-grid-wide">
            <article className="panel analytics-kpi">
              <p className="eyebrow">Visitors</p>
              <p className="analytics-kpi-value">{formatNumber(data.kpis.visitors)}</p>
              <p className="muted">Unique people ({range})</p>
            </article>
            <article className="panel analytics-kpi">
              <p className="eyebrow">Pageviews</p>
              <p className="analytics-kpi-value">{formatNumber(data.kpis.pageviews)}</p>
              <p className="muted">Total $pageview events</p>
            </article>
            <article className="panel analytics-kpi">
              <p className="eyebrow">Pages / visit</p>
              <p className="analytics-kpi-value">{data.kpis.pagesPerVisit}</p>
              <p className="muted">Pageviews ÷ visitors</p>
            </article>
            <article className="panel analytics-kpi">
              <p className="eyebrow">Avg time on page</p>
              <p className="analytics-kpi-value">
                {formatDuration(data.kpis.avgTimeOnPageSeconds)}
              </p>
              <p className="muted">From $pageleave duration</p>
            </article>
            <article className="panel analytics-kpi">
              <p className="eyebrow">Avg session</p>
              <p className="analytics-kpi-value">
                {formatDuration(data.kpis.avgSessionSeconds)}
              </p>
              <p className="muted">Pageview span per session</p>
            </article>
            <article className="panel analytics-kpi">
              <p className="eyebrow">Bounce rate</p>
              <p className="analytics-kpi-value">{formatPercent(data.kpis.bounceRate)}</p>
              <p className="muted">
                1-page sessions
                {data.kpis.sessions != null
                  ? ` · ${formatNumber(data.kpis.sessions)} sessions`
                  : ""}
              </p>
            </article>
          </section>

          <section className="panel">
            <div className="card-header">
              <div>
                <p className="eyebrow">Trend</p>
                <h2>Pageviews over time</h2>
              </div>
              {data.generatedAt && (
                <span className="muted">
                  Updated {new Date(data.generatedAt).toLocaleString()}
                </span>
              )}
            </div>
            {(data.trend?.length ?? 0) === 0 ? (
              <p className="muted">No pageviews in this range yet. Open the public sites once after deploy.</p>
            ) : (
              <TrendChart trend={data.trend || []} />
            )}
          </section>

          <section className="analytics-split">
            <article className="panel">
              <p className="eyebrow">Top pages</p>
              <h2>Where people land</h2>
              {emptyPages ? (
                <p className="muted">No page data yet.</p>
              ) : (
                <BarList items={data.topPages || []} labelKey="path" valueKey="views" />
              )}
            </article>
            <article className="panel">
              <p className="eyebrow">Traffic sources</p>
              <h2>Where visits come from</h2>
              {emptySources ? (
                <p className="muted">No source data yet.</p>
              ) : (
                <BarList items={data.topSources || []} labelKey="source" valueKey="views" />
              )}
            </article>
          </section>

          <section className="analytics-split">
            <article className="panel">
              <p className="eyebrow">Devices</p>
              <h2>Desktop / mobile / tablet</h2>
              {emptyDevices ? (
                <p className="muted">No device data yet.</p>
              ) : (
                <BarList items={data.devices || []} labelKey="device" valueKey="views" />
              )}
            </article>
            <article className="panel">
              <p className="eyebrow">Countries</p>
              <h2>Where visitors are</h2>
              {emptyCountries ? (
                <p className="muted">No geo data yet.</p>
              ) : (
                <BarList items={data.countries || []} labelKey="country" valueKey="views" />
              )}
            </article>
          </section>

          <section className="panel">
            <div className="card-header">
              <div>
                <p className="eyebrow">Campaigns (UTM)</p>
                <h2>Where campaign traffic comes from</h2>
                <p className="muted">
                  Breakdown of <code>utm_source</code>, <code>utm_medium</code>, and{" "}
                  <code>utm_campaign</code> on <code>$pageview</code> events. Tag marketing
                  links with query params so this fills in.
                </p>
              </div>
            </div>

            {!hasAnyUtm ? (
              <p className="muted analytics-utm-empty">
                No tagged campaign traffic in this range. Add{" "}
                <code>?utm_source=…&amp;utm_medium=…&amp;utm_campaign=…</code> to marketing
                links (email, social, ads) so PostHog can attribute pageviews.
              </p>
            ) : (
              <>
                <div className="analytics-split">
                  <article>
                    <p className="eyebrow">utm_source</p>
                    <h3 className="analytics-subhead">Top sources</h3>
                    {taggedUtmSources.length === 0 ? (
                      <p className="muted">No utm_source values yet.</p>
                    ) : (
                      <BarList
                        items={taggedUtmSources}
                        labelKey="source"
                        valueKey="views"
                      />
                    )}
                  </article>
                  <article>
                    <p className="eyebrow">utm_campaign</p>
                    <h3 className="analytics-subhead">Top campaigns</h3>
                    {taggedUtmCampaigns.length === 0 ? (
                      <p className="muted">No utm_campaign values yet.</p>
                    ) : (
                      <BarList
                        items={taggedUtmCampaigns}
                        labelKey="campaign"
                        valueKey="views"
                      />
                    )}
                  </article>
                </div>

                {taggedUtmCombos.length > 0 && (
                  <div className="analytics-utm-table-wrap">
                    <p className="eyebrow">Combined</p>
                    <h3 className="analytics-subhead">Source / medium / campaign</h3>
                    <div className="analytics-table-scroll">
                      <table className="analytics-table">
                        <thead>
                          <tr>
                            <th scope="col">Source</th>
                            <th scope="col">Medium</th>
                            <th scope="col">Campaign</th>
                            <th scope="col">Views</th>
                            <th scope="col">Visitors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taggedUtmCombos.map((row) => (
                            <tr
                              key={`${row.source}|${row.medium}|${row.campaign}`}
                            >
                              <td>{row.source}</td>
                              <td>{row.medium}</td>
                              <td>{row.campaign}</td>
                              <td>{formatNumber(row.views)}</td>
                              <td>{formatNumber(row.visitors)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      {EMBED_URL ? (
        <section className="panel">
          <div className="card-header">
            <div>
              <p className="eyebrow">PostHog embed</p>
              <h2>Shared dashboard</h2>
            </div>
          </div>
          <PostHogEmbed src={EMBED_URL} />
        </section>
      ) : (
        <section className="panel">
          <p className="eyebrow">Optional embed</p>
          <h2>Drop in your PostHog starter dashboard</h2>
          <p className="muted">
            In PostHog → Dashboards → Your starter dashboard → Share → enable public share →
            copy embed URL (<code>/embedded/…</code>). Set{" "}
            <code>NEXT_PUBLIC_POSTHOG_EMBED_DASHBOARD_URL</code> on Vercel and redeploy to
            show the full charts here.
          </p>
        </section>
      )}

      <section className="panel">
        <p className="eyebrow">Roadmap</p>
        <h2>What PostHog can power here</h2>
        <ul className="analytics-roadmap">
          {ROADMAP.map((item) => (
            <li key={item.title}>
              <span className={`status-pill status-${item.status}`}>{item.status}</span>
              <div>
                <strong>{item.title}</strong>
                <p className="muted">{item.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
