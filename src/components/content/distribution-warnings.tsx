"use client";

import { distributionWarnings } from "@/lib/distribution-constants";

export function DistributionWarnings({ meta }: { meta: Parameters<typeof distributionWarnings>[0] }) {
  const warnings = distributionWarnings(meta);
  if (!warnings.length) return null;

  return (
    <div className="distribution-warnings panel" role="status">
      <p className="eyebrow">Distribution checks</p>
      <ul>
        {warnings.map((w) => (
          <li key={w.code}>{w.message}</li>
        ))}
      </ul>
    </div>
  );
}
