"use client";

const POSTHOG_APP_URL =
  process.env.NEXT_PUBLIC_POSTHOG_APP_URL ?? "https://us.posthog.com";

export default function WebAnalyticsPage() {
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Web analytics</p>
        <h1>Site traffic &amp; behavior</h1>
        <p className="muted">
          Visitors, sources, paths, and heatmaps for MotusDAO public sites live in
          PostHog (Academia, Hub, Landing). This OS is the operator home; PostHog is
          the data layer. Use the button below (or PostHog →{" "}
          <strong>Dashboards → Your starter dashboard</strong>) for the Wix-style
          overview.
        </p>
        <div style={{ marginTop: "1.25rem" }}>
          <a
            className="primary-button"
            href={POSTHOG_APP_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open PostHog dashboard
          </a>
        </div>
        <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
          Tip: set <code>NEXT_PUBLIC_POSTHOG_APP_URL</code> to your project URL
          (<code>https://us.posthog.com/project/…</code>) so this button lands on
          MotusDAO, not the PostHog org picker.
        </p>
      </section>

      <section className="panel">
        <p className="eyebrow">Tracked sites</p>
        <ul className="muted" style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.7 }}>
          <li>
            <code>site=academia</code> — academia.motusdao.org
          </li>
          <li>
            <code>site=hub</code> — app.motusdao.org
          </li>
          <li>
            <code>site=landing</code> — www.motusdao.org
          </li>
        </ul>
        <p className="muted" style={{ marginTop: "1rem" }}>
          Filter insights by property <code>site</code> or by hostname. Session
          replay is off in v1 to protect the free tier.
        </p>
      </section>

      <section className="panel">
        <p className="eyebrow">Setup checklist</p>
        <ol className="muted" style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.7 }}>
          <li>Create one PostHog project for MotusDAO marketing.</li>
          <li>
            Set <code>NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN</code> and{" "}
            <code>NEXT_PUBLIC_POSTHOG_HOST</code> on Academia, Hub, and Landing
            (local <code>.env.local</code> + Vercel).
          </li>
          <li>Open PostHog → Activity / Live events and load each site once.</li>
          <li>Build an Overview dashboard (visitors, sources, top pages) + one heatmap.</li>
        </ol>
      </section>
    </div>
  );
}
