#!/usr/bin/env bash
# Merge dev deployment data INTO production (append only — does not delete prod data).
#
# Dev:  accomplished-dragon-257
# Prod: savory-hippopotamus-103
#
# Usage: ./scripts/migrate-dev-to-prod.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SNAPSHOT_DIR="${SNAPSHOT_DIR:-snapshots}"
EXPORT_ZIP="${EXPORT_ZIP:-$SNAPSHOT_DIR/dev-export.zip}"
DEV_DEPLOYMENT="${DEV_DEPLOYMENT:-accomplished-dragon-257}"

mkdir -p "$SNAPSHOT_DIR"

echo "Exporting from dev ($DEV_DEPLOYMENT)…"
npx convex export \
  --deployment "$DEV_DEPLOYMENT" \
  --include-file-storage \
  --path "$EXPORT_ZIP"

echo "Appending into production (savory-hippopotamus-103)…"
npx convex import --prod --append -y "$EXPORT_ZIP"

echo "Done. Prod keeps existing rows; new dev-only documents were appended."
echo "Note: duplicate projects (same slug) may appear if both deployments had them."
