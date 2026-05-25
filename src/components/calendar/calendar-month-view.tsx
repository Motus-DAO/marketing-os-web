"use client";

import { useMemo } from "react";
import {
  buildMonthGrid,
  dateKey,
  formatMonthYear,
  todayKey,
} from "@/lib/calendar-date-utils";
import { labelForPlatform } from "@/lib/calendar-constants";
import type { CalendarItemRecord } from "@/components/calendar/calendar-item-card";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MAX_VISIBLE_EVENTS = 3;

type CalendarMonthViewProps = {
  items: CalendarItemRecord[];
  viewYear: number;
  viewMonth: number;
  selectedDayKey: string | null;
  onViewMonthChange: (year: number, month: number) => void;
  onSelectDay: (key: string | null) => void;
  onSelectItem: (id: string) => void;
};

export function CalendarMonthView({
  items,
  viewYear,
  viewMonth,
  selectedDayKey,
  onViewMonthChange,
  onSelectDay,
  onSelectItem,
}: CalendarMonthViewProps) {
  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItemRecord[]>();
    for (const item of items) {
      const key = dateKey(item.scheduledAt);
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    }
    return map;
  }, [items]);

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const today = todayKey();

  function goToMonth(offset: number) {
    const next = new Date(viewYear, viewMonth + offset, 1);
    onViewMonthChange(next.getFullYear(), next.getMonth());
  }

  function goToToday() {
    const now = new Date();
    onViewMonthChange(now.getFullYear(), now.getMonth());
    onSelectDay(todayKey());
  }

  return (
    <div className="calendar-month-view panel">
      <div className="calendar-month-toolbar">
        <h2 className="calendar-month-title">{formatMonthYear(viewYear, viewMonth)}</h2>
        <div className="calendar-month-nav">
          <button type="button" className="secondary-button" onClick={() => goToMonth(-1)} aria-label="Previous month">
            ←
          </button>
          <button type="button" className="secondary-button" onClick={goToToday}>
            Today
          </button>
          <button type="button" className="secondary-button" onClick={() => goToMonth(1)} aria-label="Next month">
            →
          </button>
        </div>
      </div>

      <div className="calendar-month-weekdays" aria-hidden="true">
        {WEEKDAYS.map((label) => (
          <span key={label} className="calendar-month-weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="calendar-month-grid" role="grid" aria-label={formatMonthYear(viewYear, viewMonth)}>
        {cells.map((cell, index) => {
          if (cell.kind === "empty") {
            return <div key={`empty-${index}`} className="calendar-month-cell is-empty" role="presentation" />;
          }

          const dayItems = itemsByDay.get(cell.key) ?? [];
          const isToday = cell.key === today;
          const isSelected = cell.key === selectedDayKey;

          return (
            <button
              key={cell.key}
              type="button"
              role="gridcell"
              className={[
                "calendar-month-cell",
                isToday ? "is-today" : "",
                isSelected ? "is-selected" : "",
                dayItems.length ? "has-items" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectDay(isSelected ? null : cell.key)}
              aria-pressed={isSelected}
              aria-label={`${cell.day}, ${dayItems.length} item${dayItems.length === 1 ? "" : "s"}`}
            >
              <span className="calendar-month-day-num">{cell.day}</span>
              {dayItems.length ? (
                <ul className="calendar-month-events">
                  {dayItems.slice(0, MAX_VISIBLE_EVENTS).map((item) => (
                    <li key={item._id}>
                      <button
                        type="button"
                        className="calendar-month-event-pill"
                        title={item.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item._id);
                        }}
                      >
                        <span className="calendar-month-event-platform">{labelForPlatform(item.platform)}</span>
                        <span className="calendar-month-event-title">{item.title}</span>
                      </button>
                    </li>
                  ))}
                  {dayItems.length > MAX_VISIBLE_EVENTS ? (
                    <li className="calendar-month-more muted">+{dayItems.length - MAX_VISIBLE_EVENTS} more</li>
                  ) : null}
                </ul>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
