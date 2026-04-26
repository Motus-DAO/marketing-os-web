import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const deployment = process.env.CONVEX_DEPLOYMENT;

if (!deployment) {
  console.error("Missing CONVEX_DEPLOYMENT in environment.");
  process.exit(1);
}

function convexRun(fn, args) {
  const cmdArgs =
    deployment === "prod"
      ? ["convex", "run", "--prod", fn]
      : deployment === "local"
        ? ["convex", "run", "--deployment", "local", fn]
        : ["convex", "run", "--deployment", deployment, fn];

  if (args !== undefined) cmdArgs.push(JSON.stringify(args));

  const out = execFileSync("npx", cmdArgs, {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();

  try {
    return JSON.parse(out);
  } catch {
    return out;
  }
}

function convexUpload(filePath, mimeType = "image/png") {
  const uploadUrl = convexRun("files:generateUploadUrl");
  const url = typeof uploadUrl === "string" ? uploadUrl : uploadUrl.url;
  const file = readFileSync(filePath);
  const result = execFileSync("curl", ["-sS", "-X", "POST", "-H", `Content-Type: ${mimeType}`, "--data-binary", `@${filePath}`, url], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
  const parsed = JSON.parse(result);
  return parsed.storageId || parsed.storage_id || parsed.id;
}

const now = new Date().toISOString();
const projectId = convexRun("projects:createProject", {
  name: "MotusDAO Marketing OS",
  slug: "motusdao-marketing-os",
  description: "Marketing asset review flow for MotusDAO carousel production.",
  status: "active",
  primaryGoals: ["Review carousels", "Track revisions", "Ship stronger content"],
  primaryMonetizationPath: "Organic content to pipeline",
  activeChannels: ["instagram"],
  createdAt: now,
  updatedAt: now,
});

const items = [
  {
    slug: "5-errores",
    title: "5 errores",
    cover: path.resolve(repoRoot, "../content/carousels/5-errores/cover.png"),
    objective: "Educational carousel review",
    sourceIdeaTitle: "IG carousel 5 errores",
  },
  {
    slug: "yo-ya-doy-terapia-online",
    title: "Yo ya doy terapia online",
    cover: path.resolve(repoRoot, "../content/carousels/yo-ya-doy-terapia-online/cover.png"),
    objective: "Positioning carousel review",
    sourceIdeaTitle: "Yo ya doy terapia online",
  },
  {
    slug: "masterclass-psicologia-digital",
    title: "Masterclass psicología digital",
    cover: path.resolve(repoRoot, "../content/carousels/masterclass-psicologia-digital/cover.png"),
    objective: "Launch carousel review",
    sourceIdeaTitle: "Masterclass psicología digital",
  },
  {
    slug: "dar-terapia-online-no-es-solo-cambiar-de-formato",
    title: "Dar terapia online no es solo cambiar de formato",
    cover: path.resolve(repoRoot, "../content/carousels/dar-terapia-online-no-es-solo-cambiar-de-formato/cover.png"),
    objective: "Narrative carousel review",
    sourceIdeaTitle: "Dar terapia online no es solo cambiar de formato",
  },
];

for (const item of items) {
  const storageId = convexUpload(item.cover);
  const ref = convexRun("files:createAssetReference", {
    projectId,
    storageId,
    title: `${item.title} cover`,
    mimeType: "image/png",
    relatedEntityType: "asset",
    notes: "Seeded initial carousel cover for review flow.",
    createdAt: now,
  });

  const primaryReferenceId = ref.refId || ref.referenceId || ref._id;

  const assetId = convexRun("dashboard:createAsset", {
    projectId,
    title: item.title,
    platform: "instagram",
    format: "carousel",
    funnelStage: "consideration",
    status: "in_review",
    approvalState: "pending",
    objective: item.objective,
    audienceSummary: "Psychologists building online practice content",
    version: "v1",
    sourceIdeaTitle: item.sourceIdeaTitle,
    cta: "Review and iterate",
    campaignId: "motusdao-seed-01",
    primaryReferenceId,
  });

  const versionId = convexRun("assets:createAssetVersion", {
    projectId,
    assetId,
    versionLabel: "v1",
    coverImageUrl: ref.url,
    previewUrls: [ref.url],
    status: "candidate",
    notes: "Initial seeded version for new hosted review flow.",
    createdAt: now,
    updatedAt: now,
    setAsCurrent: true,
  });

  convexRun("dashboard:createReviewNote", {
    assetId,
    assetVersionId: versionId,
    note: "Seeded into the fresh hosted app so the review flow can restart cleanly.",
    authorType: "agent",
    authorId: "openclaw",
  });
}

console.log(JSON.stringify({ projectId, seededAssets: items.length }, null, 2));
