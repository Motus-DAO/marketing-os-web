import { Suspense } from "react";
import { CalendarPageClient } from "./calendar-page-client";

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="loading-state">Loading content calendar…</div>}>
      <CalendarPageClient />
    </Suspense>
  );
}
