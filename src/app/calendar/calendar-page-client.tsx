"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { CalendarDetailPanel } from "@/components/calendar/calendar-detail-panel";
import { CalendarFilters } from "@/components/calendar/calendar-filters";
import { CalendarItemCard } from "@/components/calendar/calendar-item-card";
import { CalendarItemForm } from "@/components/calendar/calendar-item-form";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";
import { CalendarQuotaCounters } from "@/components/calendar/calendar-quota-counters";
import { CalendarViewToggle, type CalendarViewMode } from "@/components/calendar/calendar-view-toggle";
import { CalendarWeekView } from "@/components/calendar/calendar-week-view";
import { EmptyState } from "@/components/ui/empty-state";
import { dateKey } from "@/lib/calendar-date-utils";
import { getWeekEnd, getWeekStart } from "@/lib/distribution-constants";

function formatDateHeading(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function CalendarPageClient() {
  const searchParams = useSearchParams();
  const projects = useQuery(api.dashboard.listProjects);
  const masterclass = useQuery(api.distribution.getMasterclassProject);

  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [distributionType, setDistributionType] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<Id<"calendarItems"> | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [weekAnchor, setWeekAnchor] = useState(now);

  useEffect(() => {
    const qp = searchParams.get("project");
    if (qp) setProjectFilter(qp);
    else if (masterclass?._id) setProjectFilter(masterclass._id);
  }, [searchParams, masterclass?._id]);

  const weekStart = getWeekStart(weekAnchor).toISOString();
  const weekEnd = getWeekEnd(getWeekStart(weekAnchor)).toISOString();

  const projectIdArg = projectFilter !== "all" ? (projectFilter as Id<"projects">) : undefined;

  const items = useQuery(api.calendar.listCalendarItems, {
    projectId: projectIdArg,
    platform: platform === "all" ? undefined : (platform as any),
    status: status === "all" ? undefined : (status as any),
    distributionType: distributionType === "all" ? undefined : (distributionType as any),
    weekStart: viewMode === "week" ? weekStart : undefined,
    weekEnd: viewMode === "week" ? weekEnd : undefined,
  });

  const detail = useQuery(api.calendar.getCalendarItem, selectedId ? { itemId: selectedId } : "skip");

  const projectAssets = useQuery(
    api.dashboard.listAssetsByProject,
    detail?.item?.projectId ? { projectId: detail.item.projectId as Id<"projects"> } : "skip",
  );

  const seedWeekOne = useMutation(api.calendar.seedWeekOneParrilla);

  const grouped = useMemo(() => {
    const map = new Map<string, NonNullable<typeof items>>();
    for (const item of items ?? []) {
      const key = dateKey(item.scheduledAt);
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const selectedDayItems = useMemo(() => {
    if (!selectedDayKey || !items) return [];
    return items.filter((item) => dateKey(item.scheduledAt) === selectedDayKey);
  }, [items, selectedDayKey]);

  const activeProjectId = projectFilter !== "all" ? (projectFilter as Id<"projects">) : masterclass?._id;

  useEffect(() => {
    if (!selectedDayKey || !items?.length) return;
    const first = items.find((item) => dateKey(item.scheduledAt) === selectedDayKey);
    if (!first) return;
    const d = new Date(first.scheduledAt);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selectedDayKey, items]);

  async function handleSeedWeekOne() {
    if (!activeProjectId) {
      alert("Select or create the masterclass project first.");
      return;
    }
    setIsSeeding(true);
    try {
      const result = await seedWeekOne({ projectId: activeProjectId });
      alert(result.message);
    } finally {
      setIsSeeding(false);
    }
  }

  const projectOptions = useMemo(
    () => (projects ?? []).map((p: any) => ({ _id: p._id, name: p.name })),
    [projects],
  );

  if (items === undefined) {
    return <div className="loading-state">Loading content calendar…</div>;
  }

  return (
    <section className="page-stack">
      <div className="page-header-row">
        <div>
          <Link href="/" className="text-link">
            ← Back to projects
          </Link>
          <p className="eyebrow">Publication & distribution</p>
          <h1>Content calendar</h1>
          <p className="muted">
            Plan organic and paid posts by date. Every slot needs CTA, destination, and primary metric before scheduling.
          </p>
        </div>
        <div className="calendar-header-actions">
          <CalendarViewToggle value={viewMode} onChange={setViewMode} />
          {activeProjectId ? (
            <button type="button" className="secondary-button" onClick={handleSeedWeekOne} disabled={isSeeding}>
              {isSeeding ? "Seeding…" : "Seed week 1 parrilla"}
            </button>
          ) : null}
          {activeProjectId ? (
            <button type="button" className="primary-button" onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? "Close" : "Add slot"}
            </button>
          ) : null}
        </div>
      </div>

      <CalendarFilters
        platform={platform}
        status={status}
        distributionType={distributionType}
        projectId={projectFilter}
        projects={projectOptions}
        onPlatformChange={setPlatform}
        onStatusChange={setStatus}
        onDistributionChange={setDistributionType}
        onProjectChange={setProjectFilter}
      />

      {viewMode === "week" && items.length ? <CalendarQuotaCounters items={items} /> : null}

      {showCreateForm && activeProjectId ? (
        <CalendarItemForm
          projectId={activeProjectId}
          onCreated={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : null}

      {viewMode === "week" ? (
        <div className="week-nav panel">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              const d = new Date(weekAnchor);
              d.setDate(d.getDate() - 7);
              setWeekAnchor(d);
            }}
          >
            Previous week
          </button>
          <span className="muted">Week of {getWeekStart(weekAnchor).toLocaleDateString()}</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              const d = new Date(weekAnchor);
              d.setDate(d.getDate() + 7);
              setWeekAnchor(d);
            }}
          >
            Next week
          </button>
        </div>
      ) : null}

      {items.length ? (
        <>
          {viewMode === "month" ? (
            <CalendarMonthView
              items={items}
              viewYear={viewYear}
              viewMonth={viewMonth}
              selectedDayKey={selectedDayKey}
              onViewMonthChange={(year, month) => {
                setViewYear(year);
                setViewMonth(month);
              }}
              onSelectDay={setSelectedDayKey}
              onSelectItem={(id) => setSelectedId(id as Id<"calendarItems">)}
            />
          ) : null}

          {viewMode === "week" ? (
            <CalendarWeekView
              items={items}
              weekAnchor={weekAnchor}
              onSelectItem={(id) => setSelectedId(id as Id<"calendarItems">)}
            />
          ) : null}

          {viewMode === "month" && selectedDayKey && selectedDayItems.length ? (
            <section className="calendar-day-group">
              <h2 className="calendar-day-heading">{formatDateHeading(selectedDayItems[0].scheduledAt)}</h2>
              <div className="calendar-day-grid">
                {selectedDayItems.map((item) => (
                  <CalendarItemCard key={item._id} item={item} onSelect={(id) => setSelectedId(id as Id<"calendarItems">)} />
                ))}
              </div>
            </section>
          ) : null}

          {viewMode === "list" && grouped.length ? (
            <div className="calendar-by-date">
              {grouped.map(([key, dayItems]) => (
                <section key={key} className="calendar-day-group">
                  <h2 className="calendar-day-heading">{formatDateHeading(dayItems[0].scheduledAt)}</h2>
                  <div className="calendar-day-grid">
                    {dayItems.map((item) => (
                      <CalendarItemCard key={item._id} item={item} onSelect={(id) => setSelectedId(id as Id<"calendarItems">)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {viewMode === "list" && !grouped.length ? (
            <EmptyState title="No calendar items" body="Adjust filters or add slots for this project." />
          ) : null}
        </>
      ) : (
        <EmptyState
          title="No calendar items"
          body={
            activeProjectId
              ? "Seed week 1 parrilla or add a calendar slot to get started."
              : "Create the masterclass project from the home page first."
          }
        />
      )}

      {detail ? (
        <CalendarDetailPanel
          data={detail as any}
          projectAssets={projectAssets?.assets?.map((a: any) => ({ _id: a._id, title: a.title }))}
          onClose={() => setSelectedId(null)}
          onUpdated={() => setSelectedId(selectedId)}
        />
      ) : null}
    </section>
  );
}
