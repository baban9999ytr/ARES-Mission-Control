# ARES Phase 9.1 engineering and QA report — 2026-11-15

## Delivered

- Five permanent, illustrative Jezero landmarks in an independent SVG layer, with fixed ESRI:103885 metre coordinates, bilingual names and descriptions, popup, projected coordinates, and Add Stop action. The layer is present during mission editing, authored missions, route inspection, raster-layer changes and regional overview. Show Landmarks defaults on, persists in localStorage and hides only the landmarks. Three explicitly synthetic equivalents appear in demo mode without a false Mars georeference.
- Fixed dual-route hierarchy: shortest is orange, dashed, 48% opacity and drawn first; terrain-preferred is teal, solid, 100% opacity and drawn above it. Inspection selection changes numerical data but never these route styles. Explicit per-route visibility controls remain separate. Identical geometry keeps both path elements, with the shorter stroke visible around the terrain stroke and a shared-edge count.
- An exact 30-mission audit in `docs/phase9/PHASE_9_1_ROUTE_AUDIT.md`: 9 identical geometries, 21 different, 13 meeting a descriptive difference threshold (at least 2° lower maximum sampled step slope or 10 m lower ascent). SC-01 is a recommended comparison example, with 166 m additional length, 15.1° lower maximum sampled step slope and about 46 m lower ascent. No slope weight was changed; old and heap routing selected the same cells and metrics for every catalog leg and mode.
- Selectable 6.4 × 4.8 km measured CTX routing sector on a 160 × 120 grid at 40 m spacing. Original 3.2 × 2.4 km crop stays available and remains the catalog's authored coordinate frame. Selecting a catalog mission from the larger sector returns to the crop. Custom missions must be saved or exited before changing regions. The larger 30 × 22.5 km map remains context-only outside the selected routing region.

## Source validation

Both local CTX inputs use ESRI:103885 Mars projected metres, with 6 m optical and 20 m DEM source sampling. The expanded sector spans E 4,584,400–4,590,800 m and N 1,089,800–1,094,600 m, fully inside both source bounds. `tools/audit_expanded_rasters.py` independently reprojected both GeoTIFFs: 19,200/19,200 optical and DEM cells valid, no nodata cells, and maximum stored DEM discrepancy 0.0004883 m from float32 sampling/rounding. The pack retains the original DEM vertical-reference statement. Raster images, DEM samples and map SVG use the same projected bounds; landmark cells are derived from projected coordinates, never reused as raw pixels across regions. Expanded WebPs total about 0.14 MB; the numerical pack is about 0.19 MB. Raw 46 MB GeoTIFFs remain outside the static build.

## Algorithm and performance

The A* open set now uses a deterministic binary min-heap with stale-priority skipping. The eight-neighbour geometry, diagonal corner blocking, nodata rejection, Euclidean admissible heuristic, slope cost and route reconstruction remain the same. Terrain cost remains `length × (1 + 4 × (slope / 20°)²)`, an illustrative model. In one local regression run, the old Set scan and heap selected identical paths and metrics for every authored leg and mode. Old/new times were 43.1/26.4 ms across all 30 missions, and 24.4/17.5 ms for a representative expanded-sector pair. The reproducible audit script records a later local 30-mission total and ten-run expanded median. These Node timings are not browser or mobile guarantees. Full 30 × 22.5 km routing still needs worker execution, region/tile loading, broader valid-data checks and memory/performance validation.

## Automated checks

`npm run check`: 62/62 Node tests passed and the static build completed. New tests cover expanded pack geometry, provenance, validity and assets; identical landmark projected positions in both route regions and the overview; expanded route validity and nodata rejection; comparison facts; and both path elements for identical routes. `tools/audit_expanded_rasters.py` passed its independent source check.

## Interactive browser QA

Chromium IAB was checked at 1440 × 900, 1280 × 720, 390 × 844 and 320 × 720. At each size the map remained usable; a narrow-header overflow at 320 px was fixed. Interactive checks confirmed:

- Five landmarks on initial load, while creating and adding a custom stop, in SC-02, on the expanded sector, and on the regional overview. The location popup showed its real projected coordinate; Add Stop appended a stop while the landmark remained.
- Turning landmarks off left three custom mission markers and both route paths in place; the preference survived reload. Optical only, elevation only and combined rendering each retained five landmarks.
- Shortest remained 48% orange/dashed and terrain remained 100% teal/solid after selecting Shortest and clicking its line. SC-02 rendered two identical path elements, reported 55 shared segments (100%), and explained the matching objectives.
- The expanded selector loaded its separate raster and 19,200-cell DEM pack, and routes appeared there. SC-01 opened from the expanded sector by returning to the original catalog crop. Changing regions during an unsaved custom mission was blocked with a save-or-exit message.
- English and Turkish region labels, comparison text and updated Sources coverage rendered correctly. Synthetic demo displayed only synthetic landmark equivalents. No planner or Sources console errors were observed during these checks.

The interactive mobile checks used responsive Chromium viewports and pointer input; a physical touch device was unavailable. The IAB verified interactions. Its screenshot API did not provide a file-writing path, so local headless Chromium captured the committed desktop and mobile JPEG artifacts after the same UI passed interactive QA. `view_image` inspection found no material clipping or unreadable primary controls. The prior Phase 9 images in `docs/phase9/` are the before reference.

## Decision and limits

**CONDITIONAL GO for code review.** The requested corrective behavior and a fourfold increase in routeable area are implemented and validated. The remaining 30 × 22.5 km context footprint is not routeable; native physical touch, low-end mobile performance and cross-region routing remain unverified. No merge or production deployment is included.
