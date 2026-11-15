# ARES measured data, attribution and processing

Verified 2026-11-15. ARES is an independent NASA Space Apps Challenge research prototype. NASA does not endorse it. No NASA insignia, mission badge, or endorsement mark is used.

## Measured CTX inputs

| Input | Organization and instrument | Native sample | Role |
|---|---|---:|---|
| [Jezero CTX orthomosaic](https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0.tiff) | USGS Astrogeology Mars 2020 product, MRO Context Camera | 6 m/pixel | Optical map texture |
| [Jezero CTX DTM](https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tiff) | USGS Astrogeology Mars 2020 product, MRO Context Camera | 20 m/pixel | Elevation color and sampled route grid |

The [USGS CTX product page](https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_ctx_dtm_mosaic) provides product and citation information. Both local source rasters use the same projected Mars equirectangular CRS, ESRI:103885, in metres. The optical raster is 5,322 × 5,040 pixels, with projected bounds E 4,573,663.25–4,605,595.25 m and N 1,079,453.14–1,109,693.14 m. The DEM is 1,596 × 1,512 pixels and extends to E 4,605,583.25 m. The DEM's nodata sentinel is about −3.4028e38; the selected overview and study crop contain valid sampled DEM pixels. The production pack records its vertical reference as the Mars 2020 IAU sphere (radius 3,396,190 m) from the source DEM XML. These heights are not Earth elevations.

## Processing and measured coverage

`tools/import_mars_rasters.py` reproducibly samples the 3.2 × 2.4 km study crop, projected E 4,586,000–4,589,200 m and N 1,091,000–1,093,400 m. The 80 × 60 route grid has 40 m square cells. The script rejects mismatched CRS, invalid bounds and missing DEM samples. It builds aligned optical/elevation WebP layers and `public/data/mission-pack.json`. The original source TIFFs stay outside the static deployment.

`tools/build_ctx_overview.py` reproducibly samples a 30 × 22.5 km overview, E 4,574,000–4,604,000 m and N 1,080,000–1,102,500 m, from the same registered GeoTIFFs. It rejects mismatched CRS, out-of-bounds sampling and any nodata pixels. Its 1,600 × 1,200 display rasters are visual products, with approximately 18.75 m output pixel spacing; that display sampling is not new independent DEM resolution. The overview is context-only. The original 3.2 × 2.4 km crop is outlined and remains the sole route-tested footprint. `public/data/ctx-overview.json` records the exact extent, source URLs and display sampling.

The overview optical and elevation WebPs total roughly 0.52 MB. The complete static build is about 1.06 MB. The raw CTX GeoTIFFs total roughly 46 MB and are not deployed. Two local high-resolution Jezero pairs use a different Mars CRS and total several gigabytes. They have not been merged into the app or routed. Additional regions should become separate measured packs with their own CRS, bounds, nodata checks, tile pyramids, validation and explicit route eligibility. No full-planet routing is claimed.

## Route and segment methodology

ARES implements eight-neighbour A* on the sampled grid. Orthogonal centre-to-centre steps are 40 m, diagonals are 40√2 ≈ 56.57 m. Shortest mode minimizes grid distance. Terrain-preferred mode applies an illustrative slope penalty; it does not certify traversability. Each multi-stop leg is planned independently in fixed order. Segment elevation is read from the DEM sample at each endpoint cell centre. Reported segment mean is the arithmetic mean of these two sampled endpoints. Change is end minus start. Approximate step slope is atan(|change| / horizontal step length) in degrees. Total ascent sums positive endpoint differences. No interpolation across the full physical segment is claimed. Rocks, sand, lighting, communications, suit limits and local surface radiation are not assessed.

## Context feeds and illustrative data

[NASA Mars Trek](https://trek.nasa.gov/mars/) and the [Perseverance location map](https://science.nasa.gov/mission/mars-2020-perseverance/location-map/) are research context, not ARES routing inputs. The optional [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) feed reports space-weather events; it does not measure local Mars surface radiation. Base Camp, Mineral Survey and other preset positions are illustrative study locations on measured grid cells, not real human installations, mineral discoveries or authenticated named geology. The separate synthetic demo uses generated imagery, heights, thermal-style colors and hazard circles.

USGS asks reusers to [credit its publications and authors](https://www.usgs.gov/information-policies-and-instructions/acknowledging-or-crediting-usgs). NASA's [media and brand guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/) distinguishes research data and media use from NASA insignia or endorsement. ARES claims neither NASA development nor endorsement.
