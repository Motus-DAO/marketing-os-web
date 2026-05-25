"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { AssetCard } from "@/components/dashboard/asset-card";
import { AssetForm } from "@/components/content/asset-form";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProjectAssetsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId as Id<"projects"> | undefined;
  const data = useQuery(api.dashboard.listAssetsByProject, projectId ? { projectId } : "skip");
  const metrics = useQuery(api.distribution.listProjectMetricSummary, projectId ? { projectId } : "skip");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "ready">("all");

  const assets = useMemo(() => {
    const list = data?.assets ?? [];
    if (filter === "ready") {
      return list.filter((a: any) => a.approvalState === "approved");
    }
    return list;
  }, [data?.assets, filter]);

  if (data === undefined) {
    return <div className="loading-state">Loading assets…</div>;
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
          <p className="eyebrow">Content</p>
          <h1>{data.project.name}</h1>
          <p className="muted">Review and plan distribution for all content pieces in this project.</p>
        </div>
        <div className="header-actions-stack">
          <Link href={`/calendar?project=${projectId}`} className="secondary-button">
            Open calendar
          </Link>
          <button type="button" className="primary-button" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Close form" : "Add content"}
          </button>
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

      <div className="calendar-filters panel">
        <div className="filter-group">
          <label htmlFor="asset-filter">Filter</label>
          <select id="asset-filter" value={filter} onChange={(e) => setFilter(e.target.value as "all" | "ready")}>
            <option value="all">All content</option>
            <option value="ready">Ready to publish (approved)</option>
          </select>
        </div>
      </div>

      {showForm && projectId ? (
        <AssetForm projectId={projectId} onCreated={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
      ) : null}

      {assets.length ? (
        <div className="asset-grid">
          {assets.map((asset) => (
            <AssetCard key={asset._id} asset={asset} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matching content"
          body="Add a content piece or adjust the filter. Video, carousel, and copy-only assets are supported."
        />
      )}
    </section>
  );
}
