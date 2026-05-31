export type DownloadableMediaItem = {
  url: string;
  filename: string;
  kind: "image" | "video";
};

function extensionFromUrl(url: string, kind: "image" | "video"): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-z0-9]+)$/i);
    if (match) return `.${match[1].toLowerCase()}`;
  } catch {
    /* ignore invalid URLs */
  }
  return kind === "video" ? ".mp4" : ".png";
}

function sanitizeFilename(value: string): string {
  return (
    value
      .trim()
      .replace(/[^\w-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 80) || "asset"
  );
}

export function buildDownloadableMediaItems(options: {
  assetTitle: string;
  versionLabel?: string | null;
  previewUrls?: string[];
  videoPreviewUrls?: string[];
  isVideoAsset: boolean;
}): DownloadableMediaItem[] {
  const base = sanitizeFilename(options.assetTitle);
  const version = sanitizeFilename(options.versionLabel ?? "version");
  const previewUrls = options.previewUrls ?? [];
  const videoPreviewUrls = options.videoPreviewUrls ?? [];

  if (options.isVideoAsset) {
    return videoPreviewUrls.map((url, index) => ({
      url,
      kind: "video" as const,
      filename: `${base}_${version}_video-${String(index + 1).padStart(2, "0")}${extensionFromUrl(url, "video")}`,
    }));
  }

  return previewUrls.map((url, index) => ({
    url,
    kind: "image" as const,
    filename: `${base}_${version}_slide-${String(index + 1).padStart(2, "0")}${extensionFromUrl(url, "image")}`,
  }));
}

export async function downloadAllMediaItems(items: DownloadableMediaItem[]): Promise<void> {
  if (!items.length) return;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const response = await fetch(item.url);
    if (!response.ok) {
      throw new Error(`Could not download ${item.filename}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = item.filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);

    if (index < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
}
