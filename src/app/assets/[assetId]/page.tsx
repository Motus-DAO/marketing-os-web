"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { EmptyState } from "@/components/ui/empty-state";
import { AssetHeader, CarouselPreview, ReviewNoteList, VersionList } from "@/components/dashboard/detail-sections";

export default function AssetDetailPage() {
  const params = useParams<{ assetId: string }>();
  const data = useQuery(api.dashboard.getAssetDetail, params?.assetId ? { assetId: params.assetId as any } : "skip");
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  const assetComments = useMemo(
    () => (data?.feedbackComments ?? []).filter((comment: any) => comment.scopeType === "asset"),
    [data?.feedbackComments],
  );
  const slideComments = useMemo(
    () => (data?.feedbackComments ?? []).filter((comment: any) => comment.scopeType === "slide" && comment.slideIndex === selectedSlideIndex),
    [data?.feedbackComments, selectedSlideIndex],
  );

  if (data === undefined) {
    return <div className="loading-state">Loading asset…</div>;
  }

  if (!data) {
    return <EmptyState title="Asset not found" body="The selected asset does not exist or is not available yet." />;
  }

  return (
    <section className="page-stack">
      <div className="page-header-row">
        <div>
          <Link href={data.project?._id ? `/projects/${data.project._id}` : "/"} className="text-link">
            ← Back to asset list
          </Link>
          <p className="eyebrow">Asset Detail</p>
        </div>
      </div>

      <AssetHeader asset={data.asset} project={data.project} notionUrl={data.asset.notionPageUrl || data.primaryReference?.location || null} />

      <div className="detail-grid">
        <div className="detail-main">
          <CarouselPreview version={data.currentVersion} selectedSlideIndex={selectedSlideIndex} onSelectSlide={setSelectedSlideIndex} />

          <section className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Feedback</p>
                <h2>Overall carousel feedback</h2>
              </div>
            </div>
            {assetComments.length ? (
              <div className="stack-list">
                {assetComments.map((comment: any) => (
                  <div key={comment._id} className="note-card">
                    <div className="card-header">
                      <strong>{comment.authorId || comment.authorType || "Reviewer"}</strong>
                      <span className="muted">{comment.status}</span>
                    </div>
                    <p>{comment.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-inline">No overall carousel feedback yet.</div>
            )}
          </section>

          <section className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Slide feedback</p>
                <h2>Slide {selectedSlideIndex + 1} feedback</h2>
              </div>
            </div>
            {slideComments.length ? (
              <div className="stack-list">
                {slideComments.map((comment: any) => (
                  <div key={comment._id} className="note-card">
                    <div className="card-header">
                      <strong>{comment.authorId || comment.authorType || "Reviewer"}</strong>
                      <span className="muted">{comment.status}</span>
                    </div>
                    <p>{comment.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-inline">No slide-specific feedback yet.</div>
            )}
          </section>

          <ReviewNoteList notes={data.notes} />
        </div>

        <div className="detail-side">
          <VersionList versions={data.versions} currentVersionId={data.asset.currentVersionId} />
          <section className="panel actions-panel">
            <div>
              <p className="eyebrow">Actions</p>
              <h2>Review state</h2>
              <p className="muted">Current state: {data.asset.approvalState}</p>
            </div>
            <div className="empty-inline">Interactive review actions are the next pass.</div>
          </section>
        </div>
      </div>
    </section>
  );
}
