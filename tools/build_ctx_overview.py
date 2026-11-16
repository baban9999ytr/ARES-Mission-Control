#!/usr/bin/env python3
"""Reproduce a CTX optical/elevation overview from the registered local GeoTIFFs.

The overview is for geographic inspection only. It does not create a routing grid.
"""

import json
import sys
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image
from rasterio.enums import Resampling
from rasterio.transform import from_bounds
from rasterio.warp import reproject

ROOT = Path(__file__).resolve().parents[1]
OPTICAL = (
    ROOT / "ARES-DATA/01_OPTICAL/JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0.tiff"
)
DEM = (
    ROOT
    / "ARES-DATA/02_ELEVATION/JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tiff"
)
OUT = ROOT / "public/data"
BOUNDS = (4574000, 1080000, 4604000, 1102500)
WIDTH, HEIGHT = 1600, 1200


def sample(src):
    out = np.full((HEIGHT, WIDTH), np.nan, dtype=np.float32)
    reproject(
        source=rasterio.band(src, 1),
        destination=out,
        src_transform=src.transform,
        src_crs=src.crs,
        src_nodata=src.nodata,
        dst_transform=from_bounds(*BOUNDS, WIDTH, HEIGHT),
        dst_crs=src.crs,
        dst_nodata=np.nan,
        init_dest_nodata=True,
        resampling=Resampling.bilinear,
    )
    return out


def build():
    with rasterio.open(OPTICAL) as optical, rasterio.open(DEM) as dem:
        assert optical.crs == dem.crs and optical.crs.is_projected
        for source in (optical, dem):
            assert source.bounds.left <= BOUNDS[0] and source.bounds.bottom <= BOUNDS[1]
            assert source.bounds.right >= BOUNDS[2] and source.bounds.top >= BOUNDS[3]
        o, h = sample(optical), sample(dem)
        assert (
            np.isfinite(o).all() and np.isfinite(h).all()
        ), "Overview contains no-data cells"
        lo, hi = np.percentile(o, [2, 98])
        image = np.clip((o - lo) / (hi - lo) * 255, 0, 255).astype("uint8")
        Image.fromarray(image, "L").convert("RGB").save(
            OUT / "ctx-overview-optical.webp", quality=84, method=5
        )
        lo, hi = np.percentile(h, [2, 98])
        norm = np.clip((h - lo) / (hi - lo), 0, 1)
        stops = np.array(
            [[23, 38, 51], [61, 111, 126], [159, 145, 109], [229, 179, 117]],
            dtype=np.float32,
        )
        scaled = norm * 3
        a = np.clip(np.floor(scaled).astype(int), 0, 2)
        frac = (scaled - a)[..., None]
        rgb = (stops[a] * (1 - frac) + stops[a + 1] * frac).astype("uint8")
        Image.fromarray(rgb, "RGB").save(
            OUT / "ctx-overview-elevation.webp", quality=84, method=5
        )
        metadata = {
            "kind": "measured-context-only",
            "boundsMeters": dict(zip(("west", "south", "east", "north"), BOUNDS)),
            "widthPixels": WIDTH,
            "heightPixels": HEIGHT,
            "crsWkt": dem.crs.to_wkt(),
            "sourceOpticalMeters": list(optical.res),
            "sourceDemMeters": list(dem.res),
            "visualSampleMeters": [18.75, 18.75],
            "demValidPixels": int(np.isfinite(h).sum()),
            "sourceOptical": "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0.tiff",
            "sourceDem": "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/mars2020_trn/CTX/JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tiff",
            "routing": "unavailable; use the verified 80 × 60 study crop",
        }
        (OUT / "ctx-overview.json").write_text(json.dumps(metadata, indent=2) + "\n")
        print("CTX overview:", BOUNDS, "valid DEM pixels:", metadata["demValidPixels"])


if __name__ == "__main__":
    try:
        build()
    except (AssertionError, rasterio.errors.RasterioError) as error:
        sys.exit(str(error))
