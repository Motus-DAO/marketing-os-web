<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Phase 7 — Distribution layer

- **Canonical content record:** `assets` (CTA, destination, primary metric, copy, publishing packet).
- **Scheduling:** `calendarItems` linked via `relatedAssetId`; use `syncFromAsset` after edits.
- **Masterclass project:** `npx convex run distribution:seedMasterclassProject`
- **Convex production:** `npm run convex:deploy:prod` → `savory-hippopotamus-103`
- **Vercel env:** `NEXT_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CONVEX_SITE_URL` must match production URLs in `.env.example`
- **Dev → prod data (append, no deletes):** `npm run convex:migrate:dev-to-prod` exports `accomplished-dragon-257` and appends into `savory-hippopotamus-103`
- **Week 1 parrilla:** Calendar UI → “Seed week 1 parrilla” (requires masterclass project).
- **OpenClaw import:** `node scripts/register-content-asset.mjs payload.json`
