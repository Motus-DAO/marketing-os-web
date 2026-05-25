export function dateKey(iso: string) {
  const d = new Date(iso);
  return dateKeyFromParts(d.getFullYear(), d.getMonth(), d.getDate());
}

export function dateKeyFromParts(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayKey() {
  const now = new Date();
  return dateKeyFromParts(now.getFullYear(), now.getMonth(), now.getDate());
}

export type MonthCell =
  | { kind: "empty" }
  | { kind: "day"; year: number; month: number; day: number; key: string };

export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: MonthCell[] = [];

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ kind: "empty" });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      kind: "day",
      year,
      month,
      day,
      key: dateKeyFromParts(year, month, day),
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ kind: "empty" });
  }
  return cells;
}

export function formatMonthYear(year: number, month: number) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1),
  );
}
