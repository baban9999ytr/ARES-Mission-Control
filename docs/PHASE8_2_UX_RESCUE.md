# Phase 8.2 UX rescue

## What changed

The previous opening screen placed dataset selection, map layers, point picking, example destinations, the full 30-item catalog, route metrics, provenance, weather, and exports in three competing panels. On mobile, the map appeared before any visible mission action and the catalog was buried below many tools.

The planner now opens with a numbered **Mission → Map → Compare routes** sequence. **+ New Mission** is the primary action; **Choose Existing Mission** reveals a searchable, closed-by-default library. An active custom mission shows its name, ordered stops, add, remove, drag reorder, keyboard reorder, undo/redo, and blueprint save/load. Catalog missions show their independent legs and a **Duplicate & Edit** action. Research and Advanced disclosures contain the existing secondary tools.

The map retains the measured CTX optical mosaic and sampled DEM as the default. Background dragging pans when zoomed, stop dragging moves a waypoint, the add action temporarily changes click behavior, and route calculation happens on pointer release. Mouse wheel and zoom buttons control scale. Keyboard users can add a stop with arrow keys and Enter, or cancel with Escape. The route panel keeps the three requested metrics for both independent route modes and an explicit safety limitation.

## Browser verification

Tested in Chromium at 1440 × 900, 390 × 844, and 320 × 720. The first two sizes are captured below. At 390 and 320 pixels, the document had no horizontal overflow. The mobile sequence places mission actions before the map, then the comparison, followed by Research and Advanced. The 320-pixel primary actions and add control were reachable.

| Journey              | Verdict | Evidence                                                                                                                                                                                                                                                                                              |
| -------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — First-time user  | PASS    | New Mission created 2 stops; Add Stop appended a third; two independent route legs and both comparison values updated. Keyboard add also appended a third stop.                                                                                                                                       |
| B — Mission editing  | PASS    | Marker drag changed its measured-grid coordinates; grip drag reordered stops; Undo and Redo restored and reapplied the order.                                                                                                                                                                         |
| C — Existing mission | PASS    | Search returned CM-04 alone; selection displayed 4 independent legs; Duplicate & Edit made a 5-stop editable copy.                                                                                                                                                                                    |
| D — Data integrity   | PASS    | Default measured CTX retained the same opening route values (2.07 km shortest, 2.13 km terrain preferred). `?mode=demo` displayed the synthetic label and raster; Research, Data Sources, provenance, and dataset switching remained accessible. The routing engine and terrain files were untouched. |
| E — Mobile           | PASS    | 390- and 320-pixel browser checks found no horizontal overflow; primary actions, map, comparison, and disclosures were reachable.                                                                                                                                                                     |

`npm run check`: 47 tests passed; static build passed.

## Screenshots

| View               | Before                                                        | After                                                       |
| ------------------ | ------------------------------------------------------------- | ----------------------------------------------------------- |
| Desktop 1440 × 900 | [before-desktop.png](screenshots/phase8-2/before-desktop.png) | [after-desktop.png](screenshots/phase8-2/after-desktop.png) |
| Mobile 390 × 844   | [before-mobile.png](screenshots/phase8-2/before-mobile.png)   | [after-mobile.png](screenshots/phase8-2/after-mobile.png)   |

Additional: [full mobile flow](screenshots/phase8-2/after-mobile-full.png) and [CM-04 selected](screenshots/phase8-2/after-cm04.png).

## Limits

- Measured-grid exercises are illustrative route scenarios, not authenticated Mars science destinations.
- Terrain-preferred weighting and sampled endpoint slopes do not certify EVA safety or traversability.
- At the initial fit-to-map zoom, panning has no travel range. Zoom in before panning across the crop.
- NASA DONKI remains an external live request; the interface reports unavailable data rather than substituting events when that request fails.
