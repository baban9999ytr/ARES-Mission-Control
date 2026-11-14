# ARES live demo runbook — 14 November 2026

## Before the jury

1. Run `npm run check` and record the current output. Run `.venv/bin/python tools/audit_ctx_rasters.py` and `node tools/audit_ctx_routes.mjs` if the source TIFFs are present.
2. Run `npm run dev`; open `http://localhost:4173/` without `?mode=demo`. Confirm the **Measured CTX** badge, 6 m / 20 m / 40 m provenance, optical image and disabled **Thermal — Unavailable** control.
3. Check the network before promising current DONKI events. The panel must show its own retrieval time. If the request fails, demonstrate the unavailable state and explain that no events are substituted.

## Three-minute click path

1. Show the actual CTX optical crop, projected Mars coordinates and measured scale bar. Open the dataset details if asked for the original source URLs and CRS.
2. Select **Set start**, click a valid map cell; select **Set destination**, click another. Read the recalculated projected E/N points and route metrics.
3. Choose **Shortest** then **Terrain preferred** in the comparison panel. Explain that the second mode uses an *illustrative slope cost*, not a certified safety limit. Show the route legend and the measured elevation layer.
4. Open **Science Targets**, select Three Forks and show **Outside current map coverage**. Select Jezero Delta to show **Location not available as a verified single point**. Explain that existing example waypoints are illustrative grid locations.
5. Expand **Space Weather**. Show observed event types, UTC event time, retrieval time, source-record links and the research disclaimer. Say explicitly that these records do not yield a Jezero surface radiation dose. If unavailable, read the error state instead.
6. If time permits, open `docs/REALITY_CHECK.md` and describe the independent Dijkstra, changed-height and nodata-barrier experiments. Do not suggest an out-of-footprint science target has a route.

## Five likely technical questions

**1. Is the route calculated from real Mars data?** Yes. The optical view and DEM come from the bundled CTX pair. At runtime, A* reads the 80 × 60 measured elevation array. Independent Dijkstra and mutation checks are in `docs/REALITY_CHECK.md`. The route is a grid research result, not operational guidance.

**2. Why do shortest and terrain-preferred differ?** Both use the same DEM and grid. Shortest minimizes horizontal cell distance; terrain preferred adds an illustrative cost for steeper adjacent-cell height changes. The example routes are about 2.07 and 2.13 km respectively. Lower sampled slope alone does not establish safety.

**3. Can we route to Three Forks, Bright Angel or the entire delta?** No. The current 3.2 × 2.4 km crop excludes the submitted Three Forks and Bright Angel point coordinates. The delta has no verified single point or polygon in the catalog. The explorer shows them as research context, and no route is generated.

**4. Does live DONKI mean live Mars radiation monitoring?** No. It returns solar event records and, for this integration, observed FLR/CME/SEP context. The UI shows event and retrieval timestamps. It does not infer Mars surface dose, EVA hazard level or Mars impact timing.

**5. What evidence and limitations would mission use require?** Wider registered imagery and DEM coverage, verified point or polygon positions, local obstacles and ground conditions, environmental and communication models, uncertainty propagation, calibrated human/rover constraints and formal validation. None is certified by this prototype.

## Scientific limitations and status

Measured: registered CTX optical crop, sampled DEM, projected metre geometry, route distance and adjacent-cell elevation differences. Modeled: A* route selection with an illustrative slope cost. Illustrative: example waypoints, synthetic demo, EVA view, candidate scenarios. Unavailable: measured thermal layer, local radiation dose, verified science routes to catalog targets, oxygen/communication/traction/safety assessment. Current recommendation: **CONDITIONAL GO** for an honestly framed research demonstration; **NO-GO** for operational EVA planning.
