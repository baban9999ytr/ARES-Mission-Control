#!/usr/bin/env python3
"""Read-only validation of the expanded CTX route grid against the local GeoTIFFs."""

import json
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_bounds
from rasterio.warp import reproject

ROOT = Path(__file__).resolve().parent.parent
OPTICAL = (
    ROOT / "ARES-DATA/01_OPTICAL/JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0.tiff"
)
DEM = (
    ROOT
    / "ARES-DATA/02_ELEVATION/JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0.tiff"
)
PACK = ROOT / "public/data/ctx-expanded-pack.json"


def sample(source, bounds, width, height):
    out = np.full((height, width), np.nan, np.float32)
    reproject(
        rasterio.band(source, 1),
        out,
        src_transform=source.transform,
        src_crs=source.crs,
        src_nodata=source.nodata,
        dst_transform=from_bounds(*bounds, width, height),
        dst_crs=source.crs,
        dst_nodata=np.nan,
        resampling=Resampling.bilinear,
    )
    return out


def main():
    pack = json.loads(PACK.read_text())
    b = pack["boundsMeters"]
    bounds = (b["west"], b["south"], b["east"], b["north"])
    w, h = pack["gridWidth"], pack["gridHeight"]
    with rasterio.open(OPTICAL) as optical, rasterio.open(DEM) as dem:
        assert optical.crs == dem.crs and optical.crs.to_wkt() == pack["crsWkt"]
        assert optical.res == (6, 6) and dem.res == (20, 20)
        for source in (optical, dem):
            assert source.bounds.left <= b["west"] < b["east"] <= source.bounds.right
            assert source.bounds.bottom <= b["south"] < b["north"] <= source.bounds.top
        image = sample(optical, bounds, w, h)
        heights = sample(dem, bounds, w, h)
    assert np.isfinite(image).all() and np.isfinite(heights).all()
    stored = np.array(pack["heights"], dtype=np.float32).reshape(h, w)
    delta = np.abs(stored - heights)
    assert float(delta.max()) <= 0.0005
    assert int(np.isfinite(stored).sum()) == pack["quality"]["validCells"] == w * h
    print(
        "CRS",
        optical.crs,
        "bounds",
        bounds,
        "grid",
        w,
        h,
        "valid",
        w * h,
        "max DEM error m",
        float(delta.max()),
    )


if __name__ == "__main__":
    main()
