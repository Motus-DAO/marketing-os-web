# Marketing OS

Authenticated marketing workflow for MotusDAO (projects, assets, calendar).

## Web analytics (PostHog) — Wix-style dashboard

Route: `/web-analytics`

Shows visitors, pageviews, trend, top pages, traffic sources, UTM campaigns
(`utm_source` / `utm_medium` / `utm_campaign` on `$pageview`), engagement (avg time on
page, session duration, bounce rate), devices, and countries inside Marketing OS via
PostHog’s HogQL query API. Heatmaps are deep links into PostHog Heatmaps (no fake
overlays). Optional iframe embed for a shared PostHog dashboard.

Tag marketing links with `?utm_source=&utm_medium=&utm_campaign=` so the Campaigns
section on `/web-analytics` can attribute traffic.

### Public sites (collect events)

Set on Academia / Hub / Landing only:

- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (`phc_…`)
- `NEXT_PUBLIC_POSTHOG_HOST` (`https://us.i.posthog.com`)

### Marketing OS (read / display)

Server env (Vercel → Environment Variables, **not** `NEXT_PUBLIC_`):

- `POSTHOG_PERSONAL_API_KEY` — personal key with **Query Read**
- `POSTHOG_PROJECT_ID` — number from `https://us.posthog.com/project/<id>`
- `POSTHOG_HOST` — default `https://us.posthog.com`

Optional public:

- `NEXT_PUBLIC_POSTHOG_APP_URL` — prefer `https://us.posthog.com/project/<id>` so heatmap deep links open the right project
- `NEXT_PUBLIC_POSTHOG_EMBED_DASHBOARD_URL` — Share → embed `/embedded/…` URL

Do **not** put `phc_` project tokens on this app for collection.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
