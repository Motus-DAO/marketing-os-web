"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { StatusBadge } from "@/components/ui/status-badge";
import { DistributionWarnings } from "@/components/content/distribution-warnings";
import { CalendarMetricsSection } from "@/components/calendar/calendar-metrics-section";
import {
  assetStatusTone,
  labelForAssetStatus,
  labelForDistribution,
  labelForPlatform,
  labelForStatus,
  statusTone,
  CALENDAR_DISTRIBUTION_TYPES,
  CALENDAR_PLATFORMS,
  CALENDAR_STATUSES,
  CALENDAR_ASSET_STATUSES,
} from "@/lib/calendar-constants";
import {
  FUNNEL_STAGES,
  PRIMARY_METRICS,
  distributionWarnings,
} from "@/lib/distribution-constants";

function titleCase(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatScheduledAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

type DetailData = {
  item: {
    _id: string;
    title: string;
    platform: string;
    format: string;
    scheduledAt: string;
    status: string;
    distributionType: string;
    cta?: string | null;
    assetStatus: string;
    copy?: string | null;
    assetUrl?: string | null;
    notes?: string | null;
    destination?: string | null;
    campaignId?: string | null;
    relatedAssetId?: string | null;
    funnelStage?: string | null;
    primaryMetric?: string | null;
    hook?: string | null;
    centralIdea?: string | null;
    publishUrl?: string | null;
    projectId?: string | null;
  };
  project?: { _id: string; name: string } | null;
  relatedAsset?: {
    _id: string;
    title: string;
    approvalState?: string;
    currentVersionId?: string;
  } | null;
  relatedVersion?: { coverImageUrl?: string; videoPreviewUrls?: string[] } | null;
};

export function CalendarDetailPanel({
  data,
  projectAssets,
  onClose,
  onUpdated,
}: {
  data: DetailData;
  projectAssets?: { _id: string; title: string }[];
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const { item, project, relatedAsset, relatedVersion } = data;
  const updateItem = useMutation(api.calendar.updateCalendarItem);
  const syncFromAsset = useMutation(api.calendar.syncFromAsset);
  const createAssetFromItem = useMutation(api.calendar.createAssetFromCalendarItem);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({ ...item });

  useEffect(() => {
    setForm({ ...item });
    setEditing(false);
  }, [item._id]);

  const warnings = distributionWarnings({
    distributionType: form.distributionType,
    cta: form.cta,
    destination: form.destination,
    primaryMetric: form.primaryMetric,
    funnelStage: form.funnelStage,
    status: form.status,
  });

  async function handleCopy(text?: string | null) {
    if (!text?.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopyFeedback("Copied to clipboard");
    window.setTimeout(() => setCopyFeedback(null), 2000);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateItem({
        itemId: item._id as Id<"calendarItems">,
        projectId: (form.projectId as Id<"projects">) ?? undefined,
        title: form.title,
        platform: form.platform as any,
        format: form.format,
        scheduledAt: form.scheduledAt,
        status: form.status as any,
        distributionType: form.distributionType as any,
        cta: form.cta ?? undefined,
        assetStatus: form.assetStatus as any,
        copy: form.copy ?? undefined,
        assetUrl: form.assetUrl ?? undefined,
        notes: form.notes ?? undefined,
        destination: form.destination ?? undefined,
        relatedAssetId: (form.relatedAssetId as Id<"assets">) ?? undefined,
        campaignId: form.campaignId ?? undefined,
        funnelStage: (form.funnelStage as any) ?? undefined,
        primaryMetric: (form.primaryMetric as any) ?? undefined,
        hook: form.hook ?? undefined,
        centralIdea: form.centralIdea ?? undefined,
        publishUrl: form.publishUrl ?? undefined,
      });
      setEditing(false);
      onUpdated?.();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusAdvance(next: string) {
    setForm((f) => ({ ...f, status: next }));
    setIsSaving(true);
    try {
      await updateItem({
        itemId: item._id as Id<"calendarItems">,
        projectId: (item.projectId as Id<"projects">) ?? undefined,
        title: form.title,
        platform: form.platform as any,
        format: form.format,
        scheduledAt: form.scheduledAt,
        status: next as any,
        distributionType: form.distributionType as any,
        cta: form.cta ?? undefined,
        assetStatus: form.assetStatus as any,
        copy: form.copy ?? undefined,
        destination: form.destination ?? undefined,
        funnelStage: (form.funnelStage as any) ?? undefined,
        primaryMetric: (form.primaryMetric as any) ?? undefined,
        campaignId: form.campaignId ?? undefined,
        relatedAssetId: (form.relatedAssetId as Id<"assets">) ?? undefined,
        publishUrl: form.publishUrl ?? undefined,
      });
      onUpdated?.();
    } finally {
      setIsSaving(false);
    }
  }

  const thumb =
    relatedVersion?.coverImageUrl ?? relatedVersion?.videoPreviewUrls?.[0] ?? null;

  return (
    <div className="calendar-detail-overlay" role="presentation" onClick={onClose}>
      <aside
        className="calendar-detail-panel panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="section-header">
          <div>
            <p className="eyebrow">Calendar item</p>
            <h2 id="calendar-detail-title">{item.title}</h2>
            <p className="muted">{formatScheduledAt(item.scheduledAt)}</p>
          </div>
          <div className="detail-actions">
            <button type="button" className="secondary-button" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel edit" : "Edit"}
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <DistributionWarnings meta={form} />

        {warnings.length && !editing ? (
          <p className="muted form-hint">Fix distribution fields before scheduling or publishing.</p>
        ) : null}

        <div className="meta-grid muted">
          <span>{labelForPlatform(item.platform)}</span>
          <span>{titleCase(item.format)}</span>
          <span>{labelForDistribution(item.distributionType)}</span>
          {project ? <span>Project: {project.name}</span> : null}
        </div>

        <div className="detail-badges">
          <StatusBadge value={labelForStatus(item.status)} tone={statusTone(item.status)} />
          <StatusBadge value={labelForAssetStatus(item.assetStatus)} tone={assetStatusTone(item.assetStatus)} />
        </div>

        <section className="detail-block publish-actions">
          <p className="eyebrow">Publish workflow</p>
          <div className="action-grid">
            {item.status === "approved" ? (
              <button type="button" className="primary-button" disabled={isSaving || !!warnings.length} onClick={() => handleStatusAdvance("scheduled")}>
                Mark scheduled
              </button>
            ) : null}
            {item.status === "scheduled" ? (
              <button type="button" className="primary-button" disabled={isSaving || !!warnings.length} onClick={() => handleStatusAdvance("published")}>
                Mark published
              </button>
            ) : null}
            {item.status === "published" ? (
              <button type="button" className="secondary-button" disabled={isSaving} onClick={() => handleStatusAdvance("measured")}>
                Mark measured
              </button>
            ) : null}
          </div>
        </section>

        {editing ? (
          <section className="detail-block stack-form">
            <label>
              Title
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>
              Scheduled at
              <input
                type="datetime-local"
                value={form.scheduledAt.slice(0, 16)}
                onChange={(e) => setForm({ ...form, scheduledAt: new Date(e.target.value).toISOString() })}
              />
            </label>
            <label>
              Platform
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                {CALENDAR_PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Format
              <input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {CALENDAR_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Distribution
              <select
                value={form.distributionType}
                onChange={(e) => setForm({ ...form, distributionType: e.target.value })}
              >
                {CALENDAR_DISTRIBUTION_TYPES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Funnel stage
              <select value={form.funnelStage ?? ""} onChange={(e) => setForm({ ...form, funnelStage: e.target.value })}>
                <option value="">—</option>
                {FUNNEL_STAGES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Primary metric
              <select value={form.primaryMetric ?? ""} onChange={(e) => setForm({ ...form, primaryMetric: e.target.value })}>
                <option value="">—</option>
                {PRIMARY_METRICS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              CTA
              <input value={form.cta ?? ""} onChange={(e) => setForm({ ...form, cta: e.target.value })} />
            </label>
            <label>
              Destination
              <input value={form.destination ?? ""} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </label>
            <label>
              Copy
              <textarea value={form.copy ?? ""} onChange={(e) => setForm({ ...form, copy: e.target.value })} rows={4} />
            </label>
            <label>
              Publish URL
              <input value={form.publishUrl ?? ""} onChange={(e) => setForm({ ...form, publishUrl: e.target.value })} />
            </label>
            <label>
              Linked asset
              <select
                value={form.relatedAssetId ?? ""}
                onChange={(e) => setForm({ ...form, relatedAssetId: e.target.value || undefined })}
              >
                <option value="">None</option>
                {projectAssets?.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Asset status
              <select value={form.assetStatus} onChange={(e) => setForm({ ...form, assetStatus: e.target.value })}>
                {CALENDAR_ASSET_STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="primary-button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </section>
        ) : null}

        <section className="detail-block">
          <div className="section-header">
            <div>
              <p className="eyebrow">Copy / caption</p>
            </div>
            <button type="button" className="secondary-button" disabled={!item.copy?.trim()} onClick={() => handleCopy(item.copy)}>
              Copy
            </button>
          </div>
          <p className="detail-copy">{item.copy?.trim() || "No copy drafted yet."}</p>
          {copyFeedback ? <p className="muted copy-feedback">{copyFeedback}</p> : null}
        </section>

        <section className="detail-block">
          <p className="eyebrow">Asset</p>
          {thumb ? (
            <div className="calendar-linked-thumb">
              {thumb.includes(".mp4") || relatedVersion?.videoPreviewUrls?.length ? (
                <video src={thumb} muted playsInline preload="metadata" />
              ) : (
                <img src={thumb} alt="" />
              )}
            </div>
          ) : null}
          {relatedAsset ? (
            <Link href={`/assets/${relatedAsset._id}`} className="text-link">
              Open content review: {relatedAsset.title}
            </Link>
          ) : (
            <p className="muted">No linked content asset.</p>
          )}
          <div className="detail-actions">
            {item.relatedAssetId ? (
              <button
                type="button"
                className="secondary-button"
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await syncFromAsset({ itemId: item._id as Id<"calendarItems"> });
                    onUpdated?.();
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                Sync from asset
              </button>
            ) : (
              <button
                type="button"
                className="secondary-button"
                disabled={isSaving || !item.projectId}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await createAssetFromItem({ itemId: item._id as Id<"calendarItems"> });
                    onUpdated?.();
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                Create asset from item
              </button>
            )}
            {item.assetUrl ? (
              <a href={item.assetUrl} target="_blank" rel="noreferrer" className="secondary-button">
                Open asset URL
              </a>
            ) : null}
          </div>
        </section>

        <section className="detail-block">
          <p className="eyebrow">Planning</p>
          <dl className="detail-dl">
            <div>
              <dt>Hook</dt>
              <dd>{item.hook || "—"}</dd>
            </div>
            <div>
              <dt>Central idea</dt>
              <dd>{item.centralIdea || "—"}</dd>
            </div>
            <div>
              <dt>CTA</dt>
              <dd>{item.cta || "—"}</dd>
            </div>
            <div>
              <dt>Destination</dt>
              <dd>{item.destination || "—"}</dd>
            </div>
            <div>
              <dt>Funnel</dt>
              <dd>{titleCase(item.funnelStage)}</dd>
            </div>
            <div>
              <dt>Primary metric</dt>
              <dd>{titleCase(item.primaryMetric)}</dd>
            </div>
            <div>
              <dt>Publish URL</dt>
              <dd>{item.publishUrl || "—"}</dd>
            </div>
            <div>
              <dt>Campaign</dt>
              <dd>{item.campaignId || "—"}</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{item.notes || "—"}</dd>
            </div>
          </dl>
        </section>

        <CalendarMetricsSection
          projectId={item.projectId as Id<"projects"> | undefined}
          item={item}
          relatedAssetId={item.relatedAssetId as Id<"assets"> | undefined}
        />
      </aside>
    </div>
  );
}
