"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";

export function PublishingPacketSection({ asset }: { asset: any }) {
  const updateAsset = useMutation(api.dashboard.updateAsset);
  const [open, setOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [brief, setBrief] = useState(asset.brief ?? "");
  const [script, setScript] = useState(asset.script ?? "");
  const [caption, setCaption] = useState(asset.caption ?? "");
  const [adConcept, setAdConcept] = useState(asset.adConcept ?? "");
  const [notionPacketUrl, setNotionPacketUrl] = useState(asset.notionPacketUrl ?? "");

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateAsset({
        assetId: asset._id as Id<"assets">,
        brief: brief.trim() || undefined,
        script: script.trim() || undefined,
        caption: caption.trim() || undefined,
        adConcept: adConcept.trim() || undefined,
        notionPacketUrl: notionPacketUrl.trim() || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel">
      <button type="button" className="section-header collapsible-header" onClick={() => setOpen(!open)}>
        <div>
          <p className="eyebrow">OpenClaw</p>
          <h2>Publishing packet</h2>
        </div>
        <span className="muted">{open ? "Hide" : "Show"}</span>
      </button>
      {open ? (
        <div className="stack-form">
          {asset.notionPageUrl ? (
            <Link href={asset.notionPageUrl} target="_blank" rel="noreferrer" className="text-link">
              Open Notion source page
            </Link>
          ) : null}
          <label className="stack-label">
            Notion packet URL
            <input value={notionPacketUrl} onChange={(e) => setNotionPacketUrl(e.target.value)} placeholder="https://notion.so/..." />
          </label>
          <label className="stack-label">
            Brief
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} />
          </label>
          <label className="stack-label">
            Script
            <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={4} />
          </label>
          <label className="stack-label">
            Caption
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} />
          </label>
          <label className="stack-label">
            Ad concept
            <textarea value={adConcept} onChange={(e) => setAdConcept(e.target.value)} rows={3} />
          </label>
          <button type="button" className="secondary-button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save packet"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
