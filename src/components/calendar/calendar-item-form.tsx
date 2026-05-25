"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  CALENDAR_DISTRIBUTION_TYPES,
  CALENDAR_PLATFORMS,
  CALENDAR_STATUSES,
  CALENDAR_ASSET_STATUSES,
} from "@/lib/calendar-constants";
import { FUNNEL_STAGES, PRIMARY_METRICS, formatsForPlatform } from "@/lib/distribution-constants";

export function CalendarItemForm({
  projectId,
  onCreated,
  onCancel,
}: {
  projectId: Id<"projects">;
  onCreated?: () => void;
  onCancel?: () => void;
}) {
  const createItem = useMutation(api.calendar.createCalendarItem);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [format, setFormat] = useState("reel");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [status, setStatus] = useState("idea");
  const [distributionType, setDistributionType] = useState("organic");
  const [assetStatus, setAssetStatus] = useState("missing");
  const [cta, setCta] = useState("Register for the free masterclass");
  const [destination, setDestination] = useState("Masterclass landing page");
  const [funnelStage, setFunnelStage] = useState("bridge");
  const [primaryMetric, setPrimaryMetric] = useState("registrations");
  const [copy, setCopy] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await createItem({
        projectId,
        title: title.trim(),
        platform: platform as any,
        format,
        scheduledAt: new Date(scheduledAt).toISOString(),
        status: status as any,
        distributionType: distributionType as any,
        assetStatus: assetStatus as any,
        cta: cta.trim() || undefined,
        destination: destination.trim() || undefined,
        funnelStage: funnelStage as any,
        primaryMetric: primaryMetric as any,
        copy: copy.trim() || undefined,
      });
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item");
    } finally {
      setIsSaving(false);
    }
  }

  const formatOptions = formatsForPlatform(platform);

  return (
    <form className="panel stack-form" onSubmit={handleSubmit}>
      <p className="eyebrow">New calendar slot</p>
      {error ? <p className="form-error">{error}</p> : null}
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Scheduled
        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
      </label>
      <label>
        Platform
        <select
          value={platform}
          onChange={(e) => {
            setPlatform(e.target.value);
            setFormat(formatsForPlatform(e.target.value)[0]?.id ?? "other");
          }}
        >
          {CALENDAR_PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Format
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          {formatOptions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {CALENDAR_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Distribution
        <select value={distributionType} onChange={(e) => setDistributionType(e.target.value)}>
          {CALENDAR_DISTRIBUTION_TYPES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Asset status
        <select value={assetStatus} onChange={(e) => setAssetStatus(e.target.value)}>
          {CALENDAR_ASSET_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Funnel
        <select value={funnelStage} onChange={(e) => setFunnelStage(e.target.value)}>
          {FUNNEL_STAGES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Primary metric
        <select value={primaryMetric} onChange={(e) => setPrimaryMetric(e.target.value)}>
          {PRIMARY_METRICS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        CTA
        <input value={cta} onChange={(e) => setCta(e.target.value)} />
      </label>
      <label>
        Destination
        <input value={destination} onChange={(e) => setDestination(e.target.value)} />
      </label>
      <label>
        Copy
        <textarea value={copy} onChange={(e) => setCopy(e.target.value)} rows={3} />
      </label>
      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="primary-button" disabled={isSaving || !title.trim()}>
          {isSaving ? "Adding…" : "Add to calendar"}
        </button>
      </div>
    </form>
  );
}
