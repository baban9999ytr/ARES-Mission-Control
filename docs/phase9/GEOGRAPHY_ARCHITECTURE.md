# Phase 9 geographic architecture

## Present measured regions

The application has one routeable region, the 80 × 60 Jezero CTX crop at 40 m per cell, and one measured context-only overview from the same CTX optical/DEM pair. Their exact projected bounds and source URLs are in `public/data/mission-pack.json` and `public/data/ctx-overview.json`. The overview draws the crop boundary and suppresses markers and routes outside the route view. Its 1,600 × 1,200 WebP layers are compact enough for a single-image delivery today. They do not add independent DEM resolution.

## Next region contract

A future region manifest should declare an immutable region ID, planet, product ID, credited organizations and authors, original raster URLs, acquisition/verification dates, projected Mars CRS WKT, horizontal units, vertical reference, optical/DEM native resolution, exact bounds, nodata sentinel, quality coverage, display-layer URLs, tile-pyramid metadata, and a separate route eligibility state. Route eligibility must be `unavailable` until its DEM samples and grid geometry pass automated checks. Region selection should transform the viewport and clear prior route/mission state; raw x/y grid coordinates cannot be shared across regions.

Large mosaics should use overview and detail tile pyramids, with tiles in the source Martian projection or an explicitly documented transform. The service must never silently use Earth Web Mercator for Mars. Display tiles may interpolate imagery, while route grids must retain their own DEM sampling, valid-data mask and uncertainty. Candidate waypoints need their own source-confirmed coordinate evidence and region-membership checks. Route plans across regions require a scientifically defined cross-region graph; there is no such capability in Phase 9.

## Validation gates before expanding routing

1. Match source optical and DEM projection, bounds, pixel registration, vertical units and datum; reject mismatches.
2. Validate nodata masks and independent sample points against source raster values. Do not traverse unknown cells or diagonal corners of unknown cells.
3. Bound route grid size and benchmark A*; the current Set-based implementation scans its open set and is not suitable for a much larger grid without a priority queue and tiling/region graph.
4. Validate rendered route geometry against grid cells, segment lengths, slope and multi-stop leg boundaries.
5. Record data provenance and license/attribution terms per region, including product authors.
6. Verify desktop/mobile interactions and static deployment size before enabling route mode.

The locally available 1 m DEM and 0.3 m image pairs in the Northern Fan and Southwest Jezero directories use a different Mars CRS from this CTX pair. They are several gigabytes and are not blended or routed by ARES. They require their own region manifests, registration checks and tile generation.
