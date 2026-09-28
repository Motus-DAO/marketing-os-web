# Marketing OS

Authenticated marketing workflow for MotusDAO (projects, assets, calendar).

## Authentication (WaaP + SIWE)

Marketing OS uses **Human Tech WaaP** (email / Google) plus a **SIWE** session cookie
(`mos_session`). Access is gated by an email allowlist.

Flow:

1. Connect with WaaP (email or Google)
2. Share / confirm verified email via Human Tech `requestEmail()` when needed
3. Sign the SIWE message (“Sign in to MotusDAO Marketing OS”)
4. Server checks `AUTH_ALLOWED_EMAILS` and sets an httpOnly JWT cookie

SIWE `chainId` is **42220 (Celo mainnet)** — same as MotusDAO Hub. Signing does not
require Celo funds; it is only bound into the SIWE message.

Nonces are **HMAC-signed with `AUTH_SECRET`** (stateless). They work on Vercel
serverless without Prisma/Redis. A nonce can be replayed until its 5-minute TTL
expires (acceptable for this allowlisted operator app).

### Env vars (Vercel)

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | yes (prod) | Signs session JWTs + nonces |
| `AUTH_ALLOWED_EMAILS` | yes | Comma-separated, case-insensitive. e.g. `aszalvarez@gmail.com` |
| `NEXT_PUBLIC_APP_URL` | yes | Canonical origin for SIWE domain/uri (no trailing slash) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | no | Enables external wallets in the WaaP modal |

API routes: `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/me`, `/api/auth/logout`.
`/api/analytics/*` accepts a human SIWE session **or** an agent Bearer token.

## Agent API (machine access)

Agents should **not** use WaaP/SIWE. They call HTTP APIs with a shared secret:

```bash
# Generate a token
openssl rand -base64 32

# Vercel (Secret):
# AUTH_AGENT_TOKEN=<that value>
# or multiple: AUTH_AGENT_TOKENS=hermes:<token1>,openclaw:<token2>
```

```bash
curl -sS https://marketing-os.motusdao.org/api/agent/health \
  -H "Authorization: Bearer $AUTH_AGENT_TOKEN"

curl -sS "https://marketing-os.motusdao.org/api/agent/analytics/overview?site=all&range=7d" \
  -H "Authorization: Bearer $AUTH_AGENT_TOKEN"
```

| Variable | Required | Notes |
|---|---|---|
| `AUTH_AGENT_TOKEN` | one of these | Single token → agent id `default` |
| `AUTH_AGENT_TOKENS` | one of these | `id:token,id2:token2` |

Human UI auth stays unchanged (`AUTH_SECRET`, `AUTH_ALLOWED_EMAILS`, WaaP).

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

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` → `.env.local`
and set at least `AUTH_SECRET`, `AUTH_ALLOWED_EMAILS`, and Convex URLs.
