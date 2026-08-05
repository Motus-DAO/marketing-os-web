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
  const textPreview = asset.copy || asset.hook || asset.caption || null;
  return (
    <Link href={`/assets/${asset._id}`} className="card asset-card">
      <div className="asset-thumb">
        {asset.thumbnailUrl ? (
          <img src={asset.thumbnailUrl} alt={asset.title} />
        ) : textPreview ? (
          <div className="thumb-text-preview">{textPreview}</div>
        ) : (
          <div className="thumb-placeholder">No preview</div>
        )}
      </div>
      <div className="page-stack">
        <div className="card-header">
          <h3>{asset.title}</h3>
          <StatusBadge
            value={asset.approvalState}
            tone={asset.approvalState === "approved" ? "success" : asset.approvalState === "rejected" ? "danger" : "warning"}
          />
        </div>
        {textPreview ? <p className="asset-copy-preview muted">{textPreview}</p> : null}
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
