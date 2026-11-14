# ARES / Astronaut Route & Exploration System

![ARES Mission Control screenshot](preview.png)

**NASA Space Apps Challenge 2026** — [Interplanetary Survival Guide: Martian Map](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/)

ARES is a cinematic, interactive **Mars surface mission-planning prototype**. This prototype demonstrates the interaction model, UI, and a working explainable A* routing engine without pretending to have integrated flight-quality geospatial datasets.

> **Prototype transparency:** The default map uses a measured Jezero CTX optical mosaic and DEM crop. Routes use sampled DEM heights and projected metre spacing. Waypoints are illustrative; no verified hazard or EVA safety assessment is provided. The synthetic demo remains available from the dataset switch.

## Quick start (no dependency installation)

Requirements: Node.js 22 or newer.

```bash
npm run dev
```

Open **http://localhost:4173** in a current browser.

```bash
npm run test   # A* planner tests
npm run build  # Copy static deployable site to dist/
npm run check  # both
```

You can publish the contents of `dist/` on any static host. This starter intentionally has **zero production or build dependencies** so the team can demo it quickly without spending time on package setup.

## Current features (v0.2)

- A production-inspired 1440px Mission Control interface with responsive layout.
- Three visibly distinct, locally bundled, aligned demo map layers: optical style, elevation visualization, thermal style.
- Interactive science waypoint selection via sidebar and surface-map markers.
- 8-direction A* route planner. Terrain-preferred routing weighs synthetic slope; shortest-path mode minimizes distance while avoiding enabled synthetic hazard zones.
- Dynamic route distances, segment maximum slope and accumulated ascent based on the bundled demo height field.
- Toggle demonstration hazard zones and optional route visibility.
- Mission telemetry UI, zoom controls, fullscreen attempt, simplified EVA mode.
- NASA science-resource link and provenance notes, with explicit labeling of all simulated content.
- 9 algorithm / pack-validation unit tests and an offline raster importer smoke test.
- Export a route briefing as JSON, including route-cell coordinates, metrics, and clear research-prototype warnings.
- Bundled measured CTX pack with projected metre coordinates, source links, provenance card, and hatching for no-data DEM cells.
- Python pipeline for co-registered Mars-projected optical GeoTIFFs and DEM; missing data never becomes traversable ground.
- The original synthetic demo remains available if scientific data is absent or malformed.

## Project structure

```text
ARES-Mission-Control/
├── index.html                     # Mission Control interface
├── sources.html                   # Scientific reference / data honesty page
├── styles.css                     # Main responsive design system
├── public/
│   ├── mars-demo-terrain.webp     # Synthetic, locally rendered surface
│   ├── mars-demo-elevation.webp   # Matching synthetic elevation visualization
│   ├── mars-demo-thermal.webp     # Matching synthetic thermal visualization
│   └── data/                     # Bundled measured CTX mission pack and map layers
├── src/
│   ├── main.js                    # UI state, event handlers, SVG visualization
│   ├── data/demo-terrain.json     # Height grid, synthetic hazard locations
│   ├── data/mission-pack.js      # Validates projected scientific data pack
│   └── engine/routing.js          # A*, slope, route scoring
├── tests/routing.test.js
├── tests/data-pack.test.js
├── tools/
│   ├── dev-server.js              # Zero-dependency Node HTTP dev server
│   ├── build.js                   # Static build to dist/
│   ├── generate_demo_terrain.py   # Reproducible synthetic data generator
│   ├── import_mars_rasters.py    # Offline importer for projected Mars GeoTIFFs
│   └── test_raster_import.py     # Fixture-driven importer smoke test
├── IMPORT_REAL_DATA.md           # Detailed import steps and limitations
├── DATA_SOURCES.md
└── PHASE_2_PLAN.md
```

## Measured CTX demonstration

The default pack uses the local `JEZ_ctx_B_soc_008` pair from the [USGS Astrogeology Mars 2020 CTX archive](https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/index.html). The optical source is 6 m/pixel; the DEM is 20 m/pixel. Both are in the Equirectangular Mars 2000 Sphere IAU projected CRS in metres. The overlapping footprint is E 4,573,663.250853–4,605,583.250853 m and N 1,079,453.140188–1,109,693.140188 m. Both source masks are fully valid in the selected crop.

The selected 4:3 crop is E 4,586,000–4,589,200 m and N 1,091,000–1,093,400 m. The router samples the DEM on an 80 × 60 grid of 40 m cells; the two display layers share these exact bounds. The source DEM metadata states elevations in metres relative to the Mars 2020 IAU sphere of radius 3,396,190 m. A cell without a DEM elevation is impassable. The source metadata reports 9.6 m average displacement between individual CTX images and 3.8 m vertical registration between CTX DTMs; those figures are mosaic metadata, not a route-level error estimate.

Use **Switch to synthetic demo** in the layer sidebar, or open `?mode=demo`. The synthetic map, hazards, and routes remain separate from measured mode. The importer command and source URLs are recorded in [IMPORT_REAL_DATA.md](IMPORT_REAL_DATA.md).

### Scientific limits

This is a 40 m routing grid sampled from a 20 m DEM. Slopes are endpoint differences over grid steps, not local ground slope or traversability measurements. Terrain-preferred costs use an illustrative slope weight; neither route mode checks rocks, sand, cliffs, illumination, communications, suit limits, or mission constraints. Waypoints and the HAB marker are placed for demonstration and have no verified field coordinates. The cropped WebP layers are contrast-stretched visualizations; numerical elevation comes from the DEM array in the pack. No thermal raster or validated hazard layer is included.

## Scientific upgrade path


The next step is to **select an exact Jezero footprint with matching reference data**, then replace simulated data *as a coordinated dataset*:

1. Download and crop a USGS/NASA-referenced Jezero orthomosaic **and** co-registered DEM. Record CRS, bounding box, pixel resolution, vertical datum, and attribution.
2. Reproject and resample both to the same exact local grid. Preserve `nodata` masks. Render tiles/images and export a compact elevation array with real units.
3. Derive physically meaningful slope from **horizontal meter spacing** and elevation, flag unknown regions, and exclude them from routing pending review.
4. Ground sample waypoints in actual mapped geology. Only mark hazards when supported by imagery or a dataset, plus resolution and confidence.
5. Add thermal information at its actual resolution/time coverage. If data is global or regional, do not imply it has meter-scale accuracy.
6. Show source ID, capture date, units and uncertainty for *every layer*.
7. Evaluate route distance and obstacles against manually inspected examples. Obtain a domain expert review before suggesting any operational safety use.

See [DATA_SOURCES.md](DATA_SOURCES.md) for official data links and [PHASE_2_PLAN.md](PHASE_2_PLAN.md) for team tasks.

## Why no React yet?

For the first hackathon milestone we prioritized a **runnable, dependency-free, easy-to-present starter**. The UI code is intentionally modular at the routing and data layers. Moving the view to React/TypeScript and integrating Leaflet is the next step if time permits, not a prerequisite for demonstrating a complete route workflow.

## Design system

Deep space navy `#070d14` · oxidized Mars orange `#e9946a` · route cyan `#71e3d9` · warning amber.

Space Grotesk and IBM Plex Mono are optional remotely loaded fonts; system fallbacks preserve offline usability. Mission maps and tests work without network access. The scientific reference thumbnail, if available, is fetched from NASA's website; the synthetic main map is always local.

## Credits / integrity

- Built independently for NASA Space Apps Challenge 2026; **NASA does not endorse this project**.
- The Jezero scientific scenario was inspired by official NASA Perseverance mission materials.
- Remote NASA images and linked resource materials retain their respective NASA/JPL credits.
- Terrain illustrations are synthetic and generated specifically for the starter. No NASA image has been altered or falsely positioned as georeferenced imagery.

**Safety:** This is a hackathon research and interaction prototype, not a life-support, spaceflight, or EVA navigation product.
