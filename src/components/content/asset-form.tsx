"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  CONTENT_KINDS,
  DISTRIBUTION_TYPES,
  FUNNEL_STAGES,
  PRIMARY_METRICS,
  CALENDAR_PLATFORMS,
  formatsForPlatform,
  inferContentKind,
} from "@/lib/distribution-constants";

type AssetFormProps = {
  projectId: Id<"projects">;
  defaultPlatform?: string;
  lockPlatform?: boolean;
  onCreated?: (assetId: Id<"assets">) => void;
  onCancel?: () => void;
};

export function AssetForm({ projectId, defaultPlatform, lockPlatform, onCreated, onCancel }: AssetFormProps) {
  const createAsset = useMutation(api.dashboard.createAsset);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialPlatform = defaultPlatform ?? "instagram";
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState(initialPlatform);
  const [format, setFormat] = useState(() => formatsForPlatform(initialPlatform)[0]?.id ?? "reel");
  const [contentKind, setContentKind] = useState<string>("video");
  const [distributionType, setDistributionType] = useState("organic");
  const [funnelStage, setFunnelStage] = useState("bridge");
  const [primaryMetric, setPrimaryMetric] = useState("registrations");
  const [cta, setCta] = useState("Register for the free masterclass");
  const [destination, setDestination] = useState("Masterclass landing page");
  const [hook, setHook] = useState("");
  const [centralIdea, setCentralIdea] = useState("");
  const [copy, setCopy] = useState("");
  const [objective, setObjective] = useState("");

  const formatOptions = useMemo(() => formatsForPlatform(platform), [platform]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const kind = (contentKind || inferContentKind(format)) as "video" | "carousel" | "image" | "copy" | "mixed";
      const assetId = await createAsset({
        projectId,
        title: title.trim(),
        platform,
        format,
        funnelStage,
        status: "draft",
        approvalState: "pending",
        distributionType: distributionType as "organic" | "paid" | "both",
        primaryMetric: primaryMetric as any,
        cta: cta.trim() || undefined,
        destination: destination.trim() || undefined,
        hook: hook.trim() || undefined,
        centralIdea: centralIdea.trim() || undefined,
        copy: copy.trim() || undefined,
        contentKind: kind,
        objective: objective.trim() || undefined,
      });
      onCreated?.(assetId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create content");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="panel asset-form stack-form" onSubmit={handleSubmit}>
      <div className="section-header">
        <div>
          <p className="eyebrow">New content</p>
          <h2>Add content piece</h2>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <div className="form-row">
        <label>
          Platform
          <select
            value={platform}
            disabled={lockPlatform}
            onChange={(e) => {
              setPlatform(e.target.value);
              const fmts = formatsForPlatform(e.target.value);
              setFormat(fmts[0]?.id ?? "other");
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
      </div>

      <div className="form-row">
        <label>
          Content kind
          <select value={contentKind} onChange={(e) => setContentKind(e.target.value)}>
            {CONTENT_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Distribution
          <select value={distributionType} onChange={(e) => setDistributionType(e.target.value)}>
            {DISTRIBUTION_TYPES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          Funnel stage
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
      </div>

      <label>
        CTA
        <input value={cta} onChange={(e) => setCta(e.target.value)} />
      </label>
      <label>
        Destination
        <input value={destination} onChange={(e) => setDestination(e.target.value)} />
      </label>
      <label>
        Hook
        <input value={hook} onChange={(e) => setHook(e.target.value)} />
      </label>
      <label>
        Central idea
        <textarea value={centralIdea} onChange={(e) => setCentralIdea(e.target.value)} rows={2} />
      </label>
      <label>
        Copy / caption
        <textarea value={copy} onChange={(e) => setCopy(e.target.value)} rows={4} />
      </label>
      <label>
        Objective
        <input value={objective} onChange={(e) => setObjective(e.target.value)} />
      </label>

      <div className="form-actions">
        {onCancel ? (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="primary-button" disabled={isSaving || !title.trim()}>
          {isSaving ? "Creating…" : "Create content"}
        </button>
      </div>
    </form>
  );
}
