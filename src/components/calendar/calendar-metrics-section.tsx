"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { PRIMARY_METRICS, labelForMetric } from "@/lib/distribution-constants";

export function CalendarMetricsSection({
  projectId,
  item,
  relatedAssetId,
}: {
  projectId?: Id<"projects"> | null;
  item: {
    platform: string;
    primaryMetric?: string | null;
    status: string;
    campaignId?: string | null;
  };
  relatedAssetId?: Id<"assets"> | null;
}) {
  const recordMetric = useMutation(api.metrics.recordMetricSnapshot);
  const createLearning = useMutation(api.metrics.createLearningFromMetric);
  const [metricName, setMetricName] = useState(item.primaryMetric ?? "registrations");
  const [metricValue, setMetricValue] = useState("");
  const [notes, setNotes] = useState("");
  const [learningTitle, setLearningTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!projectId || (item.status !== "published" && item.status !== "measured")) {
    return (
      <section className="detail-block metrics-placeholder">
        <p className="eyebrow">Metrics</p>
        <p className="muted">Record metrics after the item is published.</p>
      </section>
    );
  }

  async function handleRecord() {
    if (!projectId) return;
    const value = parseFloat(metricValue);
    if (Number.isNaN(value)) return;
    setIsSaving(true);
    try {
      await recordMetric({
        projectId,
        channel: item.platform,
        metricName,
        metricValue: value,
        relatedAssetId: relatedAssetId ?? undefined,
        relatedCampaignId: item.campaignId ?? undefined,
        notes: notes.trim() || undefined,
      });
      setSaved(true);
      if (learningTitle.trim() && projectId) {
        await createLearning({
          projectId,
          title: learningTitle.trim(),
          outcome: `${metricName}: ${value}`,
          relatedAssetId: relatedAssetId ?? undefined,
          relatedCampaignId: item.campaignId ?? undefined,
        });
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="detail-block">
      <p className="eyebrow">Metrics</p>
      <p className="muted">Primary metric: {labelForMetric(item.primaryMetric ?? metricName)}</p>
      <div className="stack-form">
        <label>
          Metric
          <select value={metricName} onChange={(e) => setMetricName(e.target.value)}>
            {PRIMARY_METRICS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Value
          <input type="number" step="any" value={metricValue} onChange={(e) => setMetricValue(e.target.value)} />
        </label>
        <label>
          Notes
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label>
          Learning title (optional)
          <input value={learningTitle} onChange={(e) => setLearningTitle(e.target.value)} placeholder="What did we learn?" />
        </label>
        <button type="button" className="primary-button" onClick={handleRecord} disabled={isSaving || !metricValue}>
          {isSaving ? "Saving…" : "Record metric"}
        </button>
        {saved ? <p className="muted">Metric saved.</p> : null}
      </div>
    </section>
  );
}
