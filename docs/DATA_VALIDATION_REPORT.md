# Data validation report

## Phase 3 CTX integration follow-up — 2026-11-14

The bundled `JEZ_ctx_B_soc_008` optical and DEM products share the same projected Mars CRS. The selected crop is E 4,586,000–4,589,200 m, N 1,091,000–1,093,400 m. The 80 × 60 DEM routing grid has 40 m cells; the cropped optical and elevation images are both 1000 × 750 pixels. The CTX crop contains 4,800 valid DEM cells. The importer now gives GDAL a raster band reference and a destination array, so it reads the source regions needed for resampling without loading whole bands into NumPy. Source nodata is passed to reprojection and destination nodata remains NaN, exported as impassable `null` cells.

### Import benchmark

Measured on this machine with `.venv/bin/python` (Rasterio 1.5.2), the same CTX inputs, crop, and CLI options. Each version ran three times in a fresh Python process, writing to a temporary output directory. Wall time used `time.monotonic`; peak resident memory used the child process `wait4` `ru_maxrss` (KiB). This is process peak RSS, not an allocation trace or browser memory measurement.

| Importer                  | Wall time, seconds (three runs) | Peak RSS, KiB (three runs) | Median wall | Median peak RSS        |
| ------------------------- | ------------------------------- | -------------------------- | ----------- | ---------------------- |
| `f0aa942` full-band read  | 1.285, 1.238, 1.404             | 412092, 411724, 411696     | 1.285 s     | 411724 KiB (402.1 MiB) |
| Windowed GDAL band source | 0.727, 0.760, 0.727             | 108116, 108376, 107928     | 0.727 s     | 108116 KiB (105.6 MiB) |

The median peak RSS fell by 303608 KiB (296.5 MiB, 73.7%); median wall time fell by 0.558 s (43.4%). SHA-256 hashes of `mission-pack.json`, `mars-optical.webp`, and `mars-elevation.webp` were identical between the old and new importer for this fully valid CTX crop. These timings are local measurements and may differ with source layout, storage cache, and machine load.

A separate run of the updated importer produced all three files byte-for-byte identical to the bundled `public/data` assets.

### Verification

`npm run test` passed 13 tests, including a partial internal nodata barrier that forces a detour, a complete barrier that rejects the route, and mode selection that keeps demo terrain separate from the CTX pack. `.venv/bin/python tools/test_raster_import.py` passed with an internal nodata barrier in the raster fixture; the exported barrier cells remained `null` while adjacent cells stayed valid. `npm run build` and `git diff --check` passed.

In the in-app browser at `http://localhost:4173/`, measured mode rendered the CTX optical asset, showed **Thermal / Unavailable** as disabled, and had no console warnings or errors. Switching to `?mode=demo` showed **SYNTHETIC MAP**; its thermal control was enabled and selected `mars-demo-thermal.webp` with the **SYNTHETIC THERMAL RENDER** label. Switching back restored **RASTER DATA**, the CTX optical asset, and disabled **Thermal / Unavailable**, again without console warnings or errors. Browser peak memory and navigation timing were not measured; the importer benchmark above is the measured performance result.

The measured pack has no thermal layer. Its thermal control reads **Unavailable** and is disabled; the rendering path cannot fall back to synthetic thermal imagery in measured mode. The synthetic demo still includes its illustrative thermal visualization. Neither is a measured temperature product.

## Earlier Phase 2 audit (historical)

Audit date: 2026-11-14. See [`../data/manifests/validation.json`](../data/manifests/validation.json) for machine-readable checks.

## Rasters

Rasterio 1.5.2 opened the six selected complete map rasters, three unreferenced rover-image TIFFs, and two duplicate CTX copies. Their dimensions, band count, full CRS WKT where present, resolution, bounds, nodata, dtype, compression, tile layout, file size, SHA-256, embedded tags, and sampled value ranges are recorded in `raster-audit.json`. Central and southwest DEMs are 32-bit floating point with nodata values; their paired DRGs are 8-bit grayscale with zero nodata. All four high-resolution products use the same projected Mars Jezero CRS in metres. The CTX pair uses a different Mars equirectangular CRS (`ESRI:103885`); it must not be mixed with the high-resolution pair by comparing numeric coordinates directly. Rover-image TIFFs have no georeferencing, so their pixel coordinates are not map bounds.

Central, southwest, and CTX pairs pass CRS equality and bounding-box intersection checks. The central DEM/DRG bounding edges differ by roughly 1–2 m; southwest has a narrower DRG footprint on its west edge. Pixel grids have different resolutions, so source pixels do not align one-to-one. This audit does **not** prove pixel-level co-registration, DEM vertical datum, elevation accuracy, full-pixel integrity, or source scientific accuracy. No suspicious sample-range outliers were obvious in the small overviews, but overview sampling can miss defects. The incomplete downloads fail to open or are not TIFFs. Northern Fan data is absent.

## Science points

`python tools/validate_data.py` found valid JSON, 8 unique IDs, populated required English/Turkish fields, HTTPS source/image URL syntax, image credits, and complete coordinate pairs where present. Five records have coordinates in a broad Jezero vicinity; three correctly retain both coordinates as null. Coordinate meaning is explicitly described: Máaz and Séítah refer to sample localities, Belva and Bright Angel to rover positions, and Three Forks to a reference point near the named area. Delta, Kodiak, and Enchanted Lake have null positions. The JSON's own `verified` status wording is an unreviewed claim here: source pages, image rights, coordinate provenance, and the exact site-to-raster transform have **not** been independently checked. The broad plausibility box is only a sanity check, not a footprint test.

## Checks run

| Command                                                                 | Result                                                                                         |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run check`                                                         | Passed: 9 Node tests and static build.                                                         |
| `.venv/bin/python tools/test_raster_import.py`                          | Passed importer fixture smoke test.                                                            |
| `python tools/validate_data.py --output data/manifests/validation.json` | Passed science schema checks; central/southwest/CTX geometry-compatible; Northern Fan missing. |

Rasterio, NumPy, and Pillow were installed into an ignored local `.venv` because Rasterio was absent from the default Python environment. The JavaScript app requires no installed packages. No real-data mission pack was built or loaded into ARES.
