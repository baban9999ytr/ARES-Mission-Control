# Science target coverage review — 2026-11-15

ARES keeps named scientific sites separate from user-chosen activity stops. The latter are illustrative locations on measured terrain.

The existing eight-point Jezero catalog was checked with `scienceCoverage` against both bundled CTX route grids. In the 3.2 × 2.4 km crop, five candidate coordinates fall outside and three records have no point. In the 6.4 × 4.8 km sector, two remain outside, three have no point, and three lie inside but lack sufficient evidence for route eligibility. No named site is enabled as a route destination.

The Three Forks catalog coordinate (77.41359752° E, 18.45369687° N) comes from a [USGS Astrogeology tutorial](https://stac.astrogeology.usgs.gov/docs/tutorials/mosaic_json_analysis/) that explicitly calls it a point **near** Three Forks and the western fan, for querying mosaics. The [NASA/JPL sample depot map](https://www.jpl.nasa.gov/images/pia25682-perseverances-three-forks-sample-depot-map/) documents the named depot but does not establish that this tutorial point is a surveyed depot or individual sample location. The coordinate projects into the expanded route sector, but its meaning is insufficient to label the snapped 40 m cell as the named science target.

Máaz and Séítah catalog records also project into the expanded sector, but those names identify geologic formations while the catalog coordinates are described as individual sample localities. The cited [NASA-hosted geological paper](https://ntrs.nasa.gov/api/citations/20230016431/downloads/Sun%20et%20al%202023%20JGR%20Planets%20Jezero%20Campaign.pdf) supports geological context; a source-verified coordinate interpretation and registration to a specific route cell remain outstanding. A geological unit cannot be reduced to an arbitrary sample point without disclosure.

No science objective in Science Mission Mode asserts that a user-selected stop is one of these sites. Future route-to-target work requires an original point source, coordinate convention, Mars CRS transformation, coverage and DEM-cell check, and a clear distinction between a sample locality, reference point, and regional formation.
