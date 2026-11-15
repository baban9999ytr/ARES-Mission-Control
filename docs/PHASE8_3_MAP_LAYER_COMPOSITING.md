# Phase 8.3 map layer compositing

## Implementation

Measured CTX mode now defaults to registered optical imagery plus the existing DEM-derived color raster at 45% opacity. The compact **Layers** popover beside the map title offers independent Optical and Elevation visibility, a 0–100% opacity slider, and two presentation methods: **Preserve optical detail** (`mix-blend-mode: color`) and **Standard overlay** (normal alpha). The only visible layer cannot be turned off. Elevation-only presentation is opaque and its opacity control is disabled. Routes and markers remain in an SVG above the raster group.

Measured Thermal remains unavailable because this pack has no registered thermal raster. Synthetic mode retains its original optical, elevation, and illustrative thermal selections in the same popover. No terrain data, routing mathematics, or source assets changed.

## Registration and color accuracy

The existing importer checks that CTX optical and DEM sources use the same projected Mars CRS and cover the same crop (E 4,586,000–4,589,200 m; N 1,091,000–1,093,400 m). It produces both bundled WebP images at 1000 × 750 pixels. The elevation raster is colored from the same 80 × 60 sampled DEM grid used by routing, then enlarged with nearest-neighbor display interpolation. Both images and the route SVG are children of one transformed map world. Chromium showed identical image/SVG rectangles after a 1.4× zoom and pan (1127 × 845.3 display pixels at the same x/y origin).

The legend computes actual sampled-grid extrema from the measured pack: **−2574.1 to −2453.7 m** relative to the Mars 2020 IAU sphere (radius 3,396,190 m). It uses the importer's four display colors and discloses clipping at the 2nd and 98th percentiles (−2562.5 and −2465.9 m). Display pixels are interpolation of sampled cells, not independent elevation measurements. A 72-cell Pillow comparison of the bundled elevation WebP against the importer palette found mean absolute channel error **0.83** and maximum sample mean error **1.90**, consistent with lossy WebP encoding.

## Verification

| Chromium check | Result |
| --- | --- |
| Optical Only | PASS — CTX optical visible, elevation and legend hidden. |
| Elevation Only | PASS — DEM raster and legend visible, 100% effective opacity. |
| Optical + Elevation | PASS — both registered rasters visible by default at 45%. |
| Opacity 0%, 45%, 100% | PASS — style opacity and visual screenshots checked. |
| Standard alpha and color blend | PASS — at 100%, color mode retained optical texture; alpha mode displayed DEM colors. |
| Pan and zoom alignment | PASS — both rasters and route SVG had identical transformed rectangles. |
| Waypoint drag with both layers | PASS — moved measured stop and recalculated terrain route (2.13 km → 1.78 km). |
| Route visibility | PASS — selected route and markers were visible across low and high elevation colors. |
| Measured/synthetic isolation | PASS — measured Thermal unavailable; synthetic thermal remained selectable and labeled illustrative. |
| Desktop 1440 × 900 | PASS. |
| Mobile 390 × 844 and 320 × 720 | PASS — popover stayed within viewport; no horizontal overflow. |

`npm run check` passed **52 tests** and the static build. `.venv/bin/python tools/test_raster_import.py` passed. An initial run with the system `python3` could not start because that interpreter lacks `rasterio`; the project's virtual environment has the required dependency. Chromium reported no console errors or warnings.

## Screenshots

- [Before: optical-only desktop](screenshots/phase8-3/before-desktop.png)
- [Optical only](screenshots/phase8-3/optical-only.jpg)
- [Elevation only](screenshots/phase8-3/elevation-only.jpg)
- [Optical + elevation at 45% color blend](screenshots/phase8-3/composite-45.jpg)
- [45% standard alpha](screenshots/phase8-3/composite-alpha-45.jpg)
- [0% opacity](screenshots/phase8-3/opacity-0.jpg)
- [100% color blend](screenshots/phase8-3/opacity-100-color.jpg)
- [100% standard alpha](screenshots/phase8-3/opacity-100-alpha.jpg)
- [Mobile composite at 390 pixels](screenshots/phase8-3/composite-mobile-390.jpg)

## Limits

- The color raster visualizes 40 m sampled DEM cells; color saturation is clipped outside the 2nd–98th percentile range. It is not a continuous independent measurement at every displayed pixel.
- No verified, geographically registered thermal raster exists in the current measured pack. Synthetic thermal remains an illustration only.
- The interface does not persist a user's layer settings across reloads; each measured session starts with the specified 45% composite.
