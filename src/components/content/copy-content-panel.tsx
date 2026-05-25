"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { labelForFunnel, labelForMetric } from "@/lib/distribution-constants";

export function CopyContentPanel({ asset }: { asset: any }) {
  const updateAsset = useMutation(api.dashboard.updateAsset);
  const [isSaving, setIsSaving] = useState(false);
  const [hook, setHook] = useState(asset.hook ?? "");
  const [centralIdea, setCentralIdea] = useState(asset.centralIdea ?? "");
  const [copy, setCopy] = useState(asset.copy ?? "");
  const [cta, setCta] = useState(asset.cta ?? "");
  const [destination, setDestination] = useState(asset.destination ?? "");

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateAsset({
        assetId: asset._id as Id<"assets">,
        hook: hook.trim() || undefined,
        centralIdea: centralIdea.trim() || undefined,
        copy: copy.trim() || undefined,
        cta: cta.trim() || undefined,
        destination: destination.trim() || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Copy</p>
          <h2>Distribution copy</h2>
          <p className="muted">
            Funnel: {labelForFunnel(asset.funnelStage)} · Metric: {labelForMetric(asset.primaryMetric ?? "")}
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save copy"}
        </button>
      </div>
      <label className="stack-label">
        Hook
        <textarea value={hook} onChange={(e) => setHook(e.target.value)} rows={2} />
      </label>
      <label className="stack-label">
        Central idea
        <textarea value={centralIdea} onChange={(e) => setCentralIdea(e.target.value)} rows={3} />
      </label>
      <label className="stack-label">
        Body / caption
        <textarea value={copy} onChange={(e) => setCopy(e.target.value)} rows={6} />
      </label>
      <label className="stack-label">
        CTA
        <input value={cta} onChange={(e) => setCta(e.target.value)} />
      </label>
      <label className="stack-label">
        Destination
        <input value={destination} onChange={(e) => setDestination(e.target.value)} />
      </label>
    </section>
  );
}
