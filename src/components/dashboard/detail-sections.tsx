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

export function CarouselPreview({ version, selectedSlideIndex, onSelectSlide }: { version: any; selectedSlideIndex: number; onSelectSlide: (index: number) => void }) {
  const previewUrls = version?.previewUrls ?? [];

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Preview</p>
          <h2>{version?.versionLabel || "No active version"}</h2>
        </div>
      </div>
      {previewUrls.length > 0 ? (
        <div className="preview-grid">
          {previewUrls.map((url: string, index: number) => (
            <button
              key={`${url}-${index}`}
              type="button"
              className={`preview-frame preview-button ${selectedSlideIndex === index ? "is-selected" : ""}`}
              onClick={() => onSelectSlide(index)}
            >
              <img src={url} alt={`Slide ${index + 1}`} />
              <span>Slide {index + 1}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="thumb-placeholder large">No preview images for this version yet.</div>
      )}
    </section>
  );
}

export function VersionList({ versions, currentVersionId }: { versions: any[]; currentVersionId?: string }) {
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
                {version.coverImageUrl ? <img src={version.coverImageUrl} alt={version.versionLabel} /> : <div className="thumb-placeholder">No thumb</div>}
              </div>
              <div className="list-row-body">
                <strong>{version.versionLabel}</strong>
                <p className="muted">
                  {titleCase(version.status)} • {formatDate(version.createdAt)}
                </p>
              </div>
              <span className="mini-state">{currentVersionId === version._id ? "Current" : "Version"}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-inline">No versions added yet.</div>
      )}
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
