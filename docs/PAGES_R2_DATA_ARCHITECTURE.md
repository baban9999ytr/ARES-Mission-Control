# ARES deployment and large Mars datasets (Pages + R2)

**Status:** Release preparation, not an active deployment. Intended application: `https://spapps.openstacktool.com`.

## Architecture: do not publish 3 GB of GeoTIFFs as web assets

| Layer                                                              | Location                                                                      | Why                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| ARES application (HTML/CSS/JS)                                     | **Cloudflare Pages**                                                          | Static, no server needed                                     |
| Current measured CTX crop (mission-pack JSON + small WebPs)        | **Git repository -> Pages**                                                   | Already small and read by current browser UI                 |
| Unprocessed 1 m DEM / 0.3 m DRG TIFF sources (approximately 3 GB+) | **Local `ARES-DATA/` and, if backup/sharing required, a _private_ R2 bucket** | Too large to check into Git or serve to browsers             |
| Additional _processed_ Jezero map tiles / region mission packs     | **Optional public R2 bucket with a custom domain**                            | Add only after the app implements and validates new datasets |
| Sources, processing scripts, metadata and provenance               | **Git**                                                                       | Reproducibility without binary bloat                         |

**Important:** The current app does not fetch its original TIFFs from the network. Its measured CTX mode already uses `public/data/mission-pack.json` and registered WebP images. The raw files are build-time scientific inputs, not runtime dependencies. Simply uploading new TIFFs to R2 does **not** add high-resolution routing.

### Why this matters

- Cloudflare Pages currently limits each static file to **25 MiB**; the build now checks that limit and rejects accidental raw TIFFs.
- Do not use Git LFS as a substitute for browser hosting or as an automatic way to make Pages deploy giant files.
- Do not expose private source archives publicly unless their source licenses permit redistribution and their integrity/provenance is documented.
- A 3 GB download should never be triggered on first page load or on a mobile device.
- Keep the scientific coordinate reference, footprint, resampling and `nodata` integrity checks before enabling a new route layer.

## A. Current app: deployment without R2

1. Inspect the repository branch and ensure `npm run check` passes.
2. In Cloudflare Dashboard, **Workers & Pages > Create > Pages**, connect the repository `baban9999ytr/ARES-Mission-Control`. The repo is private; authorize the correct repository.
3. Use these settings:

   | Setting                | Value                                                       |
   | ---------------------- | ----------------------------------------------------------- |
   | Production branch      | Reviewed release branch (do **not** silently deploy `main`) |
   | Framework              | None                                                        |
   | Build command          | `npm run build`                                             |
   | Build output directory | `dist`                                                      |
   | Root directory         | Repository root                                             |
   | Node                   | 22 (repository has `.node-version`)                         |
   | Output files           | Static assets + `_headers` + `build-info.json`              |

4. First verify the temporary `*.pages.dev` preview before touching a production hostname.
5. Check whether `spapps.openstacktool.com` is already attached to another Pages project, Worker route or DNS record. Do not replace an existing service by accident.
6. Attach `spapps.openstacktool.com` as a Pages custom domain only after confirming it is unoccupied and deployment is approved.
7. **Production smoke test:** HTTPS certificate; `/index.html`; measured CTX JSON/WebPs; start/destination by pointer and keyboard; tablet layout; synthetic demo `?mode=demo`; export; Science Targets; DONKI live and failure; deep path `/planner/route?mode=demo`; `build-info.json`; and real response cache headers (see `_headers`).

**Rollback:** In Pages, roll back to the previously successful deployment. For Git-integrated production, restore the approved branch reference if necessary; do not delete source data.

## B. Optional large-file storage with R2

Cloudflare R2 is S3-compatible object storage. It has a Standard free tier (currently 10 GB-month storage, 1 million Class A, 10 million Class B operations/month, subject to Cloudflare terms) and no internet egress charges. Check current limits and billing; an account may require billing activation.

Suggested isolation:

- **Private scientific archive bucket**: `ares-raw-science`. Keep raw TIFFs here if cloud backup is needed. Do NOT attach a public domain. Use private credentials only in your local/cloud secret manager.
- **Public derived-assets bucket**: `ares-derived-assets`. Optional, contains only browser-ready, license-checked assets (WebP raster tiles, compact region packs, manifests).

Suggested public custom domain (only if available and approved): `mars-data.openstacktool.com`. It is separate from the Pages hostname, `spapps.openstacktool.com`.

R2 bucket/object paths are **not** automatically loaded by the existing app. Future region support needs an explicit, validated dataset manifest and client-side code. Use versioned, immutable asset keys such as:

```text
jezero/northern-fan/v1/manifest.json
jezero/northern-fan/v1/optical/0/0.webp
jezero/northern-fan/v1/elevation/0/0.webp
jezero/northern-fan/v1/route-grid.json
```

These are an example _future naming plan_, **not files produced by the existing importer**.

### Data ingest workflow

1. Download source DEM/DRG into `ARES-DATA/06_HIGH_RESOLUTION/NORTHERN_FAN/`, `SOUTHWEST_JEZERO/`, etc. Verify completion, TIFF format and checksums. An incomplete file (e.g. 67 MB of a 1+ GB DRG) is not ready.
2. Validate planetary CRS, image/DEM intersection, grid alignment, units, nodata and source provenance using project raster inspection/validation tools.
3. Generate a **bounded real dataset** with `tools/import_mars_rasters.py` (see `IMPORT_REAL_DATA.md`). Select a sensible extent and grid resolution so route computation stays responsive.
4. Keep only small, validated `mission-pack.json` and WebP display layers in Pages. For larger visual coverage, plan tiling and put tiles in public R2 **after developing a tile loader**.
5. Version and record the exact source names, SHA-256 hashes, tool versions, output CRS, pixel and grid sizes, extent, data/usage licenses and transformation parameters. Do not claim all points are validated just because they are in a raster extent.
6. Confirm derived assets are accessible from the preview environment and enforce the source provenance/safety disclaimers.

### Example upload process (future, not executed)

You can use the Cloudflare dashboard for selected objects, or an S3-compatible client (for example AWS CLI) with R2 credentials stored outside Git. **Never commit access keys, export them to shared shell history, or paste them into chat.**

Example **after** you create and validate a suitable small derived asset:

```bash
# Replace the account ID and credentials using your own secure local setup.
# Do NOT run this for private archives on the publicly accessible bucket.
aws s3 cp ./derived/manifest.json s3://ares-derived-assets/jezero/northern-fan/v1/manifest.json \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
  --content-type application/json
```

If deploying cross-origin assets from `mars-data.openstacktool.com` to `spapps.openstacktool.com`, configure bucket CORS for the preview origin and test from the browser. Cache immutable versioned tiles with suitable content types; make manifest changes explicit. R2 buckets are private by default and must be deliberately exposed via a public custom domain. Do not use the rate-limited `r2.dev` development endpoint as a production CDN.

## C. Mandatory release checks

- `npm run check` (Node 22+), which also checks built file size/count and rejects raw science raster leaks.
- `git status --short` and `git ls-files | grep -Ei '\\.(tif|tiff)$'` (expect no source TIFFs).
- No `.env`, API credentials, private objects or intermediate files in `dist/`.
- Browser routes use the measured 40 m CTX grid by default and continue working without DONKI.
- No fabricated high-resolution science target routes, Mars radiation dosage, 15-degree EVA safety cutoff, oxygen calculations or verified traction claims.
- No production DNS or deployment changes without a deliberate approval step.

## Official references

- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Pages headers: https://developers.cloudflare.com/pages/configuration/headers/
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- R2 public buckets/custom domains: https://developers.cloudflare.com/r2/buckets/public-buckets/
- R2 cache with custom domain: https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/

**Status at writing:** No R2 bucket or Pages deployment has been created by this change. All paths and domains in section B are _proposed architecture_.
