# ARES v0.2 — Importing georeferenced Martian rasters

The bundled map is still **synthetic**. v0.2 adds an optional **offline scientific-data pipeline** that activates only when a valid `public/data/mission-pack.json` and matching `.webp` assets are present.

## Data sources

Use data products from official NASA/USGS collections. For example:
- [NASA Mars Trek](https://trek.nasa.gov/mars/) — Jezero MRO HiRISE imagery and Mars Odyssey THEMIS context.
- [NASA Mars Trek WMTS documentation](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars) — official Mars layers and coordinate systems.
- [NASA's Perseverance location map](https://science.nasa.gov/mission/mars-2020-perseverance/location-map/) — contextual geology and rover traverse.
- [USGS Astrogeology](https://astrogeology.usgs.gov/) — elevation products and map-projection support.

**Do not treat a JPEG screenshot, unrelated regional thermal map, or globally reprojected image as a mutually registered pair of local science rasters.** Download a matching DEM and optical GeoTIFF, record provenance, preserve their original Mars CRS, and crop a rectangle within both.

## Requirements

Python 3.10+; install separately (not needed for the live JS app):

```sh
python -m pip install rasterio numpy pillow
```

The importer refuses unprojected rasters, coordinate systems not expressed in metres, non-overlapping bounds, and mismatched CRS. It does **not** guess vertical units or verify NASA attribution; the operator is responsible for confirming that the DEM represents elevation in metres and for recording actual source URLs.

## Create a science pack

The `--bounds` arguments are **projected metres in the shared Martian raster CRS**, ordered west south east north. They are not decimal Mars latitude/longitude.

```sh
python tools/import_mars_rasters.py \
  --dem ./downloads/jezero-dem-projected.tif \
  --optical ./downloads/jezero-optical-projected.tif \
  --bounds 100000 200000 101600 201200 \
  --site 'Jezero study sector — sample footprint' \
  --dem-source 'https://YOUR-AUTHORITATIVE-DEM-SOURCE' \
  --optical-source 'https://YOUR-AUTHORITATIVE-OPTICAL-SOURCE' \
  --output public/data
```

**The values above are an example only, not a valid Jezero crop or verified product URLs.** Obtain actual projected crop coordinates by inspecting the rasters with QGIS or `gdalinfo` and selecting an interior area of both. The default 80×60 grid requires a 4:3 physical rectangle (1600×1200 m above), giving 20 m cells in this example. Vertical source values must already be metres. Higher-resolution input imagery is downsampled for the web view.

Optional `--thermal ./downloads/registered-thermal.tif --thermal-source https://...` adds a third **raster visualization**, but does not turn thermal radiance into temperature or promise map-cell-scale thermal precision.

Run `python tools/test_raster_import.py` to validate the pipeline against artificially generated GeoTIFF fixtures; those fixtures are NOT NASA science data.

## What the output means

`public/data/mission-pack.json` includes the source URLs, crop bounds, CRS WKT, grid spacing, real elevation samples and explicit no-data cells. `public/data/mars-optical.webp` and `mars-elevation.webp` share a single physical footprint. Both route modes treat no-data cells as impassable. Missing pixels are hatched in the map.

The importer generates **illustrative science waypoint coordinates** at valid DEM cells. They are not real, researched sample sites. The habitat start location is also illustrative. Any future genuine field targets must be added deliberately with supporting source evidence.

If the pack is absent or malformed, ARES uses its original clearly marked synthetic dataset. With a real pack, the synthetic thermal layer is disabled unless a valid thermal raster is supplied. The application displays projected metres rather than invented lat/lon readings.

## Limitations for the hackathon presentation

- The 20-m USGS Jezero DEM (if used) will not resolve individual boulders or astronaut boot-scale hazards.
- No real-time radiation, atmosphere, geology classification or rover position is inferred.
- Slope-weight parameters are illustrative engineering preferences, not NASA EVA thresholds.
- The mission pack's provenance fields are supplied by the operator and must be independently verified.
- ARES is **not** an EVA navigation safety system. Do not claim operational route certification.
