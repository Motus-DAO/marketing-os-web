"use client";

import { useMemo, useState } from "react";
import { buildDownloadableMediaItems, downloadAllMediaItems } from "@/lib/download-asset-media";

export function DownloadAllAssetsButton({
  assetTitle,
  version,
  isVideoAsset,
}: {
  assetTitle: string;
  version?: { versionLabel?: string | null; previewUrls?: string[]; videoPreviewUrls?: string[] } | null;
  isVideoAsset: boolean;
}) {
  const items = useMemo(
    () =>
      buildDownloadableMediaItems({
        assetTitle,
        versionLabel: version?.versionLabel,
        previewUrls: version?.previewUrls,
        videoPreviewUrls: version?.videoPreviewUrls,
        isVideoAsset,
      }),
    [assetTitle, isVideoAsset, version?.previewUrls, version?.versionLabel, version?.videoPreviewUrls],
  );
  const [isDownloading, setIsDownloading] = useState(false);

  if (!items.length) return null;

  const label = isVideoAsset ? "videos" : "slides";

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadAllMediaItems(items);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button type="button" className="secondary-button" disabled={isDownloading} onClick={handleDownload}>
      {isDownloading ? "Downloading…" : `Download all ${label} (${items.length})`}
    </button>
  );
}
