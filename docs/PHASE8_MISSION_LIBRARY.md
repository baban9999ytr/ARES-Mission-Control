# ARES Phase 8 — Measured CTX Mission Library

The left sidebar of the planner offers **Mission Library** with 30 authored measured-grid exercises. The exercises are already defined in `data/scenarios/measured-missions.json` and independently calculated in `docs/MISSION_SCENARIO_CATALOG.md`.

## Scope and use

- The catalog contains 10 Explorer, 10 Scientist and 10 Commander scenarios.
- Search by mission ID, title, objective or research question; filter by phase.
- Select a mission to set its ordered stop list on the measured Jezero CTX crop and calculate both A* preferences.
- The map draws each route through the provided fixed-order stops and labels intermediate stops. S and D show the endpoints (S/D for a return to start).
- The right panel reports aggregate distance, maximum adjacent-cell sampled slope and summed ascent across _independent_ route legs. It also shows each leg's distance and maximum sampled slope for the selected preference.
- Both generic route-export and Mission Library export buttons produce the mission-specific JSON with all fixed-order legs, model outputs, coordinates, source pack provenance and limits.
- **Exit mission** restores the original CTX demonstration route. Choosing a map point or illustrative waypoint exits the library context.
- Loading the separate synthetic demo does not show or execute these measured CTX missions.

### Important limits

These are 30 reproducible **research exercises**, _not_ 30 identified real-world sites. Their coordinates are user-selected cells in a 40 m grid derived from one measured Jezero CTX optical and DEM study crop. They are not NASA-certified landing sites, field science targets or operational EVA routes.

Commander scenarios run consecutive independent A* legs **in their authored order**. ARES does not globally optimize stop order or traverse logistics. Aggregate maximum sampled slope is the maximum among leg maxima. Neither metric certifies field traversability or local slopes unresolved by the 40 m grid.

The original canonical catalog is included in the Worker `dist/data/scenarios/measured-missions.json` at build time (no second edited copy). `src/data/mission-library.js` validates crop dimensions and all mission points before use; failures leave the basic CTX route planner functional.

## Preview and QA

From the repository root:

```bash
npm run check
node tools/generate_mission_results.mjs --check
npx wrangler deploy --dry-run
```

After a successful merge/deployment, verify:

1. `https://spcapps.openstacktool.com/` displays the Mission Library sidebar with 30 exercises, three filters and search.
2. `https://spcapps.openstacktool.com/data/scenarios/measured-missions.json` returns HTTP 200 JSON containing 30 missions.
3. Search `SC-07`, select it and check 1 leg of both route modes.
4. Select `CM-04` or `CM-10` and verify multiple numbered stop markers, fixed-order leg metrics, aggregated route comparison, and export. `CM-04` and `CM-10` return to their first stop.
5. Choose another example waypoint or set a custom point and check that mission context clears.
6. On `?mode=demo`, verify library cannot route these measured grid points.
7. Test keyboard navigation, briefings, mobile layout, and the two cloud URLs. Check browser console for errors.

**Readiness gate:** A green GitHub test or Wrangler dry-run alone is not proof of a working live release. Validate the exact deployed commit and browser flows. A regression should be addressed before marking Phase 8 complete.
