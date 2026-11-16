"""Generate synthetic map and aligned height grid for ARES demo.

NOT derived from NASA topography. Replace with georeferenced NASA/USGS
orthomosaic and DEM before any scientific claim or operational use.
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, zoom

OUT = Path(__file__).resolve().parents[1]
W, H = 1600, 1200
rng = np.random.default_rng(42)
y, x = np.mgrid[0:H, 0:W].astype(float)
terrain = np.zeros((H, W), dtype=float)
for sigma, amp in [(220, 170), (110, 100), (55, 50), (22, 23), (8, 8), (2.5, 3)]:
    field = gaussian_filter(rng.normal(0, 1, (H, W)), sigma=sigma, mode="reflect")
    terrain += field / (field.std() + 1e-6) * amp

# Curving western slopes and fan deposits, aligned with the image
terrain += 130 * np.exp(-(((x - 320) / 210) ** 2))
terrain += (
    80 * np.sin((y + 110 * np.sin(x / 175)) / 110) * np.exp(-(((x - 510) / 290) ** 2))
)
terrain += 60 * np.cos((x + y * 0.28) / 87) * np.exp(-(((x - 850) / 240) ** 2))
# major ridges with narrow channels
for i in range(5):
    river = (
        690 + 90 * np.sin(x / (155 + i * 30) + i * 1.2) + (i - 2) * 65 + 0.2 * (x - 800)
    )
    terrain -= (
        (40 - i * 2)
        * np.exp(-(((y - river) / (11 + i * 4)) ** 2))
        * np.exp(-(((x - 700) / 600) ** 2))
    )
# Crater bowls + raised rims
for cx, cy, r, depth in [
    (1190, 275, 130, 80),
    (405, 925, 190, 100),
    (1030, 880, 83, 43),
    (730, 340, 55, 36),
    (1285, 1000, 46, 27),
    (152, 550, 64, 36),
]:
    rr = np.sqrt((x - cx) ** 2 + (y - cy) ** 2) / r
    terrain -= depth * np.exp(-((rr / 0.62) ** 2))
    terrain += depth * 0.48 * np.exp(-(((rr - 1) / 0.13) ** 2))
terrain = gaussian_filter(terrain, 1.0)
# Lambert-ish illumination from top left
ny, nx = np.gradient(terrain)
illum = np.clip(0.68 - nx * 0.014 - ny * 0.008, 0.12, 1.35)
q = (terrain - terrain.min()) / (terrain.max() - terrain.min())
detail = (q - 0.5) * 0.23 + illum * 0.8
base = np.stack(
    [
        37 + detail * 108 + q * 55,
        37 + detail * 68 + q * 33,
        36 + detail * 52 + q * 18,
    ],
    axis=2,
)
noise = rng.normal(0, 2.2, (H, W, 1))
base = np.uint8(np.clip(base + noise, 0, 255))
Image.fromarray(base, "RGB").save(
    OUT / "public" / "mars-demo-terrain.webp", quality=88, method=6
)

# Height-like visual (NOT calibrated elevation)
shade = np.stack(
    [52 + q * 100 + illum * 12, 73 + q * 120 + illum * 14, 79 + q * 135 + illum * 15],
    axis=2,
)
Image.fromarray(np.uint8(np.clip(shade, 0, 255)), "RGB").save(
    OUT / "public" / "mars-demo-elevation.webp", quality=85
)

# Thermal is purely illustrative and not retrieved instrument data
therm = np.stack([80 + q * 165, 54 + np.abs(q - 0.45) * 110, 135 - q * 105], axis=2)
Image.fromarray(np.uint8(np.clip(therm, 0, 255)), "RGB").save(
    OUT / "public" / "mars-demo-thermal.webp", quality=85
)

# downsample height data matching exact raster extent
GW, GH = 80, 60
height = zoom(terrain, (GH / H, GW / W), order=1)
# dimensions: each sample is 25m apart in DEMO only
height = (height - height.min()) / (height.max() - height.min())
meters = np.round(-2550 + height * 190, 1)
# deterministic artificial rockfall zones for route engine; masks are NOT mapped hazards
hazards = []
for hy, hx, hr in [(15, 43, 7), (33, 49, 9), (40, 23, 6), (13, 69, 5)]:
    hazards.append({"x": hx, "y": hy, "radius": hr})
out = {
    "notice": "Synthetic visualization data. This is NOT a NASA DEM or hazard map.",
    "gridWidth": GW,
    "gridHeight": GH,
    "demoCellMeters": 25,
    "heights": meters.flatten().tolist(),
    "hazards": hazards,
    "latitudeLabel": "18.4° N / 77.5° E (regional reference only; not coordinate registered)",
}
(OUT / "src/data/demo-terrain.json").write_text(json.dumps(out, separators=(",", ":")))
print("Wrote local synthetic terrain assets and aligned DEMO height-grid")
