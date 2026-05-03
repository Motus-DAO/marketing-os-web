"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { EmptyState } from "@/components/ui/empty-state";
import { AssetHeader, CarouselPreview, ReviewActionBar, ReviewNoteList, VersionList } from "@/components/dashboard/detail-sections";
import { FeedbackForm } from "@/components/dashboard/feedback-form";

export default function AssetDetailPage() {
  const params = useParams<{ assetId: string }>();
  const data = useQuery(api.dashboard.getAssetDetail, params?.assetId ? { assetId: params.assetId as any } : "skip");
  const createFeedbackComment = useMutation(api.dashboard.createFeedbackComment);
  const setCurrentVersion = useMutation(api.dashboard.setCurrentVersion);
  const setAssetVersionReviewState = useMutation(api.dashboard.setAssetVersionReviewState);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createAssetReference = useMutation(api.files.createAssetReference);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [overallFeedback, setOverallFeedback] = useState("");
  const [overallReferenceLabel, setOverallReferenceLabel] = useState("");
  const [overallReferenceFile, setOverallReferenceFile] = useState<File | null>(null);
  const [slideFeedback, setSlideFeedback] = useState("");
  const [slideReferenceLabel, setSlideReferenceLabel] = useState("");
  const [slideReferenceFile, setSlideReferenceFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isVideoAsset = useMemo(() => {
    const format = String(data?.asset?.format ?? "").toLowerCase();
    return format.includes("video") || format.includes("reel");
  }, [data?.asset?.format]);

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

  async function persistReference(file: File | null, label: string) {
    if (!file) return { referenceImageUrl: undefined, referenceLabel: label.trim() || undefined };
    if (!data?.project?._id || !data?.asset?._id) {
      throw new Error("Asset context missing");
    }

    const upload = await generateUploadUrl({});
    const response = await fetch(upload, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    const uploaded = await response.json();

    const created = await createAssetReference({
      projectId: data.project._id,
      storageId: uploaded.storageId,
      title: label.trim() || file.name,
      mimeType: file.type,
      relatedEntityType: "feedback_reference",
      relatedEntityId: data.asset._id,
      notes: "Uploaded from asset review flow.",
      createdAt: new Date().toISOString(),
    });
    return {
      referenceImageUrl: created.url ?? undefined,
      referenceLabel: label.trim() || file.name,
    };
  }

  async function submitOverallFeedback() {
    if (!overallFeedback.trim() || !data?.asset?._id) return;
    setIsSaving(true);
    try {
      const ref = await persistReference(overallReferenceFile, overallReferenceLabel);
      await createFeedbackComment({
        assetId: data.asset._id,
        assetVersionId: data.currentVersion?._id,
        scopeType: "asset",
        body: overallFeedback.trim(),
        referenceImageUrl: ref.referenceImageUrl,
        referenceLabel: ref.referenceLabel,
        authorType: "human",
        authorId: "Gerry",
      });
      setOverallFeedback("");
      setOverallReferenceLabel("");
      setOverallReferenceFile(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function submitSlideFeedback() {
    if (!slideFeedback.trim() || !data?.asset?._id) return;
    setIsSaving(true);
    try {
      const ref = await persistReference(slideReferenceFile, slideReferenceLabel);
      await createFeedbackComment({
        assetId: data.asset._id,
        assetVersionId: data.currentVersion?._id,
        scopeType: "slide",
        slideIndex: selectedSlideIndex,
        body: slideFeedback.trim(),
        referenceImageUrl: ref.referenceImageUrl,
        referenceLabel: ref.referenceLabel,
        authorType: "human",
        authorId: "Gerry",
      });
      setSlideFeedback("");
      setSlideReferenceLabel("");
      setSlideReferenceFile(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetCurrent(versionId: string) {
    if (!data?.asset?._id) return;
    setIsSaving(true);
    try {
      await setCurrentVersion({ assetId: data.asset._id, versionId: versionId as any });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReviewState(state: "approved" | "rejected" | "needs_changes" | "in_review") {
    if (!data?.asset?._id || !data?.currentVersion?._id) return;
    setIsSaving(true);
    try {
      await setAssetVersionReviewState({
        assetId: data.asset._id,
        versionId: data.currentVersion._id,
        reviewState: state,
      });
    } finally {
      setIsSaving(false);
    }
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
          <CarouselPreview asset={data.asset} version={data.currentVersion} selectedSlideIndex={selectedSlideIndex} onSelectSlide={setSelectedSlideIndex} />

          <section className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Feedback</p>
                <h2>Overall {isVideoAsset ? "video" : "carousel"} feedback</h2>
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
                    {comment.referenceImageUrl ? <img className="feedback-reference-image" src={comment.referenceImageUrl} alt={comment.referenceLabel || "Reference"} /> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-inline">No overall {isVideoAsset ? "video" : "carousel"} feedback yet.</div>
            )}
          </section>

          <FeedbackForm
            title="Add overall feedback"
            eyebrow="Feedback"
            placeholder={`Add ${isVideoAsset ? "pacing, framing, hook, CTA, or edit" : "narrative, structure, CTA, tone, or strategic"} feedback`}
            value={overallFeedback}
            onChange={setOverallFeedback}
            referenceLabel={overallReferenceLabel}
            onReferenceLabelChange={setOverallReferenceLabel}
            onFileChange={setOverallReferenceFile}
            onSubmit={submitOverallFeedback}
            disabled={isSaving || !overallFeedback.trim()}
            buttonLabel="Save overall feedback"
            fileLabel={`Optional reference ${isVideoAsset ? "video or image" : "image"}`}
            accept={isVideoAsset ? "image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime" : "image/png,image/jpeg,image/webp"}
          />

          <section className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">{isVideoAsset ? "Clip feedback" : "Slide feedback"}</p>
                <h2>{isVideoAsset ? `Video ${selectedSlideIndex + 1} feedback` : `Slide ${selectedSlideIndex + 1} feedback`}</h2>
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
                    {comment.referenceImageUrl ? <img className="feedback-reference-image" src={comment.referenceImageUrl} alt={comment.referenceLabel || "Reference"} /> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-inline">No {isVideoAsset ? "video-specific" : "slide-specific"} feedback yet.</div>
            )}
          </section>

          <FeedbackForm
            title={isVideoAsset ? `Comment on video ${selectedSlideIndex + 1}` : `Comment on slide ${selectedSlideIndex + 1}`}
            eyebrow={isVideoAsset ? "Clip feedback" : "Slide feedback"}
            placeholder={isVideoAsset ? "Add precise feedback for this video" : "Add precise feedback for this slide"}
            value={slideFeedback}
            onChange={setSlideFeedback}
            referenceLabel={slideReferenceLabel}
            onReferenceLabelChange={setSlideReferenceLabel}
            onFileChange={setSlideReferenceFile}
            onSubmit={submitSlideFeedback}
            disabled={isSaving || !slideFeedback.trim()}
            buttonLabel={isVideoAsset ? "Save video feedback" : "Save slide feedback"}
            fileLabel={`Optional reference ${isVideoAsset ? "video or image" : "image"}`}
            accept={isVideoAsset ? "image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime" : "image/png,image/jpeg,image/webp"}
          />

          <ReviewNoteList notes={data.notes} />
        </div>

        <div className="detail-side">
          <VersionList versions={data.versions} currentVersionId={data.asset.currentVersionId} onSetCurrent={handleSetCurrent} isUpdating={isSaving} />
          <ReviewActionBar currentState={data.asset.approvalState} isUpdating={isSaving} onSetState={handleReviewState} />
        </div>
      </div>
    </section>
  );
}
