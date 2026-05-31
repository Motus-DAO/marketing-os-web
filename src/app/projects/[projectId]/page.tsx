"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { ChannelCard } from "@/components/dashboard/channel-card";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProjectChannelsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId as Id<"projects"> | undefined;
  const data = useQuery(api.dashboard.getProjectChannelSummary, projectId ? { projectId } : "skip");
  const metrics = useQuery(api.distribution.listProjectMetricSummary, projectId ? { projectId } : "skip");

  if (data === undefined) {
    return <div className="loading-state">Loading channels…</div>;
  }

  if (!data) {
    return <EmptyState title="Project not found" body="The selected project does not exist." />;
  }

  return (
    <section className="page-stack">
      <div className="page-header-row">
        <div>
          <Link href="/" className="text-link">
            ← Back to projects
          </Link>
          <p className="eyebrow">Channels</p>
          <h1>{data.project.name}</h1>
          <p className="muted">
            Pick a channel to review and plan content for this campaign. {data.totalAssets} total pieces across{" "}
            {data.channels.length} channels.
          </p>
        </div>
        <div className="header-actions-stack">
          <Link href={`/calendar?project=${projectId}`} className="secondary-button">
            Open calendar
          </Link>
        </div>
      </div>

      {metrics ? (
        <div className="metric-summary panel">
          <p className="eyebrow">Metrics snapshot</p>
          <div className="meta-grid">
            <span>Registrations: {metrics.registrations}</span>
            <span>Link clicks: {metrics.link_clicks}</span>
            <span>CPA: {metrics.cpa ?? "—"}</span>
            <span>Snapshots: {metrics.snapshotCount}</span>
          </div>
        </div>
      ) : null}

      {data.channels.length ? (
        <div className="project-grid">
          {data.channels.map((channel) => (
            <ChannelCard key={channel.id} projectId={projectId!} channel={channel} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No channels configured"
          body="Add activeChannels to this project in Convex, or create content to derive channels automatically."
        />
      )}
    </section>
  );
}
