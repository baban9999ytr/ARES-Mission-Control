#!/usr/bin/env python3
"""Build a provenance-aware ARES mission pack from locally downloaded, aligned Mars rasters.

Install (outside the JS no-dependency runtime): pip install rasterio numpy pillow
Do not use EPSG:4326 / Earth Web Mercator for Martian rasters.
"""
import argparse
import json
import math
from pathlib import Path
from urllib.parse import urlsplit

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.transform import from_bounds
from rasterio.warp import reproject
from PIL import Image


def require_source_url(url):
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or not parsed.netloc:
        raise ValueError('Source URLs must be full https:// URLs describing the original data')
    return url


def inspect_raster(src, label):
    if not src.crs or not src.crs.is_projected:
        raise ValueError(f'{label} must have an explicit projected Martian CRS in metres; not lon/lat')
    unit = (src.crs.linear_units or '').lower()
    if unit not in ('metre', 'meter', 'metres', 'meters', 'm'):
        raise ValueError(f'{label} must be projected in metres, found {src.crs.linear_units!r}')
    if src.count < 1:
        raise ValueError(f'{label} is empty')


def projected_band(src, bounds, w, h, resampling=Resampling.bilinear, band=1):
    # GDAL pulls only the source regions needed for this destination grid.
    # Keep source nodata explicit so it cannot be interpolated into valid terrain.
    dst = np.full((h, w), np.nan, dtype=np.float32)
    reproject(
        source=rasterio.band(src, band), destination=dst,
        src_transform=src.transform, src_crs=src.crs, src_nodata=src.nodatavals[band-1],
        dst_transform=from_bounds(*bounds, w, h), dst_crs=src.crs,
        dst_nodata=np.nan, init_dest_nodata=True, resampling=resampling,
    )
    return dst


def render_rgb(src, bounds, width=1000, height=750):
    if src.count >= 3:
        bands = [projected_band(src, bounds, width, height, band=i) for i in (1, 2, 3)]
    else:
        single = projected_band(src, bounds, width, height)
        bands = [single, single, single]
    rgb = np.zeros((height, width, 3), dtype=np.uint8)
    for i, layer in enumerate(bands):
        valid = np.isfinite(layer)
        if not valid.any():
            raise ValueError('Imagery does not overlap the selected projected bounds')
        lo, hi = np.percentile(layer[valid], (2, 98))
        rgb[:, :, i] = np.clip((layer - lo) / max(hi-lo, 1e-6) * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(rgb, 'RGB')


def elevation_visual(heights):
    safe = heights.copy()
    valid = np.isfinite(safe)
    values = safe[valid]
    lo, hi = np.percentile(values, (2, 98))
    norm = np.clip((safe - lo) / max(hi-lo, 1e-6), 0, 1)
    # Colormap is a display gradient, not physically measured spectral color.
    stops = np.array([[23, 38, 51], [61, 111, 126], [159, 145, 109], [229, 179, 117]], dtype=np.float32)
    scaled = np.nan_to_num(norm * (len(stops)-1), nan=0.0)
    a = np.clip(np.floor(scaled).astype(int), 0, len(stops)-2)
    frac = (scaled - a)[..., None]
    image = stops[a]*(1-frac) + stops[a+1]*frac
    image[~valid] = [16, 24, 32]
    return Image.fromarray(image.astype('uint8'), 'RGB').resize((1000, 750), Image.Resampling.NEAREST)


def find_valid(heights, x, y):
    h, w = heights.shape
    cx, cy = round(x*(w-1)), round(y*(h-1))
    best = None
    for yy in range(h):
        for xx in range(w):
            if np.isfinite(heights[yy, xx]):
                dist = (xx-cx)**2 + (yy-cy)**2
                if best is None or dist < best[0]:
                    best = (dist, xx, yy)
    if best is None:
        raise ValueError('The selected crop has no valid elevation pixels')
    return {'x': best[1], 'y': best[2]}


def generate(args):
    bounds = tuple(args.bounds)
    west, south, east, north = bounds
    if not (west < east and south < north):
        raise ValueError('Bounds require xmin ymin xmax ymax in projected metres')
    cell_x = (east-west)/args.width
    cell_y = (north-south)/args.height
    if abs(cell_x-cell_y)/max(cell_x,cell_y) > 0.03:
        raise ValueError('Crop must yield nearly square grid cells; use a 4:3 rectangle for 80x60')
    if abs((args.width/args.height)-(4/3)) > 0.01:
        raise ValueError('For now, ARES expects a 4:3 grid aspect ratio to match the 1000x750 map viewport')
    if cell_x < 0.1 or cell_y < 0.1:
        raise ValueError('Pixel size is implausibly small; check the projected bounds')
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    with rasterio.open(args.dem) as dem, rasterio.open(args.optical) as optical:
        inspect_raster(dem, 'DEM')
        inspect_raster(optical, 'Optical image')
        # Reproject within the same projected Mars CRS, to avoid Earth-projection assumptions.
        if dem.crs != optical.crs:
            raise ValueError('Input image and DEM must use the SAME projected Martian CRS. Reproject upstream using GDAL first.')
        if not (dem.bounds.left <= west and dem.bounds.right >= east and dem.bounds.bottom <= south and dem.bounds.top >= north):
            raise ValueError('DEM does not cover the entire crop. Choose an interior crop.')
        if not (optical.bounds.left <= west and optical.bounds.right >= east and optical.bounds.bottom <= south and optical.bounds.top >= north):
            raise ValueError('Optical image does not cover the entire crop. Choose an interior crop.')
        heights = projected_band(dem, bounds, args.width, args.height)
        if not np.isfinite(heights).any():
            raise ValueError('DEM crop contains no valid height samples')
        render_rgb(optical, bounds).save(output/'mars-optical.webp', quality=86, method=4)
        elevation_visual(heights).save(output/'mars-elevation.webp', quality=85)
        crs = dem.crs.to_wkt()
        source_resolution = {'opticalMeters': list(optical.res), 'demMeters': list(dem.res)}

    layers = {
        'optical': {'path':'data/mars-optical.webp','label':'MRO orbital imagery · processed crop', 'source':require_source_url(args.optical_source)},
        'elevation': {'path':'data/mars-elevation.webp','label':'Measured elevation · DEM', 'source':require_source_url(args.dem_source)},
    }
    if args.thermal:
        with rasterio.open(args.thermal) as t:
            inspect_raster(t, 'Thermal source')
            if t.crs != rasterio.crs.CRS.from_wkt(crs):
                raise ValueError('Thermal raster must share the projected Martian CRS')
            render_rgb(t, bounds).save(output/'mars-thermal.webp', quality=86)
        if not args.thermal_source:
            raise ValueError('--thermal-source is required for a thermal raster')
        layers['thermal']={'path':'data/mars-thermal.webp','label':'Thermal raster · native pixel values, contrast stretched', 'source':require_source_url(args.thermal_source)}
    valid_count = int(np.isfinite(heights).sum())
    cells = {
        'version': 1, 'kind': 'measured', 'site': args.site,
        'notice': 'Research prototype; not calibrated or authorized for operational EVA navigation.',
        'gridWidth': args.width, 'gridHeight': args.height,
        'cellMeters': round((cell_x+cell_y)/2, 6),
        'heights': [round(float(v),3) if math.isfinite(v) else None for v in heights.flat],
        'hazards': [], 'boundsMeters': {'west': west,'south':south,'east':east,'north':north},
        'crsWkt': crs,
        'verticalUnits': 'metres', 'verticalReference': args.vertical_reference,
        'layers':layers,
        'quality': {'validCells':valid_count,'totalCells':args.width*args.height,
                    'horizontalCellMeters': round(cell_x,4),'verticalCellMeters':round(cell_y,4),
                    'sourceResolution': source_resolution},
    }
    cells['start'] = find_valid(heights,.15,.48)
    candidates=[('delta','Delta science target','SEDIMENTARY SURVEY',.72,.20),
                ('rim','Terrain overlook','REGIONAL SURVEY',.78,.55),
                ('basin','Traverse sample site','SAMPLE SURVEY',.52,.72)]
    cells['waypoints']=[{'id':code,'code':f'SCI-{i:02d}','name':name,'type':kind,
                          'desc':'Illustrative planner waypoint; not a verified rover science target.',
                          **find_valid(heights,x,y)}
                         for i,(code,name,kind,x,y) in enumerate(candidates,1)]
    with (output/'mission-pack.json').open('w',encoding='utf-8') as f:
        json.dump(cells,f,separators=(',',':'),ensure_ascii=False)
    print(f'Wrote mission pack with {valid_count}/{args.width*args.height} DEM cells: {output}')
    print('IMPORTANT: validate CRS, vertical datum, geologic context and source licenses before representing this as NASA data.')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--dem', required=True, help='Locally downloaded projected DEM GeoTIFF with metre elevation values')
    p.add_argument('--optical', required=True, help='Projected NASA/USGS optical GeoTIFF in matching Mars CRS')
    p.add_argument('--bounds', type=float, nargs=4, required=True, metavar=('WEST','SOUTH','EAST','NORTH'), help='Crop bounds in the projected input CRS (metres), not longitude/latitude')
    p.add_argument('--output', default='public/data', help='Output static data directory')
    p.add_argument('--width', type=int, default=80)
    p.add_argument('--height', type=int, default=60)
    p.add_argument('--site', default='Jezero study sector')
    p.add_argument('--vertical-reference', default='Unverified; consult source DEM metadata', help='Vertical reference stated in source DEM metadata')
    p.add_argument('--dem-source', required=True, help='Public URL for original DEM')
    p.add_argument('--optical-source', required=True, help='Public URL for original image product')
    p.add_argument('--thermal', help='Optional registered regional thermal raster (for context, not live temperature)')
    p.add_argument('--thermal-source', help='Public source URL for optional thermal raster')
    args=p.parse_args()
    if args.width<8 or args.height<8 or args.width>240 or args.height>240:
        p.error('Grid dimensions must be between 8 and 240')
    try: generate(args)
    except (ValueError, rasterio.errors.RasterioError) as error: p.error(str(error))

if __name__ == '__main__':main()
