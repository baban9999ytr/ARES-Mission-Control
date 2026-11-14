# ARES external AI review handoff

Audit date: 2026-11-14. ARES v0.2 is a static mission-planning prototype with a responsive UI, three synthetic demonstration layers, an 8-direction A* route planner, demo hazards and waypoints, and an optional measured mission-pack loader. The existing app, routing logic, and history were preserved. No measured pack has been installed in `public/data/`.

## Data and Git boundary

Central and southwest Jezero DEM/DRG pairs are locally available and pass CRS/bounds checks. A separate USGS CTX Jezero DTM/orthomosaic pair is in the local repository data tree. Northern Fan DEM/DRG is missing. Several exact-name central downloads are empty, XML, or partial; the complete central DEM has `(1)` in its filename. See `DATA_INVENTORY.md` and `data/manifests/raster-audit.json` for file sizes, hashes, georeferencing, nodata, sampled ranges, and preview details. Raw TIFFs, `.part` files, and the local `ARES-DATA/` tree are ignored by Git. The existing synthetic WebP images and preview are intentionally tracked. No tracked file is a raw GeoTIFF or large scientific raster. No tracked file was removed; no commit or push was made.

## Workflow and verification

`tools/inspect_rasters.py` reads local TIFFs, hashes them in chunks, records metadata, samples a bounded overview, and optionally writes small transparent-nodata PNGs. `tools/validate_data.py` checks science-point structure and pair geometry. `tools/import_mars_rasters.py` remains the production-facing offline importer: given a reviewed DEM/optical pair, projected bounds and source URLs, it resamples to a route grid and writes a mission pack plus WebP layers. Its fixture smoke test passed. Preview PNGs are non-operational grayscale visualizations with independent 2nd–98th percentile scaling. These overviews are not elevation maps with a shared legend.

Exact checks run from repository root:

```sh
npm run check
# 9 tests passed; static build succeeded.
.venv/bin/python tools/test_raster_import.py
# Raster importer smoke test passed.
python tools/validate_data.py --output data/manifests/validation.json
# Exit 0; central, southwest and CTX geometry-compatible; Northern Fan missing.
```

The ignored `.venv` contains Rasterio 1.5.2, NumPy, and Pillow. To reproduce on another machine, run `python -m venv .venv`, `.venv/bin/python -m pip install rasterio numpy pillow`, then `.venv/bin/python tools/inspect_rasters.py --file <authorized-raster> --output <report.json> --preview-dir <preview-dir>`. Avoid publishing absolute local paths. The manifest includes source-label mappings in `DATA_INVENTORY.md`.

## What still needs review

Source metadata, high-resolution licenses, datum and vertical accuracy, full-resolution raster integrity, pixel-level registration, and science-point coordinate/source claims are unverified. `jezero-science-points.json` is structurally valid but its self-described “verified” coordinates were not independently corroborated. Three science points have intentionally null coordinates. No thermal science layer or Northern Fan raster is available. The app has not been run against these real rasters, and no operational route claims are warranted.

Next implementation steps are in `DATA_INTEGRATION_PLAN.md`. Review these files first: `README.md`, `IMPORT_REAL_DATA.md`, `src/data/mission-pack.js`, `src/engine/routing.js`, `tools/import_mars_rasters.py`, `tools/inspect_rasters.py`, `tools/validate_data.py`, `data/manifests/raster-audit.json`, `data/manifests/validation.json`, `jezero-science-points.json`, then the reports in `docs/`.

## Compact repository tree

```text
ARES-MISSION-CONTROL/
├── index.html, styles.css, sources.html
├── src/{main.js,data/{demo-terrain.json,mission-pack.js},engine/routing.js}
├── public/mars-demo-{terrain,elevation,thermal}.webp
├── tools/{import_mars_rasters.py,inspect_rasters.py,validate_data.py,...}
├── tests/{routing.test.js,data-pack.test.js}
├── data/manifests/{raster-audit.json,validation.json}
├── docs/{AI_REVIEW_HANDOFF.md,DATA_INVENTORY.md,DATA_VALIDATION_REPORT.md,
│         DATA_INTEGRATION_PLAN.md,DATA_SOURCES.md,previews/*.png}
├── jezero-science-points.json (untracked; review before adding)
└── ARES-DATA/ (ignored local source tree)
```
