"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { labelForFunnel, labelForMetric } from "@/lib/distribution-constants";

/** Split thread copy into tweet-sized segments on markers like "2/8" or "3/" at a line start. */
function splitThreadSegments(copy: string): string[] {
  const segments = copy.split(/\n+(?=\d+\/\d*\s)/).map((s) => s.trim()).filter(Boolean);
  return segments.length > 1 ? segments : [copy];
}

function CopyReadout({ asset }: { asset: any }) {
  const isThread = String(asset.format ?? "").toLowerCase().includes("thread");
  const segments = useMemo(
    () => (asset.copy && isThread ? splitThreadSegments(asset.copy) : null),
    [asset.copy, isThread],
  );

  const hasAnything = asset.hook || asset.centralIdea || asset.copy || asset.cta || asset.destination;
  if (!hasAnything) {
    return <div className="empty-inline">No copy yet. Use Edit to add hook, body and CTA.</div>;
  }

  return (
    <div className="copy-readout">
      {asset.hook ? (
        <div className="copy-readout-block">
          <p className="eyebrow">Hook</p>
          <p className="copy-readout-text">{asset.hook}</p>
        </div>
      ) : null}
      {asset.centralIdea ? (
        <div className="copy-readout-block">
          <p className="eyebrow">Central idea</p>
          <p className="copy-readout-text">{asset.centralIdea}</p>
        </div>
      ) : null}
      {asset.copy ? (
        <div className="copy-readout-block">
          <p className="eyebrow">{isThread ? "Thread" : "Body / caption"}</p>
          {segments && segments.length > 1 ? (
            <ol className="thread-segments">
              {segments.map((segment, index) => (
                <li key={index} className="thread-segment">
                  <p className="copy-readout-text">{segment}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="copy-readout-text">{asset.copy}</p>
          )}
        </div>
      ) : null}
      {asset.cta || asset.destination ? (
        <div className="meta-grid dense muted">
          {asset.cta ? <span>CTA: {asset.cta}</span> : null}
          {asset.destination ? <span>Destination: {asset.destination}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export function CopyContentPanel({ asset }: { asset: any }) {
  const updateAsset = useMutation(api.dashboard.updateAsset);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
      setIsEditing(false);
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
        {isEditing ? (
          <div className="header-actions-stack">
            <button type="button" className="secondary-button" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </button>
            <button type="button" className="primary-button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save copy"}
            </button>
          </div>
        ) : (
          <button type="button" className="secondary-button" onClick={() => setIsEditing(true)}>
            Edit copy
          </button>
        )}
      </div>

      {isEditing ? (
        <>
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
            <textarea value={copy} onChange={(e) => setCopy(e.target.value)} rows={12} />
          </label>
          <label className="stack-label">
            CTA
            <input value={cta} onChange={(e) => setCta(e.target.value)} />
          </label>
          <label className="stack-label">
            Destination
            <input value={destination} onChange={(e) => setDestination(e.target.value)} />
          </label>
        </>
      ) : (
        <CopyReadout asset={asset} />
      )}
    </section>
  );
}
