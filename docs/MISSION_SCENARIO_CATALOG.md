# ARES — 30 measured-grid mission scenarios

Generated from `public/data/mission-pack.json` using the production `src/engine/routing.js` A* implementation. Re-run `node tools/generate_mission_results.mjs --write` after changing the pack or routing code. Figures are **model outputs**, not independent scientific validation. Grid points are illustrative, not authenticated Jezero science targets.

**Data:** 80×60 grid at 40 m spacing. Crop E 4,586,000–4,589,200 m, N 1,091,000–1,093,400 m. Coordinates are cell centres in the Mars projected CRS, not Earth coordinates. A route segment may cross features unresolved by the 40 m grid.

**Metrics:** Distance is grid path distance; maximum slope is maximum _adjacent-cell step_ angle; ascent sums positive DEM height changes along the model path. Terrain-preferred adds an **illustrative** slope penalty. None establishes route safety, geological site identity, oxygen needs, communication feasibility or EVA duration.

**Evidence:** This file is machine-generated route output, _not_ proof of browser screenshots. Screenshot evidence must be captured separately using the app. Multi-leg Commander missions are multiple independent A* routes, not one native multi-stop optimization.

## Explorer — 10 missions

### EX-01: Short cross-crop traverse

Compare both route modes over a short eastbound crossing

**Question:** Compare route cost versus geometric distance.

**Grid stops:** (12, 28) [E 4586500 m, N 1092260 m] → (24, 28) [E 4586980 m, N 1092260 m]

**Computed totals:** Shortest 480 m, max step slope 4.715°, ascent 0 m. Terrain preferred 480 m, max step slope 4.715°, ascent 0 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 12,28 → 24,28 |                   480 |                  480 |                   0 |                  0 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### EX-02: Long diagonal

Observe a diagonal crossing with changing elevations

**Question:** Check how the terrain penalty changes a broad diagonal route.

**Grid stops:** (10, 48) [E 4586420 m, N 1091460 m] → (60, 9) [E 4588420 m, N 1093020 m]

**Computed totals:** Shortest 2646.173 m, max step slope 18.3°, ascent 75.865 m. Terrain preferred 2735.879 m, max step slope 9.786°, ascent 56.345 m.

| Leg             | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| --------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 10,48 → 60,9 |              2646.173 |             2735.879 |              75.865 |             56.345 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### EX-03: West-to-east transect

Follow a broad west-to-east transect

**Question:** Compare cumulative ascent and route distance.

**Grid stops:** (8, 30) [E 4586340 m, N 1092180 m] → (69, 30) [E 4588780 m, N 1092180 m]

**Computed totals:** Shortest 2440 m, max step slope 8.031°, ascent 10.928 m. Terrain preferred 2440 m, max step slope 8.031°, ascent 10.928 m.

| Leg             | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| --------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 8,30 → 69,30 |                  2440 |                 2440 |              10.928 |             10.928 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### EX-04: North-to-south transect

Compare north-to-south terrain gradients

**Question:** Inspect adjacent-cell maximum step slope.

**Grid stops:** (41, 7) [E 4587660 m, N 1093100 m] → (41, 52) [E 4587660 m, N 1091300 m]

**Computed totals:** Shortest 1800 m, max step slope 7.968°, ascent 19.106 m. Terrain preferred 1800 m, max step slope 7.968°, ascent 19.106 m.

| Leg             | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| --------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 41,7 → 41,52 |                  1800 |                 1800 |              19.106 |             19.106 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### EX-05: Corner-to-centre

Navigate from a western sector to central grid cells

**Question:** Check both route modes and avoid named science locality claims.

**Grid stops:** (7, 14) [E 4586300 m, N 1092820 m] → (39, 31) [E 4587580 m, N 1092140 m]

**Computed totals:** Shortest 1561.665 m, max step slope 6.995°, ascent 4.171 m. Terrain preferred 1561.665 m, max step slope 6.199°, ascent 3.725 m.

| Leg             | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| --------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 7,14 → 39,31 |              1561.665 |             1561.665 |               4.171 |              3.725 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### EX-06: Southern boundary approach

Study an approach across the southern sector

**Question:** Compare ascent despite a mostly horizontal displacement.

**Grid stops:** (13, 53) [E 4586540 m, N 1091260 m] → (58, 49) [E 4588340 m, N 1091420 m]

**Computed totals:** Shortest 1866.274 m, max step slope 7.023°, ascent 5.106 m. Terrain preferred 1866.274 m, max step slope 7.023°, ascent 2.291 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 13,53 → 58,49 |              1866.274 |             1866.274 |               5.106 |              2.291 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### EX-07: Northeast transfer

Examine route choice toward the northeast

**Question:** Inspect changes in slope and length.

**Grid stops:** (31, 43) [E 4587260 m, N 1091660 m] → (68, 10) [E 4588740 m, N 1092980 m]

**Computed totals:** Shortest 2026.762 m, max step slope 12.917°, ascent 31.033 m. Terrain preferred 2026.762 m, max step slope 3.622°, ascent 14.539 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 31,43 → 68,10 |              2026.762 |             2026.762 |              31.033 |             14.539 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### EX-08: Western short loop leg

Test closely spaced points in the west

**Question:** Document a short trip where routes may coincide.

**Grid stops:** (10, 18) [E 4586420 m, N 1092660 m] → (19, 23) [E 4586780 m, N 1092460 m]

**Computed totals:** Shortest 442.843 m, max step slope 5.471°, ascent 0 m. Terrain preferred 442.843 m, max step slope 5.601°, ascent 0 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 10,18 → 19,23 |               442.843 |              442.843 |                   0 |                  0 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### EX-09: Cross-axis route

Compare a mixed north-south and east-west journey

**Question:** Quantify effect of slope weighting.

**Grid stops:** (69, 43) [E 4588780 m, N 1091660 m] → (18, 12) [E 4586740 m, N 1092900 m]

**Computed totals:** Shortest 2553.625 m, max step slope 7.585°, ascent 76.663 m. Terrain preferred 2553.625 m, max step slope 4.633°, ascent 70.834 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 69,43 → 18,12 |              2553.625 |             2553.625 |              76.663 |             70.834 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### EX-10: Illustrative waypoint rehearsal

Route from the preset start to an illustrative study grid waypoint

**Question:** Do not identify the grid waypoint as real Jezero Delta.

**Grid stops:** (12, 28) [E 4586500 m, N 1092260 m] → (57, 12) [E 4588300 m, N 1092900 m]

**Computed totals:** Shortest 2065.097 m, max step slope 17.717°, ascent 52.316 m. Terrain preferred 2131.371 m, max step slope 10.438°, ascent 38.492 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 12,28 → 57,12 |              2065.097 |             2131.371 |              52.316 |             38.492 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

## Scientist — 10 missions

### SC-01: Elevation profile A

Compare surface height variation on a northern transect

**Question:** Use route metrics to discuss sampled DEM topography only.

**Grid stops:** (12, 10) [E 4586500 m, N 1092980 m] → (67, 10) [E 4588700 m, N 1092980 m]

**Computed totals:** Shortest 2200 m, max step slope 20.206°, ascent 52.242 m. Terrain preferred 2365.685 m, max step slope 5.099°, ascent 6.603 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 12,10 → 67,10 |                  2200 |             2365.685 |              52.242 |              6.603 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### SC-02: Elevation profile B

Compare surface height variation on a southern transect

**Question:** Contrast with SC-01; avoid claims of particular rock types.

**Grid stops:** (12, 50) [E 4586500 m, N 1091380 m] → (67, 50) [E 4588700 m, N 1091380 m]

**Computed totals:** Shortest 2200 m, max step slope 8.058°, ascent 14.969 m. Terrain preferred 2200 m, max step slope 8.058°, ascent 14.969 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 12,50 → 67,50 |                  2200 |                 2200 |              14.969 |             14.969 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### SC-03: Eastward ascent comparison

Compare two eastward routes from nearby starting cells

**Question:** Report modeled ascent, not physical energy consumption.

**Grid stops:** (11, 22) [E 4586460 m, N 1092500 m] → (63, 22) [E 4588540 m, N 1092500 m]

**Computed totals:** Shortest 2080 m, max step slope 5.869°, ascent 1.848 m. Terrain preferred 2080 m, max step slope 5.869°, ascent 1.848 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 11,22 → 63,22 |                  2080 |                 2080 |               1.848 |              1.848 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### SC-04: Eastward ascent replication

Repeat the eastward experiment at a different latitude

**Question:** Compare differences with SC-03.

**Grid stops:** (11, 37) [E 4586460 m, N 1091900 m] → (63, 37) [E 4588540 m, N 1091900 m]

**Computed totals:** Shortest 2080 m, max step slope 3.382°, ascent 4.85 m. Terrain preferred 2080 m, max step slope 3.382°, ascent 4.85 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 11,37 → 63,37 |                  2080 |                 2080 |                4.85 |               4.85 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### SC-05: Northwest slope sampling

Sample a northwest-oriented long traverse

**Question:** Identify large adjacent-cell slope changes.

**Grid stops:** (65, 46) [E 4588620 m, N 1091540 m] → (15, 14) [E 4586620 m, N 1092820 m]

**Computed totals:** Shortest 2530.193 m, max step slope 7.108°, ascent 72.994 m. Terrain preferred 2530.193 m, max step slope 4.67°, ascent 70.71 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 65,46 → 15,14 |              2530.193 |             2530.193 |              72.994 |              70.71 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### SC-06: Southwest slope sampling

Sample a southwest-oriented long traverse

**Question:** Contrast with SC-05 under the same cost model.

**Grid stops:** (63, 12) [E 4588540 m, N 1092900 m] → (15, 46) [E 4586620 m, N 1091540 m]

**Computed totals:** Shortest 2483.33 m, max step slope 4.811°, ascent 39.857 m. Terrain preferred 2483.33 m, max step slope 4.811°, ascent 33.033 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 63,12 → 15,46 |               2483.33 |              2483.33 |              39.857 |             33.033 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### SC-07: Central DEM cross-section

Route along a central vertical section

**Question:** Treat 40 m cells as coarse elevation samples.

**Grid stops:** (39, 8) [E 4587580 m, N 1093060 m] → (39, 51) [E 4587580 m, N 1091340 m]

**Computed totals:** Shortest 1720 m, max step slope 8.577°, ascent 19.743 m. Terrain preferred 1720 m, max step slope 8.577°, ascent 19.743 m.

| Leg             | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| --------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 39,8 → 39,51 |                  1720 |                 1720 |              19.743 |             19.743 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### SC-08: Peripheral DEM cross-section

Repeat along a more eastern section

**Question:** Compare with SC-07 without inferring hazards.

**Grid stops:** (68, 8) [E 4588740 m, N 1093060 m] → (68, 51) [E 4588740 m, N 1091340 m]

**Computed totals:** Shortest 1720 m, max step slope 8.573°, ascent 40.638 m. Terrain preferred 1720 m, max step slope 8.573°, ascent 40.638 m.

| Leg             | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| --------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 68,8 → 68,51 |                  1720 |                 1720 |              40.638 |             40.638 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### SC-09: Route model sensitivity

Select endpoints likely to expose a difference in cost weighting

**Question:** Record cases where the routes differ or coincide.

**Grid stops:** (8, 52) [E 4586340 m, N 1091300 m] → (72, 12) [E 4588900 m, N 1092900 m]

**Computed totals:** Shortest 3222.742 m, max step slope 6.999°, ascent 12.552 m. Terrain preferred 3222.742 m, max step slope 6.999°, ascent 7.756 m.

| Leg             | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| --------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 8,52 → 72,12 |              3222.742 |             3222.742 |              12.552 |              7.756 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### SC-10: Distance versus ascent

Explore a long path where distance and total ascent trade off

**Question:** Compare metrics; do not infer oxygen or safe EVA duration.

**Grid stops:** (6, 30) [E 4586260 m, N 1092180 m] → (73, 41) [E 4588940 m, N 1091740 m]

**Computed totals:** Shortest 2862.254 m, max step slope 8.058°, ascent 20.314 m. Terrain preferred 2862.254 m, max step slope 8.038°, ascent 4.983 m.

| Leg             | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| --------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 6,30 → 73,41 |              2862.254 |             2862.254 |              20.314 |              4.983 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

## Commander — 10 missions

### CM-01: Three-leg western survey

Sequence three independently computed local route legs

**Question:** Sum route distances; do not claim native multistop routing.

**Grid stops:** (10, 12) [E 4586420 m, N 1092900 m] → (23, 18) [E 4586940 m, N 1092660 m] → (34, 25) [E 4587380 m, N 1092380 m] → (47, 29) [E 4587900 m, N 1092220 m]

**Computed totals:** Shortest 1761.665 m, max step slope 10.722°, ascent 6.824 m. Terrain preferred 1761.665 m, max step slope 10.722°, ascent 4.012 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 10,12 → 23,18 |               619.411 |              619.411 |               2.588 |              0.327 |
| 2: 23,18 → 34,25 |                555.98 |               555.98 |                   0 |                  0 |
| 3: 34,25 → 47,29 |               586.274 |              586.274 |               4.236 |              3.685 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### CM-02: Northern traverse relay

Test a north-sector multileg itinerary

**Question:** Compare sums for both modes across each leg.

**Grid stops:** (9, 9) [E 4586380 m, N 1093020 m] → (27, 12) [E 4587100 m, N 1092900 m] → (46, 10) [E 4587860 m, N 1092980 m] → (69, 13) [E 4588780 m, N 1092860 m]

**Computed totals:** Shortest 2532.548 m, max step slope 20.206°, ascent 55.268 m. Terrain preferred 2598.823 m, max step slope 5.285°, ascent 6.455 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 9,9 → 27,12   |               769.706 |              769.706 |               2.129 |              1.702 |
| 2: 27,12 → 46,10 |               793.137 |              793.137 |               6.182 |              3.373 |
| 3: 46,10 → 69,13 |               969.706 |              1035.98 |              46.957 |               1.38 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### CM-03: Southern traverse relay

Test a south-sector multileg itinerary

**Question:** Record ascent separately for each leg.

**Grid stops:** (8, 49) [E 4586340 m, N 1091420 m] → (26, 51) [E 4587060 m, N 1091340 m] → (49, 47) [E 4587980 m, N 1091500 m] → (70, 50) [E 4588820 m, N 1091380 m]

**Computed totals:** Shortest 2629.117 m, max step slope 7.916°, ascent 14.245 m. Terrain preferred 2629.117 m, max step slope 7.355°, ascent 10.671 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 8,49 → 26,51  |               753.137 |              753.137 |                   0 |                  0 |
| 2: 26,51 → 49,47 |               986.274 |              986.274 |               1.042 |              0.506 |
| 3: 49,47 → 70,50 |               889.706 |              889.706 |              13.203 |             10.165 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### CM-04: Central square exercise

Visit four cells and return to the first

**Question:** Check a closed tour using independent grid routes.

**Grid stops:** (30, 22) [E 4587220 m, N 1092500 m] → (49, 22) [E 4587980 m, N 1092500 m] → (49, 39) [E 4587980 m, N 1091820 m] → (30, 39) [E 4587220 m, N 1091820 m] → (30, 22) [E 4587220 m, N 1092500 m]

**Computed totals:** Shortest 2880 m, max step slope 5.04°, ascent 33.555 m. Terrain preferred 2880 m, max step slope 5.04°, ascent 33.555 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 30,22 → 49,22 |                   760 |                  760 |                   0 |                  0 |
| 2: 49,22 → 49,39 |                   680 |                  680 |               3.977 |              3.977 |
| 3: 49,39 → 30,39 |                   760 |                  760 |              13.822 |             13.822 |
| 4: 30,39 → 30,22 |                   680 |                  680 |              15.756 |             15.756 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### CM-05: Crossing and return

Travel outward then reverse endpoints

**Question:** Compare outward/inward ascent even when distances match.

**Grid stops:** (14, 33) [E 4586580 m, N 1092060 m] → (57, 15) [E 4588300 m, N 1092780 m] → (14, 33) [E 4586580 m, N 1092060 m]

**Computed totals:** Shortest 4036.468 m, max step slope 4.005°, ascent 54.745 m. Terrain preferred 4036.468 m, max step slope 3.008°, ascent 34.661 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 14,33 → 57,15 |              2018.234 |             2018.234 |              18.598 |              8.989 |
| 2: 57,15 → 14,33 |              2018.234 |             2018.234 |              36.147 |             25.672 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### CM-06: Three-sector relay

Visit western, central, and eastern cells

**Question:** Study overall ascent without unsupported time estimates.

**Grid stops:** (9, 27) [E 4586380 m, N 1092300 m] → (36, 41) [E 4587460 m, N 1091740 m] → (68, 30) [E 4588740 m, N 1092180 m]

**Computed totals:** Shortest 2774.214 m, max step slope 8.655°, ascent 7.301 m. Terrain preferred 2774.214 m, max step slope 5.736°, ascent 3.632 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 9,27 → 36,41  |               1311.96 |              1311.96 |               0.967 |              0.415 |
| 2: 36,41 → 68,30 |              1462.254 |             1462.254 |               6.334 |              3.217 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### CM-07: Northern-southern transfer

Cross vertical sectors through an intermediate grid point

**Question:** Assess segmented routes against a direct mission.

**Grid stops:** (25, 9) [E 4587020 m, N 1093020 m] → (39, 30) [E 4587580 m, N 1092180 m] → (53, 51) [E 4588140 m, N 1091340 m]

**Computed totals:** Shortest 2143.919 m, max step slope 7.927°, ascent 15.146 m. Terrain preferred 2143.919 m, max step slope 6.538°, ascent 11.98 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 25,9 → 39,30  |               1071.96 |              1071.96 |              10.703 |              9.704 |
| 2: 39,30 → 53,51 |               1071.96 |              1071.96 |               4.443 |              2.276 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### CM-08: Waypoint assessment

Visit two illustrative preset locations from the default start

**Question:** Waypoints are grid examples, not verified scientific targets.

**Grid stops:** (12, 28) [E 4586500 m, N 1092260 m] → (41, 42) [E 4587660 m, N 1091700 m] → (62, 32) [E 4588500 m, N 1092100 m]

**Computed totals:** Shortest 2397.645 m, max step slope 8.105°, ascent 4.715 m. Terrain preferred 2397.645 m, max step slope 5.746°, ascent 1.439 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 12,28 → 41,42 |               1391.96 |              1391.96 |               2.724 |              0.819 |
| 2: 41,42 → 62,32 |              1005.685 |             1005.685 |               1.991 |               0.62 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### CM-09: Boundary-aware rehearsal

Traverse positions near—but inside—the four data boundaries

**Question:** Test bounded grid routing, not beyond-crop access.

**Grid stops:** (5, 6) [E 4586220 m, N 1093140 m] → (74, 7) [E 4588980 m, N 1093100 m] → (73, 53) [E 4588940 m, N 1091260 m] → (6, 52) [E 4586260 m, N 1091300 m]

**Computed totals:** Shortest 7329.706 m, max step slope 13.341°, ascent 118.217 m. Terrain preferred 7429.117 m, max step slope 7.023°, ascent 97.366 m.

| Leg             | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| --------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 5,6 → 74,7   |              2776.569 |              2875.98 |              24.653 |              4.452 |
| 2: 74,7 → 73,53 |              1856.569 |             1856.569 |              21.853 |             21.853 |
| 3: 73,53 → 6,52 |              2696.569 |             2696.569 |              71.711 |             71.061 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

### CM-10: Full-grid expedition exercise

Travel a four-leg sequence spanning the measured crop

**Question:** Compare total modeled cost, ascent, and distance; no life-support budget.

**Grid stops:** (12, 28) [E 4586500 m, N 1092260 m] → (67, 11) [E 4588700 m, N 1092940 m] → (66, 48) [E 4588660 m, N 1091460 m] → (18, 50) [E 4586740 m, N 1091380 m] → (12, 28) [E 4586500 m, N 1092260 m]

**Computed totals:** Shortest 6910.782 m, max step slope 10.582°, ascent 122.633 m. Terrain preferred 6910.782 m, max step slope 6.562°, ascent 93.617 m.

| Leg              | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |
| ---------------- | --------------------: | -------------------: | ------------------: | -----------------: |
| 1: 12,28 → 67,11 |              2481.665 |             2481.665 |              24.141 |              4.517 |
| 2: 67,11 → 66,48 |              1496.569 |             1496.569 |              38.392 |              36.46 |
| 3: 66,48 → 18,50 |              1953.137 |             1953.137 |              34.191 |             32.436 |
| 4: 18,50 → 12,28 |               979.411 |              979.411 |              25.909 |             20.204 |

**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.

## Research notes

- The catalog intentionally does not associate cells with Jezero Delta, Kodiak, Three Forks, Máaz, Séítah, Belva, Bright Angel or Enchanted Lake; currently submitted source coordinates are outside this pack or not point-defined.
- Do not extrapolate outside the measured crop or infer boulder, traction, thermal, atmospheric, radiation or certified human safety conditions.
- For qualitative interpretation compare both production modes at the same endpoints. Equal routes are legitimate, not a failed experiment.
- Store human screenshots separately; this generator does not open a browser.

## Provenance

- Data: `public/data/mission-pack.json` and metadata/provenance therein.
- Calculations: `src/engine/routing.js` (production A* cost and metrics).
- Scenario definitions: `data/scenarios/measured-missions.json`.
- Source and CRS descriptions: `IMPORT_REAL_DATA.md` and `docs/REALITY_CHECK.md`.
