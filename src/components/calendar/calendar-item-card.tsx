import { StatusBadge } from "@/components/ui/status-badge";
import {
  assetStatusTone,
  labelForAssetStatus,
  labelForDistribution,
  labelForPlatform,
  labelForStatus,
  statusTone,
} from "@/lib/calendar-constants";

function formatScheduledAt(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function titleCase(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

export type CalendarItemRecord = {
  _id: string;
  title: string;
  platform: string;
  format: string;
  scheduledAt: string;
  status: string;
  distributionType: string;
  cta?: string | null;
  assetStatus: string;
};

export function CalendarItemCard({
  item,
  onSelect,
  compact = false,
}: {
  item: CalendarItemRecord;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={`card calendar-item-card ${compact ? "is-compact" : ""}`}
      onClick={() => onSelect(item._id)}
    >
      <div className="card-header">
        <h3>{item.title}</h3>
        <StatusBadge value={labelForStatus(item.status)} tone={statusTone(item.status)} />
      </div>
      {!compact ? (
        <>
          <div className="meta-grid muted calendar-card-meta">
            <span>{labelForPlatform(item.platform)}</span>
            <span>{titleCase(item.format)}</span>
            <span>{formatScheduledAt(item.scheduledAt)}</span>
            <span>{labelForDistribution(item.distributionType)}</span>
          </div>
          <div className="card-footer muted">
            <span>CTA: {item.cta || "—"}</span>
            <StatusBadge value={labelForAssetStatus(item.assetStatus)} tone={assetStatusTone(item.assetStatus)} />
          </div>
        </>
      ) : (
        <p className="muted compact-meta">
          {labelForPlatform(item.platform)} · {titleCase(item.format)}
        </p>
      )}
    </button>
  );
}
