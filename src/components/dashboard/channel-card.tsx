import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { CHANNEL_PRIORITY } from "@/lib/distribution-constants";
import { labelForPlatform } from "@/lib/calendar-constants";

type ChannelCardProps = {
  projectId: string;
  channel: {
    id: string;
    assetCount: number;
    needsReviewCount: number;
  };
};

export function ChannelCard({ projectId, channel }: ChannelCardProps) {
  const priority = CHANNEL_PRIORITY[channel.id as keyof typeof CHANNEL_PRIORITY];

  return (
    <Link href={`/projects/${projectId}/${channel.id}`} className="card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Channel</p>
          <h3>{labelForPlatform(channel.id)}</h3>
        </div>
        {priority ? <StatusBadge value={priority.label} tone="neutral" /> : null}
      </div>
      <div className="card-stats">
        <div>
          <strong>{channel.assetCount}</strong>
          <span className="muted">Content pieces</span>
        </div>
        <div>
          <strong>{channel.needsReviewCount}</strong>
          <span className="muted">Needs review</span>
        </div>
      </div>
    </Link>
  );
}
