"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AssetCard } from "@/components/dashboard/asset-card";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProjectAssetsPage() {
  const params = useParams<{ projectId: string }>();
  const data = useQuery(api.dashboard.listAssetsByProject, params?.projectId ? { projectId: params.projectId as any } : "skip");
  const [filters, setFilters] = useState({ status: "all", platform: "all", funnelStage: "all", approvalState: "all" });

  const assets = data?.assets ?? [];
  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) =>
        Object.entries(filters).every(([key, value]) => value === "all" || asset[key as keyof typeof asset] === value),
      ),
    [assets, filters],
  );

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
          <Link href="/" className="text-link">← Back to projects</Link>
          <p className="eyebrow">Asset List</p>
          <h1>{data.project.name}</h1>
          <p className="muted">Review all known assets for this project.</p>
        </div>
      </div>

      {filteredAssets.length ? (
        <div className="asset-grid">
          {filteredAssets.map((asset) => (
            <AssetCard key={asset._id} asset={asset} />
          ))}
        </div>
      ) : (
        <EmptyState title="No matching assets" body="Try a different filter, or add assets and versions in Convex first." />
      )}
    </section>
  );
}
