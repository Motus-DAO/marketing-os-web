"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { AssetCard } from "@/components/dashboard/asset-card";
import { AssetForm } from "@/components/content/asset-form";
import { EmptyState } from "@/components/ui/empty-state";
import { labelForPlatform } from "@/lib/calendar-constants";

export default function PlatformContentPage() {
  const params = useParams<{ projectId: string; platform: string }>();
  const projectId = params?.projectId as Id<"projects"> | undefined;
  const platform = params?.platform ?? "";
  const data = useQuery(
    api.dashboard.listAssetsByProject,
    projectId && platform ? { projectId, platform } : "skip",
  );
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
    return <div className="loading-state">Loading content…</div>;
  }

  if (!data) {
    return <EmptyState title="Project not found" body="The selected project does not exist." />;
  }

  const platformLabel = labelForPlatform(platform);

  return (
    <section className="page-stack">
      <div className="page-header-row">
        <div>
          <Link href={`/projects/${projectId}`} className="text-link">
            ← Back to channels
          </Link>
          <p className="eyebrow">Content · {data.project.name}</p>
          <h1>{platformLabel}</h1>
          <p className="muted">Review and plan distribution for {platformLabel} content in this campaign.</p>
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
        <AssetForm
          projectId={projectId}
          defaultPlatform={platform}
          lockPlatform
          onCreated={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {assets.length ? (
        <div className="asset-grid">
          {assets.map((asset) => (
            <AssetCard key={asset._id} asset={asset} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${platformLabel} content yet`}
          body="Add a content piece for this channel or adjust the filter."
        />
      )}
    </section>
  );
}
