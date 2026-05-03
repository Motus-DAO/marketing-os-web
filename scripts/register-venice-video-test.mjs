import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const deployment = process.env.CONVEX_DEPLOYMENT;
if (!deployment) throw new Error("Missing CONVEX_DEPLOYMENT");

const now = new Date().toISOString();
const projectId = process.env.PROJECT_ID;
const assetId = process.env.ASSET_ID;
const videoPath = process.env.VIDEO_PATH ?? "/home/gerry/.openclaw/workspace/venice-first-video.mp4";
const imagePath = process.env.IMAGE_PATH ?? "/home/gerry/.openclaw/workspace/venice-first-image.png";

if (!projectId) throw new Error("Missing PROJECT_ID");
if (!assetId) throw new Error("Missing ASSET_ID");

function convexRun(fn, args) {
  const cmdArgs = ["convex", "run", "--deployment", deployment, fn];
  if (args !== undefined) cmdArgs.push(JSON.stringify(args));
  const out = execFileSync("npx", cmdArgs, { cwd: repoRoot, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }).trim();
  try { return JSON.parse(out); } catch { return out; }
}

function convexUpload(filePath, mimeType) {
  const uploadUrl = convexRun("files:generateUploadUrl");
  const url = typeof uploadUrl === "string" ? uploadUrl : uploadUrl.url;
  const result = execFileSync("curl", ["-sS", "-X", "POST", "-H", `Content-Type: ${mimeType}`, "--data-binary", `@${filePath}`, url], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  }).trim();
  const parsed = JSON.parse(result);
  return parsed.storageId || parsed.storage_id || parsed.id;
}

const coverStorageId = convexUpload(imagePath, "image/png");
const coverRef = convexRun("files:createAssetReference", {
  projectId,
  storageId: coverStorageId,
  title: "Venice video test cover",
  mimeType: "image/png",
  relatedEntityType: "asset_version",
  relatedEntityId: assetId,
  notes: "Venice-generated test still used as cover image for a video asset version.",
  createdAt: now,
});

const videoStorageId = convexUpload(videoPath, "video/mp4");
const videoRef = convexRun("files:createAssetReference", {
  projectId,
  storageId: videoStorageId,
  title: "Venice video test",
  mimeType: "video/mp4",
  relatedEntityType: "asset_version",
  relatedEntityId: assetId,
  notes: "First Venice-generated video test clip.",
  createdAt: now,
});

const versionId = convexRun("assets:createAssetVersion", {
  projectId,
  assetId,
  versionLabel: "venice-video-test-v1",
  coverImageUrl: coverRef.url,
  videoPreviewUrls: [videoRef.url],
  mediaType: "video",
  status: "candidate",
  notes: "First Venice-generated video test registered into the review app.",
  createdAt: now,
  updatedAt: now,
  setAsCurrent: true,
});

convexRun("dashboard:createReviewNote", {
  assetId,
  assetVersionId: versionId,
  note: "Registered first Venice-generated video test into the review app.",
  authorType: "agent",
  authorId: "openclaw",
});

convexRun("dashboard:setAssetVersionReviewState", {
  assetId,
  versionId,
  reviewState: "in_review",
});

console.log(JSON.stringify({ versionId, coverUrl: coverRef.url, videoUrl: videoRef.url }, null, 2));
