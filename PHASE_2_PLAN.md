# v0.2 milestone

The optional real-data import pipeline and runtime loader are implemented, but no verified NASA/USGS raster has been bundled yet. See [IMPORT_REAL_DATA.md](IMPORT_REAL_DATA.md) for the actual import procedure.

# ARES — remaining hackathon milestones

## Immediate milestone: validate the demo

- Open at 1440×900 and a narrow browser width. Confirm all panels, controls and labels are readable.
- Select every science waypoint on the map and in the sidebar.
- Compare shortest vs terrain-preferred route: distance and maximum segment slope must update.
- Toggle synthetic hazards: route should recompute and change when relevant.
- Switch all three layers; all remain aligned with the same underlying artificial grid.
- Enter and exit EVA mode. Explain that heading is geometric demo output and position is not live.
- Confirm network-off behavior; remote thumbnail/fonts may be absent but the application must still work.

## Data priority — next scientific upgrade

**Goal:** Replace both optical illustration and synthetic elevation with **aligned, real data for one small Jezero subregion**, not the whole planet. Start from USGS Jezero CTX products, then add a matching thermal source as contextual regional data.

Friend 1: collect source metadata, choose a 1–3 km target area, document crop bounds, coordinate system, acquisition dates and original URLs. Do not try to download a 2+ GB mosaic without an intentional crop/export plan.

Product lead: implement ingestion Python (rasterio/GDAL) to align DEM and image. Export a cropped image + height grid + metadata JSON. Feed the grid into the existing A* engine; do not tune the algorithm until the actual raster is inspected.

Friend 2: validate source claims, record the demo, create before/after comparison, and prepare a 90-second scenario.

## Codex phase-two prompt

> Work in this existing ARES repository. Preserve the current visual design and working controls. Replace the synthetic map and demo height field with a mutually georeferenced, cropped NASA/USGS Jezero orthomosaic and DEM. Create a fully documented data-ingestion script that preserves CRS, bounding box, actual cell spacing, vertical units and no-data masks; do not silently assume Earth Web Mercator for Mars data. First identify and verify valid downloads and small geographically matching crops. Do not invent telemetry or rover image locations. Keep the synthetic mode as an explicit fallback. Tests must confirm route alignment, meter-scale calculation and blocked/no-data cell handling. Do not redesign the UI or add unrelated features.

## Final judging story

1. Why astronauts need terrain-aware science-route preparation.
2. Mission planner selects Jezero science waypoint.
3. Real NASA/USGS layers are toggled **only once actually integrated**.
4. A* route comparison shows shortest vs lower-cost terrain path and hazard avoidance.
5. EVA screen summarizes the loaded route as a UI concept.
6. Clearly state dataset limitations, uncertainty and non-operational status.

Cut if time-constrained: global 3D globe, AI chat, accounts, backend database, real-time space weather forecasts, multiple landing sites.
