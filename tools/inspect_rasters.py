#!/usr/bin/env python3
"""Audit local GeoTIFFs and optionally write small, non-operational previews.

Install: python -m pip install rasterio numpy pillow
Example: python tools/inspect_rasters.py --root "$HOME/ARES-DATA" --root ARES-DATA
The JSON report uses root labels, never absolute source paths.
"""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def inspect(path, root_label, relative, hash_file=True, preview_dir=None):
    result = {
        "root": root_label,
        "relative_path": relative.as_posix(),
        "filename": path.name,
        "size_bytes": path.stat().st_size,
        "sha256": digest(path) if hash_file else None,
    }
    try:
        with rasterio.open(path) as src:
            result.update(
                driver=src.driver,
                width=src.width,
                height=src.height,
                bands=src.count,
                crs=src.crs.to_wkt() if src.crs else None,
                crs_name=str(src.crs) if src.crs else None,
                projected_mars_meters=bool(
                    src.crs
                    and src.crs.is_projected
                    and "mars" in src.crs.to_wkt().lower()
                    and src.crs.linear_units.lower()
                    in ("metre", "meter", "metres", "meters", "m")
                ),
                resolution=list(src.res) if src.crs else None,
                bounds=list(src.bounds) if src.crs else None,
                nodata=list(src.nodatavals),
                dtype=list(src.dtypes),
                compression=src.compression.value if src.compression else None,
                tiled=src.is_tiled,
                block_shapes=[list(x) for x in src.block_shapes],
                embedded_tags=src.tags(),
            )
            out_w = min(768, src.width)
            out_h = max(1, round(src.height * out_w / src.width))
            if out_h > 768:
                out_h = 768
                out_w = max(1, round(src.width * out_h / src.height))
            # Overview sampling: this is an estimate, never the exact data range.
            sample = src.read(
                1, out_shape=(out_h, out_w), masked=True, resampling=Resampling.nearest
            )
            valid = sample.compressed()
            valid = valid[np.isfinite(valid)]
            result["sample"] = {
                "method": "nearest-neighbor overview, at most 768 pixels per side",
                "width": out_w,
                "height": out_h,
                "valid_pixels": int(valid.size),
                "total_pixels": int(sample.size),
                "estimated_min": float(valid.min()) if valid.size else None,
                "estimated_max": float(valid.max()) if valid.size else None,
            }
            if preview_dir and valid.size:
                from PIL import Image

                lo, hi = np.percentile(valid, [2, 98])
                numeric = sample.astype("float64").filled(np.nan)
                scaled = np.clip(
                    (numeric - lo) / max(float(hi - lo), 1e-12) * 255, 0, 255
                )
                gray = np.nan_to_num(scaled).astype("uint8")
                alpha = (~np.ma.getmaskarray(sample) & np.isfinite(numeric)).astype(
                    "uint8"
                ) * 255
                rgba = np.stack([gray, gray, gray, alpha], axis=-1)
                preview_dir.mkdir(parents=True, exist_ok=True)
                target = preview_dir / (root_label + "__" + path.stem + ".png")
                Image.fromarray(rgba, "RGBA").save(target, optimize=True)
                result["preview"] = {
                    "path": (
                        target.as_posix() if not target.is_absolute() else target.name
                    ),
                    "purpose": "non-operational visualization",
                    "resampling": "nearest-neighbor overview",
                    "scaling": "per-raster 2nd–98th percentile linear grayscale, clipped; nodata transparent",
                    "sample_percentiles": [float(lo), float(hi)],
                }
    except Exception as exc:
        result["error"] = str(exc).replace(str(path), path.name)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        action="append",
        default=[],
        type=Path,
        help="Authorized source directory; repeat as needed",
    )
    parser.add_argument(
        "--file",
        action="append",
        default=[],
        type=Path,
        help="Inspect one authorized file; repeat as needed",
    )
    parser.add_argument("--output", type=Path, help="Write JSON report here")
    parser.add_argument(
        "--preview-dir", type=Path, help="Write small PNG previews here"
    )
    parser.add_argument(
        "--no-hash", action="store_true", help="Skip SHA-256 for a quick scan"
    )
    args = parser.parse_args()
    if not args.root and not args.file:
        parser.error("Provide at least one --root or --file")
    records = []
    for i, root in enumerate(args.root, 1):
        if not root.is_dir():
            parser.error(f"Root does not exist: {root}")
        label = f"source_{i}"
        for path in sorted(root.rglob("*")):
            if path.is_file() and path.suffix.lower() in (".tif", ".tiff"):
                records.append(
                    inspect(
                        path,
                        label,
                        path.relative_to(root),
                        not args.no_hash,
                        args.preview_dir,
                    )
                )
    for i, path in enumerate(args.file, 1):
        if not path.is_file():
            parser.error(f"File does not exist: {path}")
        records.append(
            inspect(
                path, f"file_{i}", Path(path.name), not args.no_hash, args.preview_dir
            )
        )
    report = {
        "schema_version": 1,
        "note": "Source labels correspond to --root order; no absolute paths stored.",
        "rasters": records,
    }
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    else:
        print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
