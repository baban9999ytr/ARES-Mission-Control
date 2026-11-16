#!/usr/bin/env python3
"""Independent read-only checks of the bundled CTX mission pack against local TIFFs."""

import hashlib
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
PACK = ROOT / "public/data/mission-pack.json"


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for part in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            h.update(part)
    return h.hexdigest()


def main():
    pack = json.loads(PACK.read_text())
    b = pack["boundsMeters"]
    bounds = (b["west"], b["south"], b["east"], b["north"])
    w, h = pack["gridWidth"], pack["gridHeight"]
    with rasterio.open(OPTICAL) as optical, rasterio.open(DEM) as dem:
        assert optical.driver == dem.driver == "GTiff"
        assert optical.crs == dem.crs and optical.crs.is_projected
        for label, ds, path in [("optical", optical, OPTICAL), ("DEM", dem, DEM)]:
            assert ds.bounds.left <= bounds[0] < bounds[2] <= ds.bounds.right
            assert ds.bounds.bottom <= bounds[1] < bounds[3] <= ds.bounds.top
            print(
                label,
                "sha256",
                digest(path),
                "CRS",
                ds.crs,
                "bounds",
                tuple(ds.bounds),
                "resolution",
                ds.res,
                "nodata",
                ds.nodata,
            )
        destination = np.full((h, w), np.nan, np.float32)
        reproject(
            source=rasterio.band(dem, 1),
            destination=destination,
            src_transform=dem.transform,
            src_crs=dem.crs,
            src_nodata=dem.nodata,
            dst_transform=from_bounds(*bounds, w, h),
            dst_crs=dem.crs,
            dst_nodata=np.nan,
            init_dest_nodata=True,
            resampling=Resampling.bilinear,
        )
    errors = []
    for y in [0, 11, 23, 35, 47, 59]:
        for x in [0, 15, 31, 47, 63, 79]:
            source = destination[y, x]
            stored = pack["heights"][y * w + x]
            if np.isfinite(source):
                assert stored is not None
                errors.append(abs(float(source) - stored))
            else:
                assert stored is None
    assert max(errors) <= 0.0005
    assert int(np.isfinite(destination).sum()) == pack["quality"]["validCells"]
    print(
        "sampled_cells",
        len(errors),
        "max_abs_m",
        max(errors),
        "mean_abs_m",
        sum(errors) / len(errors),
        "valid_grid_cells",
        int(np.isfinite(destination).sum()),
    )


if __name__ == "__main__":
    main()
