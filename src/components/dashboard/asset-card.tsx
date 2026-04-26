import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";

function titleCase(value?: string | null) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function AssetCard({ asset }: { asset: any }) {
  return (
    <Link href={`/assets/${asset._id}`} className="card asset-card">
      <div className="asset-thumb">
        {asset.thumbnailUrl ? <img src={asset.thumbnailUrl} alt={asset.title} /> : <div className="thumb-placeholder">No preview</div>}
      </div>
      <div className="page-stack">
        <div className="card-header">
          <h3>{asset.title}</h3>
          <StatusBadge
            value={asset.approvalState}
            tone={asset.approvalState === "approved" ? "success" : asset.approvalState === "rejected" ? "danger" : "warning"}
          />
        </div>
        <div className="meta-grid muted">
          <span>{titleCase(asset.platform)}</span>
          <span>{titleCase(asset.format)}</span>
          <span>{titleCase(asset.funnelStage)}</span>
          <span>{titleCase(asset.status)}</span>
        </div>
        <div className="card-footer muted">
          <span>{asset.currentVersionLabel || "No current version"}</span>
          <span>Updated {formatDate(asset.updatedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
