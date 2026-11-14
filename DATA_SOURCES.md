# ARES — scientific data provenance and integration plan

## Current implementation

| Layer | Status | Origin | Claims allowed |
|---|---|---|---|
| Optical-style map | Bundled synthetic illustration | `tools/generate_demo_terrain.py` | A coherent **synthetic** map for a UI demo |
| Elevation | Bundled synthetic 80×60 height grid | Same generator, sample spacing set to **25 demo meters** | Demonstration of slope computation and A* routing only |
| Thermal-style map | Bundled synthetic false-color illustration | Same generator | Example of layer switching, **no scientific temperature inference** |
| Hazards | 4 constructed circular demo obstacles | `src/data/demo-terrain.json` | Routing around user-visible synthetic exclusions |
| Waypoints | Illustrative positions, real-world Jezero-themed objectives | `src/main.js` | User-interface and science-context demonstration |
| External NASA thumbnail | Public NASA orbital context image (network optional) | NASA Science / Photojournal PIA25173 | External illustration, **not aligned** to the demo map |

Coordinates shown in the interface (18.4°N, 77.5°E) are **general Jezero context only** and are not transformations of any demo grid cell. `demoCellMeters` is a constructed scale used to exercise the algorithm, not a measurement of Jezero.

## Official or research-supported datasets to integrate

1. **NASA Mars Trek** — https://trek.nasa.gov/mars/ — orbital and planetary layers. Check service projections, scales and metadata before use.
2. **USGS Jezero Crater landing-site products** — https://astrogeology.usgs.gov/search/map/mars-2020-jezero-crater-landing-site-products — context camera orthomosaic and digital terrain models, including high-resolution HiRISE-based products.
3. **NASA Perseverance rover location map** — https://science.nasa.gov/mission/mars-2020-perseverance/location-map/ — context on rover route and the mission's controlled orbital basemap.
4. **NASA Perseverance raw images** — https://mars.nasa.gov/mars2020/multimedia/raw-images/ — camera pictures for verified location-specific observation cards.
5. **NASA Mars Odyssey / THEMIS** — use the instrument's official catalog and data metadata; native thermal resolution/time must be respected.
6. **USGS Jezero CTX elevation mosaic** — https://www.usgs.gov/media/images/jezero-crater-0 — scientific context on the approximately 20 m/pixel Jezero elevation mosaic; obtain the actual referenced raster when integrating.
7. **Caltech Murray Lab Jezero GIS** — https://murray-lab.caltech.edu/Mars2020/index.html — excellent reference for available HiRISE mosaics and stereo DEM strips; files may be very large.
8. **NASA NASA Photojournal PIA25173** — https://science.nasa.gov/photojournal/perseverances-route-to-the-delta/ — NASA orbital photo context and credit.

The current app does not download or process these datasets. They are next steps.

## Data acceptance criteria before claiming actual Mars terrain analytics

- [ ] exact DEM/orthomosaic product identifier, geographic bounds and coordinate reference system
- [ ] consistent horizontal projection and resolution between image and height grid
- [ ] vertical units, datum, null handling and raster uncertainty recorded
- [ ] correctly transformed point, line and hazard coordinate locations
- [ ] slope validated in degrees using real metric distance, including raster edge cells
- [ ] no route through unknown terrain without a visible warning
- [ ] thermal view labeled with actual spatial and temporal resolution
- [ ] imagery attribution, license, metadata links and original products archived
- [ ] actual rover image linked to a verified location, not misleadingly shown as a current photo

**Operational disclaimer:** This project is not validated for astronaut safety decisions. It must never be described as NASA-certified route guidance.
