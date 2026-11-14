# Science targets and mission concepts — 14 November 2026

## Catalog integration

The static build now includes both separately scoped catalogs. `src/data/science-catalog.js` validates identity, bilingual descriptions, source/image URLs, coordinate ranges and coordinate meaning. A NASA-hosted URL is a link, not coordinate authentication. The UI shows English and Turkish descriptions, objective, geological category, coordinate meaning, submitted coordinates, projected location, coverage decision, source and image attribution. The global catalog is research context only.

The active CTX WKT specifies Mars 2000 IAU spherical equirectangular with radius 3,396,190 m. The transformation is guarded to that exact projection and cross-checked with Rasterio's Mars-aware transform. The crop is E 4,586,000–4,589,200 m, N 1,091,000–1,093,400 m. For a named route target, the gate requires in-bounds projection, a valid measured DEM cell and independently reviewed source coordinate. The app does not automatically place a catalog point on the map or snap it to an edge. Existing local waypoints remain labeled illustrative.

| Jezero target | Coordinate meaning | Coverage and decision |
| --- | --- | --- |
| Jezero Delta | Extended geological feature, no single point | Location not available as a verified single point. |
| Kodiak | Outcrop/remnant, no single point | Location not available as a verified single point. |
| Máaz | Submitted Rochette/Bellegarde sample locality | E 4,590,491.6 N 1,092,476.5; outside east. |
| Séítah | Submitted Brac/Dourbes sample locality | E 4,590,411.0 N 1,092,668.0; outside east. |
| Three Forks | Submitted reference near named region | E 4,588,667.6 N 1,093,837.3; outside north. |
| Enchanted Lake | Named feature, no single point | Location not available as a verified single point. |
| Belva | Submitted dated rover position, not crater centre | E 4,582,828.1 N 1,093,987.0; outside west/north. |
| Bright Angel | Dated rover position, not outcrop centre | E 4,592,725.4 N 1,096,030.6; outside east/north. |

The Bright Angel coordinate is explicitly corroborated by a [NASA planetary-science slide](https://assets.science.nasa.gov/content/dam/science/cds/researchers/nac/pac/2025/2%20-%20PSD%20Update%20July%202024_TAGGED.pdf) as the rover's location on 21 June 2024. Other submitted coordinate sources have not been independently verified. All eight locations are currently ineligible for named CTX routes. The app can still route between valid user-selected grid cells on the measured crop.

## Ten candidate scenarios

The ten supplied scenarios remain research concepts. Great-circle distances in the submission are straight-line references between submitted point coordinates, not ARES grid-route distances. None generates an ARES route on the current crop. No geological polygons exist. The raw scenario text is not used as UI safety copy.

| Scenario | Candidate concept | Current classification |
| --- | --- | --- |
| EVA-01 | Three Forks → Máaz | Requires additional geospatial coverage and verified point meanings. |
| EVA-02 | Máaz → Séítah | Requires additional geospatial coverage and verified point meanings. |
| EVA-03 | Three Forks → Belva | Requires additional geospatial coverage and verified point meanings. |
| EVA-04 | Three Forks → Bright Angel | Requires additional geospatial coverage and verified point meanings. |
| EVA-05 | Belva → Bright Angel | Requires additional geospatial coverage and verified point meanings. |
| EVA-06 | Three Forks → Jezero Delta | Requires additional coverage and a verified region/point definition. |
| EVA-07 | Séítah → Kodiak | Requires additional coverage and a verified region/point definition. |
| EVA-08 | Three Forks → Enchanted Lake | Requires additional coverage and a verified region/point definition. |
| EVA-09 | Bright Angel → Séítah | Requires additional geospatial coverage and verified point meanings. |
| EVA-10 | Máaz → Séítah → Three Forks | Requires additional coverage, verified point meanings and multi-leg design. |

No scenario is currently runnable on the measured CTX map. Claims of a 15° certified cutoff, safe passage, oxygen endurance, communication visibility, traction or verified EVA duration are removed from the shipped presentation. They are hypothetical future constraints, not ARES calculations.
