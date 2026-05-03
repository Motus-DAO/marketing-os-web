"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";

function titleCase(value?: string | null) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function AssetHeader({ asset, project, notionUrl }: { asset: any; project: any; notionUrl?: string | null }) {
  return (
    <section className="panel">
      <div className="card-header align-start">
        <div>
          <p className="eyebrow">{project?.name || "Project"}</p>
          <h1>{asset.title}</h1>
        </div>
        <StatusBadge
          value={asset.approvalState}
          tone={asset.approvalState === "approved" ? "success" : asset.approvalState === "rejected" ? "danger" : "warning"}
        />
      </div>
      <div className="meta-grid dense muted">
        <span>Platform: {titleCase(asset.platform)}</span>
        <span>Format: {titleCase(asset.format)}</span>
        <span>Funnel: {titleCase(asset.funnelStage)}</span>
        <span>Status: {titleCase(asset.status)}</span>
      </div>
      {notionUrl ? (
        <Link href={notionUrl} target="_blank" rel="noreferrer" className="text-link">
          Open source reference
        </Link>
      ) : null}
    </section>
  );
}

export function CarouselPreview({ version, asset, selectedSlideIndex, onSelectSlide }: { version: any; asset?: any; selectedSlideIndex: number; onSelectSlide: (index: number) => void }) {
  const previewUrls = version?.previewUrls ?? [];
  const videoPreviewUrls = version?.videoPreviewUrls ?? [];
  const normalizedFormat = String(asset?.format ?? "").toLowerCase();
  const isVideoAsset = normalizedFormat.includes("video") || normalizedFormat.includes("reel");
  const mediaItems = isVideoAsset
    ? videoPreviewUrls.map((url: string, index: number) => ({ url, kind: "video", label: `Video ${index + 1}` }))
    : previewUrls.map((url: string, index: number) => ({ url, kind: "image", label: `Slide ${index + 1}` }));

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Preview</p>
          <h2>{version?.versionLabel || "No active version"}</h2>
        </div>
      </div>
      {mediaItems.length > 0 ? (
        <div className="preview-grid">
          {mediaItems.map((item: any, index: number) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              className={`preview-frame preview-button ${selectedSlideIndex === index ? "is-selected" : ""}`}
              onClick={() => onSelectSlide(index)}
            >
              {item.kind === "video" ? (
                <video src={item.url} controls muted playsInline preload="metadata" />
              ) : (
                <img src={item.url} alt={item.label} />
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="thumb-placeholder large">No preview media for this version yet.</div>
      )}
    </section>
  );
}

export function VersionList({ versions, currentVersionId, onSetCurrent, isUpdating }: { versions: any[]; currentVersionId?: string; onSetCurrent: (versionId: string) => void; isUpdating: boolean }) {
  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Versions</p>
          <h2>Available versions</h2>
        </div>
      </div>
      {versions.length ? (
        <div className="stack-list">
          {versions.map((version) => (
            <div key={version._id} className="list-row">
              <div className="mini-thumb">
                {version.coverImageUrl ? (
                  <img src={version.coverImageUrl} alt={version.versionLabel} />
                ) : version.videoPreviewUrls?.[0] ? (
                  <video src={version.videoPreviewUrls[0]} muted playsInline preload="metadata" />
                ) : (
                  <div className="thumb-placeholder">No thumb</div>
                )}
              </div>
              <div className="list-row-body">
                <strong>{version.versionLabel}</strong>
                <p className="muted">
                  {titleCase(version.status)} • {formatDate(version.createdAt)}
                </p>
              </div>
              <button className="secondary-button" disabled={isUpdating || currentVersionId === version._id} onClick={() => onSetCurrent(version._id)}>
                {currentVersionId === version._id ? "Current" : "Set current"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-inline">No versions added yet.</div>
      )}
    </section>
  );
}

export function ReviewActionBar({ currentState, isUpdating, onSetState }: { currentState?: string; isUpdating: boolean; onSetState: (state: "approved" | "rejected" | "needs_changes" | "in_review") => void }) {
  return (
    <section className="panel actions-panel">
      <div>
        <p className="eyebrow">Actions</p>
        <h2>Review state</h2>
        <p className="muted">Current state: {titleCase(currentState)}</p>
      </div>
      <div className="action-grid">
        <button className="secondary-button" disabled={isUpdating} onClick={() => onSetState("in_review")}>In review</button>
        <button className="primary-button" disabled={isUpdating} onClick={() => onSetState("approved")}>Approve</button>
        <button className="warning-button" disabled={isUpdating} onClick={() => onSetState("needs_changes")}>Needs changes</button>
        <button className="danger-button" disabled={isUpdating} onClick={() => onSetState("rejected")}>Reject</button>
      </div>
    </section>
  );
}

export function ReviewNoteList({ notes }: { notes: any[] }) {
  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Notes</p>
          <h2>Review notes</h2>
        </div>
      </div>
      {notes.length ? (
        <div className="stack-list">
          {notes.map((note) => (
            <div key={note._id} className="note-card">
              <div className="card-header">
                <strong>{note.authorId || note.authorType || "Internal reviewer"}</strong>
                <span className="muted">{formatDate(note.createdAt)}</span>
              </div>
              <p>{note.note}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-inline">No review notes yet.</div>
      )}
    </section>
  );
}
