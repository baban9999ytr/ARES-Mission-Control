# ARES Phase 6 — Public Preview Readiness

**Audit date:** 14 November 2026 (Europe/Istanbul)  
**Decision:** **CONDITIONAL GO** for a reviewed, authorized Cloudflare Pages preview rollout. No deployment, DNS change, commit, push or merge was performed.

## 1. Git state and scope

- Repository: `baban9999ytr/ARES-Mission-Control`, local branch `feature/phase4-5-science-weather`.
- Starting and final HEAD: `32fed1550742772121917a3974c7cee2c4a49b5a`; no commit was created.
- Starting status: clean tracked tree, with pre-existing untracked `QA_FIELD_REPORT.md` and `docs/screenshots/qa-field/`. These were read or preserved, not modified.
- Final tracked edits: `index.html`, `planner.css`, `src/main.js`, `src/engine/map-grid.js`, `src/data/donki.js`, `tests/map-grid.test.js`, `tests/donki.test.js`, `tools/build.js`.
- New Phase 6 files: `.node-version`, `_headers`, this report, and eleven JPEG screenshots under `docs/screenshots/phase6/`. `dist/` is ignored build output.
- The measured mission pack, GeoTIFF sources, routing algorithms, synthetic dataset and scientific catalogs were not modified.

## 2. Four QA findings: reproduction and correction

| Finding | Before, reproduced in Chromium | Correction and observed result |
| --- | --- | --- |
| Keyboard map point placement | After Set start, Enter and Space on focused map left E 4,586,500 m / N 1,092,260 m unchanged. | Selecting Start or Destination focuses the map and shows a visible keyboard cell. Arrow keys move one cell, Enter/Space confirms, Escape cancels. Live feedback gives coordinates and rejects unavailable cells through the existing `isBlocked` check. Browser selection changed start to E 4,586,540 m after one right-arrow step; destination selection also passed. |
| Tablet comparison | At 768 × 1024, analysis began at y=1767 px. | Tablet grid places analysis in the map column immediately after the map. Measured browser rectangles: map bottom y=699, analysis top y=699; route metrics are visible in the first 1024 px. |
| DONKI failure wording | Three controlled HTTP 503 responses gave unavailable events but still displayed “Retrieved” with a timestamp. | The status formatter now says “Attempted” for full failure and “Partially retrieved” for partial success. Browser failure test showed zero substituted events, a valid route, and “Attempted 2026-11-14T19:36:59.899Z”. |
| Science Targets disclosure | The section had no collapse control. | Native `<details>` / `<summary>` opens and closes with pointer or keyboard, preserving catalog and evidence content. Browser open/close and target coverage checks passed. |

The map now documents pointer and keyboard actions. Touch-style taps at 390 × 844 and 320 × 700 still placed measured-grid points. The existing visual design and route algorithms remain in place.

## 3. Preview and deployment hardening

- The research banner identifies **ARES Mission Control · Research Preview** and displays a build ID. The static build writes `dist/build-info.json` using the commit SHA; a local edited build adds `-local`. Browser displayed `Build: 32fed1550742-local`, which identifies the base commit but not an exact uncommitted file snapshot. A clean GitHub build will show its deployed commit instead.
- `.node-version` selects Node 22. The project has no runtime or build package dependencies beyond Node itself.
- `dist/_headers` sets `Cache-Control: no-store` for all static responses, avoiding stale HTML/JS/JSON combinations at this small preview size. Cloudflare Pages processes this file on deployment; the local Python server does not, so the actual response header remains a deployment verification item. See [Cloudflare Pages headers documentation](https://developers.cloudflare.com/pages/configuration/headers/).
- The root HTML uses `<base href="/">` so asset and data references resolve correctly after Cloudflare's SPA fallback serves a deep path. Cloudflare documents this fallback when there is no top-level `404.html`; this build has none. The local browser simulation of `/planner/route?mode=demo` loaded the synthetic mode and its image, but actual Pages fallback remains to be checked after deployment. See [Cloudflare Pages serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/).
- No NASA API key is used or required. DONKI failure leaves the planner usable and displays unavailable state.

## 4. Executed tests and production-build verification

| Executed check | Result |
| --- | --- |
| `npm run check` under local Node 24.22.2 | **25 tests passed, 0 failed**, then static build completed. |
| `fnm exec --using 22 npm run check` under Node 22.23.4 | **25 tests passed, 0 failed**, then static build completed. |
| Added Node regression coverage | Keyboard cell movement/clamping with a valid measured route; all-failed DONKI status must say “Attempted” and must not say “Retrieved”. Existing routing, nodata-barrier, mode and catalog tests still pass. |
| Local production build via `python3 -m http.server 4175 --bind 127.0.0.1 --directory dist` | Browser tested the actual `dist/` output. `/`, `/index.html?mode=demo`, CSS, JS, mission JSON, both measured WebPs, synthetic thermal WebP, build info and sources HTML all returned HTTP 200 with appropriate content types. |
| `dist/` audit | 440 KB; required JS/CSS/JSON/WebP files present. Search found no `/home/`, `file://`, `.env`, secret token/key, or TIFF file in build output. The mission pack names public source URLs, which are provenance links, not runtime local file dependencies. |
| Local HTTPS smoke | A temporary self-signed Node HTTPS server served `dist/` with an SPA fallback and `no-store` header. Headless Chromium with the local certificate exception loaded `/planner/route?mode=demo` over HTTPS: HTTP 200, synthetic image loaded, no page errors, and JS response had `Cache-Control: no-store`. This checks application behavior under local TLS, not Cloudflare's certificate or its `_headers` processing. |
| `git diff --check` | Exit 0, no whitespace errors. |

### Chromium browser matrix

| Viewport / scenario | Executed result |
| --- | --- |
| Desktop 1440 × 900 | Measured CTX loaded; 1000 px optical image; thermal disabled; routes displayed; keyboard start and destination, mouse map selection, Three Forks outside-coverage evidence, Science Targets open/close, JSON export, and measured → demo → measured switching passed. A follow-up checked visible keyboard cursor, Enter point placement, native Enter/Space disclosure, zoom and reset. No page errors or failed local requests. Initial local load to measured UI took **1,420 ms** in the completed run; this is one local run, not a network performance guarantee. |
| Tablet 768 × 1024 | Comparison directly after map at y=699; no horizontal overflow; disclosure opened. |
| Touch-emulated 390 × 844 | No horizontal overflow; tap selected a valid measured start. |
| Touch-emulated 320 × 700 | No horizontal overflow; tap selected a valid measured start. |
| All DONKI endpoints forced to HTTP 503 | UI showed unavailable, “Attempted”, no fabricated events; route comparison remained available. |
| Real DONKI browser request | FLR, CME and SEP each returned HTTP **200**. UI reported **7 FLR, 23 CME, 0 SEP** for 7–14 November 2026 at `2026-11-14T19:37:32.728Z`; 12 rows rendered. This is a transient observation, not a promise of future availability or a Mars dose measurement. |
| Deep path fallback simulation | `/planner/route?mode=demo` served root HTML in both HTTP and local HTTPS test harnesses; the URL retained its query and loaded synthetic terrain. Actual Cloudflare Pages deep-link behavior was not tested. |
| Sources page | HTTP 200. |

A browser assertion in the first run incorrectly expected the synthetic demo image to share the CTX image's 1000 px width; it failed on the demo's actual 1600 px image. The assertion was corrected to require a loaded image, and the complete browser matrix then passed. This was a test expectation error, not an application failure.

**Evidence:** [before tablet](screenshots/phase6/before-tablet.jpg), [after tablet](screenshots/phase6/after-768.jpg), [science open on tablet](screenshots/phase6/after-tablet-science-open.jpg), [keyboard cursor](screenshots/phase6/after-keyboard-cursor.jpg), [desktop initial](screenshots/phase6/after-1440.jpg), [desktop interactions](screenshots/phase6/after-desktop-interactions.jpg), [390 px](screenshots/phase6/after-390.jpg), [320 px](screenshots/phase6/after-320.jpg), [before DONKI failure](screenshots/phase6/before-donki-failure.jpg), [after DONKI failure](screenshots/phase6/after-donki-failure.jpg), [live DONKI](screenshots/phase6/after-donki-live.jpg).

The browser was headless Chromium on this workstation. Touch was emulated; physical devices, screen readers, other browser engines, and the target deployed HTTPS origin were not tested.

## 5. Exact Cloudflare Pages setup for `spapps.openstacktool.com`

1. After review and explicit authorization, commit the Phase 6 files and push the reviewed release branch. The current working tree is not deployable through GitHub integration until that happens. Preserve the existing untracked QA artifacts as intended; do not include raw TIFFs, `.env` files, caches or temporary files.
2. In Cloudflare **Workers & Pages → Create → Pages → Connect to Git**, connect only `baban9999ytr/ARES-Mission-Control`. Set production branch to `feature/phase4-5-science-weather` if this branch is approved as the preview release branch. Set project/root directory to repository root, build command `npm run check`, and output directory `dist`. `.node-version` sets Node 22; `NODE_VERSION=22` can be set explicitly if account settings override it. No API secret or backend is required. See [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/) and [build image configuration](https://developers.cloudflare.com/pages/configuration/build-image/).
3. First verify the resulting `*.pages.dev` production deployment without changing the custom domain: build logs show 25 tests and `dist/`; inspect build ID, measured image/route, demo switch, science disclosure, weather unavailable and live states, keyboard placement, export, and `/planner/route?mode=demo`. Check real `Cache-Control: no-store` on HTML, JS, JSON and WebP responses. Test a fresh browser and a refresh with an older tab open.
4. Before attaching the target hostname, check its current DNS and Cloudflare Pages ownership in the correct account. Read-only DNS lookup during this audit returned Cloudflare A addresses `188.114.96.7` and `188.114.97.7`; this does **not** identify the current service or authorize replacement. Confirm no unrelated OpenStackTools project uses `spapps.openstacktool.com`.
5. With separate explicit approval for the hostname change, add `spapps.openstacktool.com` under the Pages project's **Custom domains**. Point the `spapps` CNAME to that project's `<project>.pages.dev` target or allow Cloudflare's dashboard to manage it, according to the zone setup. Confirm the domain is proxied where required, certificate is active, HTTPS loads without mixed content, and the served build ID matches the approved commit. See [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).
6. Run the same browser smoke matrix on `https://spapps.openstacktool.com` and verify `/`, `/sources`, `/?mode=demo`, and `/planner/route?mode=demo`. Confirm HTTPS, content types, cache headers, DONKI failure behavior, and no console errors. Record the deployed SHA and Cloudflare deployment ID.

Do not assume `main` contains this work. A Pages Git integration can deploy the designated feature branch as its production branch; attach the target domain only after the deployed branch and current hostname mapping are verified.

### Rollback

Retain the previous successful production deployment ID. If the preview fails after activation, use **Pages → Deployments → previous successful production deployment → Rollback to this deployment** and recheck the build ID and HTTPS route. Cloudflare states preview deployments cannot be rollback targets. If the hostname was newly attached and its previous mapping must be restored, first record that mapping and reverse only the approved DNS/custom-domain change through the responsible account. See [Cloudflare Pages rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/).

## 6. Scientific and technical limits; release decision

The 80 × 60 route grid samples measured CTX DEM elevations at 40 m cells over a 3.2 × 2.4 km crop. Route costs use those elevations, but the terrain preference weight is illustrative and does not certify traversability or EVA safety. Rocks, sand, illumination, communications, suit endurance and local radiation dose are not modeled. All bundled crop DEM cells are valid; nodata rejection is covered by controlled tests, not a naturally missing cell in this crop. Named Jezero science targets remain outside this footprint or lack a verified single point, and cannot be routed to here. Measured thermal remains **Unavailable**. DONKI reports observed solar events, not dose at Jezero.

**CONDITIONAL GO:** the local code and production build are ready for review and an explicit authorization to commit/push and stage a Pages preview. Public-domain activation is blocked until the reviewed commit is deployed, the target hostname's existing ownership/mapping is confirmed, and live HTTPS, cache and deep-link checks pass on Cloudflare Pages. No production service or DNS record was changed in this phase.
