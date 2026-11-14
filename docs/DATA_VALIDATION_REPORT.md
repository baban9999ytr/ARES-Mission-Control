# Data validation report

Audit date: 2026-11-14. See [`../data/manifests/validation.json`](../data/manifests/validation.json) for machine-readable checks.

## Rasters

Rasterio 1.5.2 opened the six selected complete map rasters, three unreferenced rover-image TIFFs, and two duplicate CTX copies. Their dimensions, band count, full CRS WKT where present, resolution, bounds, nodata, dtype, compression, tile layout, file size, SHA-256, embedded tags, and sampled value ranges are recorded in `raster-audit.json`. Central and southwest DEMs are 32-bit floating point with nodata values; their paired DRGs are 8-bit grayscale with zero nodata. All four high-resolution products use the same projected Mars Jezero CRS in metres. The CTX pair uses a different Mars equirectangular CRS (`ESRI:103885`); it must not be mixed with the high-resolution pair by comparing numeric coordinates directly. Rover-image TIFFs have no georeferencing, so their pixel coordinates are not map bounds.

Central, southwest, and CTX pairs pass CRS equality and bounding-box intersection checks. The central DEM/DRG bounding edges differ by roughly 1–2 m; southwest has a narrower DRG footprint on its west edge. Pixel grids have different resolutions, so source pixels do not align one-to-one. This audit does **not** prove pixel-level co-registration, DEM vertical datum, elevation accuracy, full-pixel integrity, or source scientific accuracy. No suspicious sample-range outliers were obvious in the small overviews, but overview sampling can miss defects. The incomplete downloads fail to open or are not TIFFs. Northern Fan data is absent.

## Science points

`python tools/validate_data.py` found valid JSON, 8 unique IDs, populated required English/Turkish fields, HTTPS source/image URL syntax, image credits, and complete coordinate pairs where present. Five records have coordinates in a broad Jezero vicinity; three correctly retain both coordinates as null. Coordinate meaning is explicitly described: Máaz and Séítah refer to sample localities, Belva and Bright Angel to rover positions, and Three Forks to a reference point near the named area. Delta, Kodiak, and Enchanted Lake have null positions. The JSON's own `verified` status wording is an unreviewed claim here: source pages, image rights, coordinate provenance, and the exact site-to-raster transform have **not** been independently checked. The broad plausibility box is only a sanity check, not a footprint test.

## Checks run

| Command | Result |
| --- | --- |
| `npm run check` | Passed: 9 Node tests and static build. |
| `.venv/bin/python tools/test_raster_import.py` | Passed importer fixture smoke test. |
| `python tools/validate_data.py --output data/manifests/validation.json` | Passed science schema checks; central/southwest/CTX geometry-compatible; Northern Fan missing. |

Rasterio, NumPy, and Pillow were installed into an ignored local `.venv` because Rasterio was absent from the default Python environment. The JavaScript app requires no installed packages. No real-data mission pack was built or loaded into ARES.
