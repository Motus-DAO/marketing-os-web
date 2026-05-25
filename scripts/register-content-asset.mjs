#!/usr/bin/env node
/**
 * Register a content asset with Phase 7 distribution metadata.
 *
 * Payload JSON shape:
 * {
 *   "projectSlug": "psicologia-digital-masterclass",
 *   "title": "Reel 1 — pain point hook",
 *   "platform": "instagram",
 *   "format": "reel",
 *   "funnelStage": "bridge",
 *   "distributionType": "organic",
 *   "primaryMetric": "registrations",
 *   "cta": "Register for the free masterclass",
 *   "destination": "Masterclass landing page",
 *   "hook": "Optional hook line",
 *   "centralIdea": "Optional core idea",
 *   "copy": "Optional caption/body",
 *   "contentKind": "video",
 *   "objective": "Optional objective",
 *   "brief": "Optional brief",
 *   "script": "Optional script",
 *   "caption": "Optional caption",
 *   "adConcept": "Optional ad concept",
 *   "notionPageUrl": "https://notion.so/...",
 *   "notionPacketUrl": "https://notion.so/..."
 * }
 *
 * Usage:
 *   node scripts/register-content-asset.mjs path/to/payload.json
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

function convexRun(functionPath, args = {}) {
  const argsJson = JSON.stringify(args);
  const out = execSync(`npx convex run ${functionPath} '${argsJson.replace(/'/g, "'\\''")}'`, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return JSON.parse(out.trim());
}

const payloadPath = process.argv[2];
if (!payloadPath) {
  console.error("Usage: node scripts/register-content-asset.mjs <payload.json>");
  process.exit(1);
}

const payload = JSON.parse(readFileSync(payloadPath, "utf8"));
const projectSlug = payload.projectSlug ?? "psicologia-digital-masterclass";

const projects = convexRun("projects:listProjects");
const project = projects.find((p) => p.slug === projectSlug);
if (!project) {
  console.error(`Project not found for slug: ${projectSlug}. Run seedMasterclassProject first.`);
  process.exit(1);
}

const assetId = convexRun("dashboard:createAsset", {
  projectId: project._id,
  title: payload.title,
  platform: payload.platform,
  format: payload.format,
  funnelStage: payload.funnelStage ?? "bridge",
  status: payload.status ?? "draft",
  approvalState: payload.approvalState ?? "pending",
  distributionType: payload.distributionType,
  primaryMetric: payload.primaryMetric,
  cta: payload.cta,
  destination: payload.destination,
  hook: payload.hook,
  centralIdea: payload.centralIdea,
  copy: payload.copy,
  contentKind: payload.contentKind,
  objective: payload.objective,
  brief: payload.brief,
  script: payload.script,
  caption: payload.caption,
  adConcept: payload.adConcept,
  notionPageUrl: payload.notionPageUrl,
  notionPacketUrl: payload.notionPacketUrl,
  campaignId: payload.campaignId,
});

console.log(JSON.stringify({ assetId, projectId: project._id }, null, 2));
