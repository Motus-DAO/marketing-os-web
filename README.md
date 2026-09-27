# Marketing OS

Authenticated marketing workflow for MotusDAO (projects, assets, calendar).

## Web analytics (PostHog)

Public sites (Academia, Hub, Landing) send events to one PostHog marketing project.
This app is the operator home — see **Web Analytics** in the nav (`/web-analytics`).

Optional: set `NEXT_PUBLIC_POSTHOG_APP_URL` to your MotusDAO PostHog project URL
(e.g. `https://us.posthog.com/project/<id>`). Default is `https://us.posthog.com`.
Do **not** put `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` on this app — only on Academia / Hub / Landing.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
