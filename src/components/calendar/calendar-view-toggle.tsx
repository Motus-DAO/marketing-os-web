export type CalendarViewMode = "month" | "list" | "week";

export function CalendarViewToggle({
  value,
  onChange,
}: {
  value: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
}) {
  return (
    <div className="calendar-view-toggle" role="tablist" aria-label="Calendar layout">
      <button
        type="button"
        role="tab"
        aria-selected={value === "month"}
        className={value === "month" ? "is-active" : ""}
        onClick={() => onChange("month")}
      >
        Month
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "week"}
        className={value === "week" ? "is-active" : ""}
        onClick={() => onChange("week")}
      >
        Week
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "list"}
        className={value === "list" ? "is-active" : ""}
        onClick={() => onChange("list")}
      >
        List
      </button>
    </div>
  );
}
