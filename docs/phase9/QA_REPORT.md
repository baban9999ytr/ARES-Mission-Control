# Phase 9 implementation and QA — 2026-11-15

## Scope delivered

- Measured CTX 30 × 22.5 km optical/elevation overview with pan, zoom, projected-coordinate inspection, and the original route-tested 3.2 × 2.4 km crop visibly outlined. The overview is context-only; there is no fabricated or unvalidated wider-area routing.
- Both A* route alternatives render together. The selected route is a full-opacity 5 px solid line above the alternative. The alternative keeps its identity color at 38% opacity, 7 px, dashed, with a light halo. Shared grid edges are counted and explained. Route lines and comparison buttons select the active alternative.
- Cached per-segment metrics: orthogonal/diagonal length, endpoint DEM heights and mean, signed change, absolute step slope, cumulative distance, and multi-stop mission leg. Hover inspection, click/tap pinning, and a keyboard-selectable segment list are present. A hovered panel clears when the pointer leaves; pinned inspection remains until another selection or route recalculation.
- EN/TR switching without reload, browser-language first-use detection, localStorage preference, Turkish number/date display, main planner panels, advanced/research/source sections, accessibility labels, status messages, all 30 mission titles/objectives/research questions, and science catalog descriptions/categories/targets. Source organization names, product IDs, raw credits, URLs, imported user-authored text, and machine-readable JSON remain in their source language.
- Five measured-grid illustrative planning presets, each with EN/TR names, limitations, coordinates, map marker, destination selection and Add Stop control. Their names do not assert a real base or discovered mineral deposit.
- Expanded existing Sources page with input organization, scientific role, data type, native resolution, measured coverage, projection, processing diagram, attribution, prototype disclaimer and source links. `DATA_SOURCES.md` and `GEOGRAPHY_ARCHITECTURE.md` record the processing and future region gates.

## Scientific and geographic validation

The local CTX orthomosaic and DEM share ESRI:103885 Mars equirectangular metres. Their native samples are 6 and 20 m/pixel. The raw pair spans approximately 31.9 × 30.2 km. `tools/build_ctx_overview.py` rejects CRS disagreement, out-of-bounds selections and any sampled nodata in the overview. `public/data/ctx-overview.json` records the projected extent, source URLs and 1,600 × 1,200 display sampling. Its WebP products total about 0.52 MB. The original measured route grid remains the sole eligible route region; no route model or sample grid changed. The local higher-resolution Jezero pairs use a different Mars CRS and several gigabytes of storage, so they were left separate. Wider routing requires grid validation and a priority-queue/tiled algorithm rather than applying the current Set-scanning A* to a much larger grid.

## Calculation method

For adjacent grid-cell centres, horizontal length is `40 × hypot(Δx, Δy)` metres: 40 m orthogonal and 56.57 m diagonal. Segment height change is `end − start`; displayed endpoint mean is `(start + end) / 2`; approximate sampled step slope is `atan(|change| / length)` in degrees. Cumulative distance sums each step. Multi-stop leg boundaries come from the lengths of independently planned A* legs. The UI avoids claiming segment-wide elevation sampling or EVA safety.

## Automated checks and performance

`npm run check` passed: 57/57 Node tests and static build. The build has 36 files and 1,079,508 bytes. New tests verify segment geometry, multi-mode overlap counting, preset routeability/claims, Turkish mission copy, overview extent/CRS/nodata metadata and WebP presence. A local Node benchmark planned all 30 mission scenarios in 87.07 ms total, 2.18 ms median and 20.58 ms maximum on this machine. These are local timings, not a browser or mobile performance guarantee. Two decoded 1,600 × 1,200 RGBA overview images require about 15.4 MB in browser memory combined.

## Browser QA

Using Chromium in the Codex in-app browser at a 1,280 × 720 desktop viewport and a 390 × 844 responsive viewport:

- Measured crop and overview rendered with matching outline and usable pan/zoom controls.
- Both route paths existed at once; computed styles showed selected opacity 1 and secondary opacity 0.38. Clicking an alternate route segment selected its route and showed computed values.
- EX-08 showed two shared segments and the overlap explanation. CM-01 exposed segment options labeled by mission leg. An illustrative mineral preset was added to an editable mission with measured coordinates.
- EN/TR changed without navigation and persisted after reload and across the Sources page. The 30 authored mission entries and research catalog displayed Turkish copy. Optical/elevation visibility toggles still worked in both directions.
- At 390 px, the preset list starts collapsed to keep the map reachable. A pointer click selected the alternate route and revealed Turkish metrics. The browser viewport was resized; a physical touch device was not available. No browser console errors were observed on the planner or Sources page.

Screenshots: `desktop-overview.jpg`, `desktop-route-inspector.jpg`, `mobile-planner.jpg`, `mobile-map.jpg`, `mobile-segment.jpg`, `sources-tr.jpg` in this directory.

## Remaining work and recommendation

**CONDITIONAL GO for review.** The six core goals are represented, with broader _exploration_ but not broader _routing_. Expanded routing requires validated multi-region DEM grids, route engine scaling and geographic cross-region design. The optional elevation profile, coordinate-entry jump and presentation mode were deferred to protect the primary workflow. A future localization pass should replace the remaining inline dynamic translation pairs with central keyed messages and audit rare malformed-data/third-party error paths. Production deployment and merging remain pending review.
