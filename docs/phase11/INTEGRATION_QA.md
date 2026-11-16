# Phase 11 integration and QA — 2026-11-15

## Reconciliation

Integration starts from `origin/main` commit `600b8a1`, which already contains Phase 10 route explanations and an independently developed measured CTX elevation profile. The explainable-route commit `181a4fd` was selectively reconciled: the existing main profile renderer, profile tests and GitHub release workflow were retained; coefficient sensitivity, explicit trade-off facts, printable briefing, additive JSON assumption metadata and their tests were incorporated. No second profile control was added. The source branch's unrelated `docs/a` and local document edit remain in the original worktree.

## Science Mission Mode

The existing custom mission schema now accepts optional `scienceMission` and stop activity metadata while retaining version 1 and the same import/export kind. A science plan validates `base → one or more activity stops → base`. Base movement updates the return endpoint; reordering and removal protect the endpoints. Each outbound and return leg is run independently through the existing A* engine. The visible mission summary lets a user highlight each leg on the map. The science demo uses SC-01's measured-grid endpoints, adds a separately calculated return, and restores the prior mission and map state on exit. Its stop is explicitly illustrative, not a named verified science target.

## Executed release checks

| Command/check                                                                                | Result                                                                                                                                                                |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                                              | 79 Node tests passed; static build completed (44 files, 1,482,159 bytes before integration commit)                                                                    |
| `npm run test:browser`                                                                       | 18 Chromium Playwright tests passed across desktop, tablet and mobile cases, including EN/TR, science return, profile, sensitivity, print report, and JSON round trip |
| `node tools/generate_mission_results.mjs --check`                                            | All 30 measured missions verified                                                                                                                                     |
| `node tools/audit_ctx_routes.mjs`                                                            | A* cost and route metrics agreed with independent checks; controlled DEM change and no-data barrier behaved as expected                                               |
| `.venv/bin/python tools/test_raster_import.py` (using original worktree virtual environment) | Registered output, provenance and internal no-data barrier passed                                                                                                     |
| `npx --yes wrangler@4 deploy --dry-run`                                                      | Passed; assets readable, no bindings                                                                                                                                  |
| `git diff --check`                                                                           | Passed                                                                                                                                                                |

No measured raster, route pack or mission catalog data was modified. The static build gate rejects raw rasters, sensitive files and oversized assets.

## Scientific and release limits

The CTX DEM grid samples height at 40 m spacing. The terrain coefficient and the 20° denominator are illustrative model choices, not safety thresholds. The app does not evaluate sub-grid obstacles, local weather, radiation dose, communications, suit limits or EVA feasibility. Named target coverage and coordinate uncertainty are documented in [SCIENCE_TARGET_COVERAGE.md](SCIENCE_TARGET_COVERAGE.md); no named target was routed. Browser checks used Chromium and emulated touch; physical touch, screen-reader review and other browsers remain unverified. Remote merge, production deployment and live build verification are separate release gates.
