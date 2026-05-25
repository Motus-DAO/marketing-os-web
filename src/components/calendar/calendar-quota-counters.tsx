"use client";

import { WEEK_ONE_QUOTAS } from "@/lib/distribution-constants";

type CalendarItem = {
  platform: string;
  format: string;
};

export function CalendarQuotaCounters({ items }: { items: CalendarItem[] }) {
  return (
    <div className="calendar-quota panel">
      <p className="eyebrow">Week one targets</p>
      <div className="quota-grid">
        {WEEK_ONE_QUOTAS.map((q) => {
          const count = items.filter(
            (i) =>
              i.platform === q.platform &&
              (i.format === q.format || (q.format === "reel_ad" && i.format.includes("ad"))),
          ).length;
          const done = count >= q.target;
          return (
            <div key={`${q.platform}-${q.format}`} className={`quota-cell ${done ? "is-done" : ""}`}>
              <strong>
                {count}/{q.target}
              </strong>
              <span className="muted">{q.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
