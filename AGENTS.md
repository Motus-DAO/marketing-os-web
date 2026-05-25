<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Phase 7 — Distribution layer

- **Canonical content record:** `assets` (CTA, destination, primary metric, copy, publishing packet).
- **Scheduling:** `calendarItems` linked via `relatedAssetId`; use `syncFromAsset` after edits.
- **Masterclass project:** `npx convex run distribution:seedMasterclassProject`
- **Week 1 parrilla:** Calendar UI → “Seed week 1 parrilla” (requires masterclass project).
- **OpenClaw import:** `node scripts/register-content-asset.mjs payload.json`
