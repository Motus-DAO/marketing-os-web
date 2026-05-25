"use client";

import { CalendarItemCard, type CalendarItemRecord } from "@/components/calendar/calendar-item-card";
import { getWeekEnd, getWeekStart } from "@/lib/distribution-constants";

function formatDayHeading(iso: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));
}

export function CalendarWeekView({
  items,
  weekAnchor,
  onSelectItem,
}: {
  items: CalendarItemRecord[];
  weekAnchor: Date;
  onSelectItem: (id: string) => void;
}) {
  const start = getWeekStart(weekAnchor);
  const end = getWeekEnd(start);
  const weekItems = items.filter((i) => {
    const t = new Date(i.scheduledAt).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });

  const byDay = new Map<string, CalendarItemRecord[]>();
  for (const item of weekItems) {
    const key = item.scheduledAt.slice(0, 10);
    const bucket = byDay.get(key) ?? [];
    bucket.push(item);
    byDay.set(key, bucket);
  }

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  return (
    <div className="calendar-week-view">
      {days.map((day) => {
        const key = day.toISOString().slice(0, 10);
        const dayItems = byDay.get(key) ?? [];
        return (
          <section key={key} className="calendar-week-column panel">
            <h3 className="calendar-week-day">{formatDayHeading(day.toISOString())}</h3>
            {dayItems.length ? (
              <div className="calendar-week-items">
                {dayItems.map((item) => (
                  <CalendarItemCard key={item._id} item={item} onSelect={onSelectItem} compact />
                ))}
              </div>
            ) : (
              <p className="muted empty-inline">—</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
