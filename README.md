# ARES Mission Planner

![ARES CTX planner at desktop width](docs/screenshots/planner-desktop.png)

ARES is a research prototype for comparing routes on a measured Jezero CTX optical mosaic and sampled digital elevation model. It uses a dependency-free web UI and an eight-direction A* routing engine. It is **not** an EVA safety or field-traversability system.

## Deployment and large datasets

ARES is ready for a Cloudflare Pages *research preview*. The current web app uses small processed CTX WebP/JSON assets and does **not** require uploading the original multi-gigabyte TIFFs. Keep raw GeoTIFFs outside Git; optionally back them up in a **private R2 bucket**. For future high-resolution areas, derive bounded/validated mission packs and, only once a tile loader exists, serve versioned browser-ready tiles from public R2.

See **[Pages + R2 deployment and data architecture](docs/PAGES_R2_DATA_ARCHITECTURE.md)** for the `spapps.openstacktool.com` release checklist, staging strategy, Cloudflare size limits, data integrity gates, optional R2 setup, and rollback instructions. `npm run build` now rejects oversize or accidental raw/sensitive artifacts in `dist/`.

**Note:** This repository does not automatically provision Pages, R2 or DNS. Live deployment must be authorized and separately smoke-tested.

## Run

Requires Node.js 22 or newer.

```bash
npm run dev      # http://localhost:4173
npm run test     # routing, data, map geometry and mode tests
npm run build    # static site in dist/
npm run check    # tests and build
```

## Plan a route

1. The measured CTX pack loads by default. Choose **Optical** or **Elevation** for the same registered crop.
2. Select **Set start** or **Set destination**, then click the map. Each point snaps to a routing cell; unknown DEM cells and enabled demo hazards are rejected.
3. Compare **Shortest** and **Terrain preferred** in the right panel. The selected column determines which line is emphasized. Drag to pan; use the zoom controls to inspect the map.
4. Open **Details** for source URLs, CRS, bounds, vertical reference, resolution and coverage. Export the route briefing as JSON if needed.

The **Science Targets** explorer keeps a Jezero catalog and a global Mars catalog separate. Its submitted Jezero coordinates currently lie outside the measured crop, or have no single point, so none becomes a named route preset. The collapsed **Space Weather** drawer makes a read-only NASA CCMC DONKI request for observed solar events when opened. It reports UTC event and retrieval times and displays an unavailable state if the request fails. These events do not measure local Mars radiation or establish EVA safety.

Use **Switch to synthetic demo** or `?mode=demo` for the separate illustrative dataset. The synthetic mode includes illustrative hazards and thermal coloring. Measured CTX mode has **no** thermal or verified hazard layer.

## Measured data

The bundled `JEZ_ctx_B_soc_008` pair comes from the [USGS Astrogeology Mars 2020 CTX archive](https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/index.html). The source optical mosaic is 6 m/pixel and the DEM is 20 m/pixel, both in the Mars Equirectangular IAU sphere projected CRS. The selected crop covers E 4,586,000–4,589,200 m and N 1,091,000–1,093,400 m. Routing uses 80 × 60 cells at 40 m spacing. The two WebP display layers share the crop bounds; numerical heights come from the DEM array in `public/data/mission-pack.json`.

The source DEM metadata states elevation units of metres relative to the Mars 2020 IAU sphere of radius 3,396,190 m. The route metric called **maximum step slope** is the angle between adjacent sampled grid heights, not the maximum physical slope within each cell. Terrain-preferred cost uses an illustrative slope weighting. Neither mode evaluates rocks, sand, cliffs, lighting, communications, suit limits, or mission constraints. User-selected points are grid locations, not verified science sites; the three presets are illustrative examples. A shorter or lower-slope route is not certified safe.

See [REALITY_CHECK.md](docs/REALITY_CHECK.md) for independent data and algorithm checks, [UI_REFINEMENT_REPORT.md](docs/UI_REFINEMENT_REPORT.md) for UI verification, and [IMPORT_REAL_DATA.md](IMPORT_REAL_DATA.md) for the importer command.

Phase 4+5 evidence and presentation: [intake audit](docs/PHASE4_5_INTAKE_AUDIT.md), [DONKI report](docs/PHASE4_SOLAR_INTEGRATION_REPORT.md), [science/mission report](docs/PHASE5_SCIENCE_INTEGRATION_REPORT.md), [QA report](docs/PHASE5_QA_REPORT.md), and [jury runbook](docs/FINAL_DEMO_RUNBOOK.md). The submitted research ZIP is intake material, not a verified implementation report.

## Layout and code

- `index.html`, `planner.css`, `src/main.js`: planner UI and interactions
- `src/engine/routing.js`: A* and route metrics
- `src/engine/map-grid.js`: click-to-grid conversion under zoom and pan
- `src/data/mission-pack.js`, `src/data/mission-mode.js`: validation and dataset selection
- `src/data/science-catalog.js`, `src/data/donki.js`, `src/data/briefing.js`: catalog coverage, observed solar events and export serialization
- `public/data/`: measured pack and aligned display layers
- `src/data/demo-terrain.json`, `public/mars-demo-*.webp`: separate synthetic demo
- `tools/import_mars_rasters.py`: offline GeoTIFF import
- `sources.html`, `styles.css`: scientific sources page

Built independently for NASA Space Apps Challenge 2026. NASA does not endorse this project.
