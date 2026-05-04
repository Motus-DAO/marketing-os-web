import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const convexRoot = path.resolve(repoRoot, "../convex-app");
const deployment = process.env.CONVEX_DEPLOYMENT;
const videoPath = process.env.VIDEO_PATH ?? "/home/gerry/.openclaw/workspace/venice-first-video.mp4";
const imagePath = process.env.IMAGE_PATH ?? "/home/gerry/.openclaw/workspace/venice-first-image.png";
const projectName = process.env.PROJECT_NAME ?? "MotusDAO Videos";
const assetTitle = process.env.ASSET_TITLE ?? "Venice Video Test";
const versionLabel = process.env.VERSION_LABEL ?? "venice-video-v1";
const now = new Date().toISOString();

function convexRun(fn, args) {
  const cmdArgs = deployment ? ["convex", "run", "--deployment", deployment, fn] : ["convex", "run", fn];
  if (args !== undefined) cmdArgs.push(JSON.stringify(args));
  const out = execFileSync("npx", cmdArgs, { cwd: convexRoot, encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }).trim();
  try { return JSON.parse(out); } catch { return out; }
}

function convexUpload(filePath, mimeType) {
  const uploadUrl = convexRun("files:generateUploadUrl");
  const url = typeof uploadUrl === "string" ? uploadUrl : uploadUrl.url;
  const result = execFileSync("curl", ["-sS", "-X", "POST", "-H", `Content-Type: ${mimeType}`, "--data-binary", `@${filePath}`, url], {
    cwd: convexRoot,
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
  }).trim();
  const parsed = JSON.parse(result);
  return parsed.storageId || parsed.storage_id || parsed.id;
}

const projects = convexRun("dashboard:listProjects");
const existingProject = Array.isArray(projects)
  ? projects.find((project) => String(project.name ?? "").toLowerCase() === projectName.toLowerCase())
  : null;

const projectId = existingProject?._id ?? convexRun("projects:createProject", {
  name: projectName,
  slug: "motusdao-videos",
  description: "Video review and iteration set for MotusDAO.",
  status: "active",
  primaryGoals: ["Review founder videos", "Review AI video outputs"],
  primaryMonetizationPath: "Carousel/video/ads → free masterclass → nurture → paid course sale",
  activeChannels: ["instagram", "meta_ads"],
  createdAt: now,
  updatedAt: now,
});

const assetId = convexRun("dashboard:createAsset", {
  projectId,
  title: assetTitle,
  platform: "instagram",
  format: "video",
  funnelStage: "consideration",
  status: "in_review",
  approvalState: "in_review",
  objective: "Validate first Venice-generated video in the review workflow.",
  audienceSummary: "Psychologists in LATAM evaluating digital practice transition.",
  version: versionLabel,
  sourceIdeaTitle: assetTitle,
  cta: "Register for the free masterclass.",
});

const coverStorageId = convexUpload(imagePath, "image/png");
const coverRef = convexRun("files:createAssetReference", {
  projectId,
  storageId: coverStorageId,
  title: `${assetTitle} cover`,
  mimeType: "image/png",
  relatedEntityType: "asset_version",
  relatedEntityId: assetId,
  notes: "Venice-generated still used as cover image for the first video asset.",
  createdAt: now,
});

const videoStorageId = convexUpload(videoPath, "video/mp4");
const videoRef = convexRun("files:createAssetReference", {
  projectId,
  storageId: videoStorageId,
  title: `${assetTitle} video`,
  mimeType: "video/mp4",
  relatedEntityType: "asset_version",
  relatedEntityId: assetId,
  notes: "First Venice-generated video test clip uploaded into the review workflow.",
  createdAt: now,
});

const versionId = convexRun("assets:createAssetVersion", {
  projectId,
  assetId,
  versionLabel,
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

try {
  convexRun("dashboard:setAssetVersionReviewState", {
    assetId,
    versionId,
    reviewState: "in_review",
  });
} catch {}

console.log(JSON.stringify({ projectId, assetId, versionId, coverUrl: coverRef.url, videoUrl: videoRef.url }, null, 2));
