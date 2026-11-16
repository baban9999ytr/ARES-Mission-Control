# Route validation

SC-01 (`Elevation profile A`) was recomputed with `validateMissionLibrary`, `planMission`, and `comparisonFacts` on bundled `public/data/mission-pack.json`:

| Metric                     | Shortest | Terrain preferred |             Difference |
| -------------------------- | -------: | ----------------: | ---------------------: |
| Distance                   | 2200.0 m |       2365.6854 m | +165.6854 m / +7.5312% |
| Maximum sampled step slope | 20.2061° |           5.0987° |              −15.1074° |
| Total ascent               | 52.242 m |           6.603 m |              −45.639 m |

The A* heuristic is Euclidean horizontal distance. All current step costs are at least horizontal distance for nonnegative slope weighting, so the heuristic is admissible for existing modes. Existing tests validate obstacles, no-data barriers, route ordering and grid geometry. An independent Dijkstra comparison and weight sensitivity sweep were not completed in this release candidate. The coefficient 4 and reference 20° remain illustrative defaults.
