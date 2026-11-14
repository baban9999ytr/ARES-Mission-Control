#!/usr/bin/env python3
"""Smoke-test the offline importer using TEST fixtures, not real NASA data."""
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from subprocess import run
import sys

import numpy as np
import rasterio
from rasterio.transform import from_origin
from rasterio.crs import CRS

with TemporaryDirectory() as folder:
    root=Path(folder)
    crs=CRS.from_string('+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +a=3396190 +b=3396190 +units=m +no_defs')
    transform=from_origin(0, 1200, 20, 20)
    raw=np.tile(np.linspace(-2400,-2200,80,dtype=np.float32),(60,1))
    raw[3:8,4:10]=-9999
    raw[10:50,39:42]=-9999  # internal barrier with valid terrain on both sides
    for name,values in [('dem',raw),('optical',np.tile(np.linspace(0,255,80,dtype=np.float32),(60,1)))]:
        with rasterio.open(root/f'{name}.tif','w',driver='GTiff',width=80,height=60,count=1,dtype='float32',nodata=-9999,
                             crs=crs,transform=transform) as ds:ds.write(values,1)
    cmd=[sys.executable,str(Path(__file__).parent/'import_mars_rasters.py'),'--dem',str(root/'dem.tif'),'--optical',str(root/'optical.tif'),
         '--bounds','0','0','1600','1200','--output',str(root/'out'),
         '--dem-source','https://example.org/dem','--optical-source','https://example.org/optical']
    result=run(cmd,text=True,capture_output=True)
    assert result.returncode==0, result.stderr
    pack=json.loads((root/'out/mission-pack.json').read_text())
    assert pack['kind']=='measured'
    assert pack['cellMeters']==20
    assert pack['quality']['validCells']<4800
    assert pack['quality']['validCells']==4800-30-120
    assert all(pack['heights'][y*80+x] is None for y in range(10,50) for x in range(39,42))
    assert pack['heights'][30*80+38] is not None
    assert pack['heights'][30*80+42] is not None
    assert (root/'out/mars-optical.webp').exists()
    assert (root/'out/mars-elevation.webp').exists()
    print('Raster importer smoke test passed: registered output, provenance, internal no-data barrier')
