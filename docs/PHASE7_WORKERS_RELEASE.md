# ARES Phase 7 — Cloudflare Workers release and live verification

**Real production hostname:** https://spcapps.openstacktool.com/ (note the letter **c**).
**Cloudflare Worker name:** `ares-mission-control`.
**Repository:** `baban9999ytr/ARES-Mission-Control`, default branch `main`.
**Platform:** Workers Static Assets, **not Cloudflare Pages**.

## Findings before the fix

On 14 November 2026, direct tests of both `spcapps.openstacktool.com` and a versioned `*.workers.dev` URL showed a functional measured-CTX planner, a 1000×750 WebP map, and two A* routes (about 2.07 km and 2.13 km for the current default example). But:

1. The nested navigation URL `/planner/route?mode=demo` returned HTTP 404.
2. `/build-info.json` returned HTTP 404 and the UI displayed "Build: local development".
3. `/sources.html` claimed the app was still entirely synthetic, contradicting the measured CTX default.

These were real observations. Tests on the new deployment must be repeated; local/CI passes are not proof of Workers release.

## Code changes

- `wrangler.json`: explicit Worker name, `./dist` asset root, `not_found_handling: single-page-application`.
- `sources.html`: accurate measured optical/DEM provenance, separate synthetic mode, limitations.
- `tools/build.js`: includes `IMPORT_REAL_DATA.md`, which `sources.html` links.
- `tests/phase7-workers.test.js`: configuration/provenance/deep-link base checks.
- `README.md`: corrected Workers production deployment instructions.

The existing `<base href="/">` on `index.html` lets relative HTML assets resolve from nested navigation URLs. The Worker serves `index.html` for SPA navigation requests only; direct requests to nonexistent data/JS paths must still fail, not silently return JSON placeholders.

The build already generates `dist/build-info.json` from `CF_PAGES_COMMIT_SHA` (if set) or local Git HEAD and writes an ID and timestamp. Even though the environment-variable prefix mentions Pages, the fallback Git SHA also works in Workers Builds. The UI reads `./build-info.json` on startup. Deploying `dist/` is essential.

## Workers Builds configuration — verify in Dashboard

Go to **Workers & Pages → ares-mission-control → Settings → Builds** (labels may differ):

| Setting           | Required                                     |
| ----------------- | -------------------------------------------- |
| Source repository | `baban9999ytr/ARES-Mission-Control`          |
| Production branch | `main`                                       |
| Root directory    | repository root                              |
| Build command     | `npm run build`                              |
| Deploy command    | `npx wrangler deploy`                        |
| Node version      | 22 (see `.node-version`)                     |
| Wrangler config   | `wrangler.json` committed at repository root |
| Static asset root | `./dist` (from Wrangler config)              |

**Critical:** Do not use `npx wrangler deploy --assets .`, `--assets ./public`, a dashboard upload of the repository root, or a custom deploy step that ignores `wrangler.json`. Those may publish the input files while dropping generated `build-info.json` and SPA fallback.

Avoid removing or recreating the existing Worker or custom domain. `name` in `wrangler.json` matches the existing Worker, and the custom domain is managed in the dashboard.

Official docs:

- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/static-assets/headers/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/

## Smoke-test checklist after a successful production deployment

Run from a browser or shell, with the actual production domain:

1. `https://spcapps.openstacktool.com/` → HTTP 200; real CTX map and comparison visible.
2. `https://spcapps.openstacktool.com/build-info.json` → HTTP 200, JSON, `id` matching the deployed main commit prefix. UI must not say "local development".
3. `https://spcapps.openstacktool.com/planner/route?mode=demo` → navigation HTTP 200; synthetic terrain image and demo label load, and CSS/JS requests succeed.
4. `https://spcapps.openstacktool.com/sources.html` → CTX v0.2 explanation; no stale "synthetic-only" assertions.
5. `https://spcapps.openstacktool.com/public/data/mission-pack.json` and `/public/data/mars-optical.webp` → HTTP 200 with correct Content-Type. `/IMPORT_REAL_DATA.md` → 200.
6. `https://spcapps.openstacktool.com/does-not-exist.json` → **404**, not fake JSON from SPA shell, to confirm API/data errors do not look valid.
7. Inspect actual response headers: `Cache-Control` and `X-Content-Type-Options` should reflect the `dist/_headers` file. Cloudflare Workers Static Assets **does** support `_headers` when deployed in the asset directory.
8. Mouse, keyboard point placement, Science Targets collapse, synthetic ↔ measured switching, briefing export, NASA DONKI success and failure, and responsive layouts.

These instructions are not evidence that a deployment occurred. Mark each complete only after real production checks.

## Rollback and limits

If the new deployment breaks, use Workers **Deployments** history to promote/roll back to the previous working version, keeping the same Worker name and custom domain.

No new NASA coverage, raster import, source archive upload, hazard safety model, EVA certification or Mars radiation exposure calculation is implied by Phase 7. The generated measured mission pack and A* engine are unchanged.
