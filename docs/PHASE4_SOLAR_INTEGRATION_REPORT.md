# NASA DONKI integration — 14 November 2026

## Official source and API probe

NASA CCMC's [migration announcement](https://ccmc.gsfc.nasa.gov/news/major-updates/) sets the public base to `https://ccmc.gsfc.nasa.gov/DONKI-API/get/`. The [DONKI documentation](https://ccmc.gsfc.nasa.gov/tools/DONKI/) describes FLR, CME, SEP and the M2M catalog as research/prototyping information. The [API UI](https://ccmc.gsfc.nasa.gov/DONKI/api/) and [Swagger UI](https://ccmc.gsfc.nasa.gov/DONKI-API/) are official, but the interactive specifications did not expose a usable machine-readable schema through the static fetch attempted here. The implementation therefore validates the actual fields used rather than assuming a broader schema.

Read-only requests on 14 November 2026 used `startDate=2026-11-07&endDate=2026-11-14` with no API key and `Origin: http://localhost:4173`: 

| Endpoint | HTTP | Content type | CORS | Records | Observed first record |
| --- | ---: | --- | --- | ---: | --- |
| `FLR` | 200 | `application/json` | `Access-Control-Allow-Origin: *` | 7 | `flrID`, `catalog`, `beginTime`, `instruments`, `link`; first begins 2026-11-07T12:26Z |
| `CME` | 200 | `application/json` | `*` | 23 | `activityID`, `catalog`, `startTime`, `instruments`, `link`; first starts 2026-11-07T06:24Z |
| `SEP` | 200 | `application/json` | `*` | 0 | Empty array in this window; not a service failure. |

A separate September query returned eight SEP records; one has `sepID`, `eventTime`, `instruments`, and `link` with event time `2026-09-05T15:45Z`. Sanitized single-record fixtures are in `tests/fixtures/donki-*.json`; they contain public event fields only, no credentials, headers or event notes. The response header `X-Rate-Limit-Remaining: 119` was observed, but a documented quota/window was not found, so no numeric rate limit is asserted. These successful requests establish that no key was required for the tested public reads, not a permanent authentication guarantee.

The `startDate` and `endDate` query parameters worked for all three endpoints. A no-parameter FLR probe returned HTTP 200 and 13 records, so these dates are not required for that endpoint; ARES supplies them to bound the query. An inverted interval returned HTTP 400, `text/plain`, with `API Error: startDate cannot be after endDate.` A malformed start date unexpectedly returned HTTP 200 with data from a different interval; the app generates dates itself and never treats the server as a date validator. A >30-day SEP query returned HTTP 400; the app uses seven days. FLR, CME, SEP returned `*` CORS for the tested origin, and the in-app browser successfully fetched the same seven-day window.

## Shipped behavior

The collapsed Space Weather drawer fetches directly from NASA on first open or explicit refresh. It reports the query window, retrieval time, counts or per-type unavailability, and up to 12 newest public event records with type, observed UTC time, catalog, observing instrument and source-record link. Failed or malformed responses show unavailable/partial status; no synthetic replacement is used. Empty SEP is reported as zero. Browser check retrieved FLR 7, CME 23, SEP 0 at `2026-11-14T18:36:14.465Z`, with no console warnings or errors.

No Mars impact model, historical Mars measurement, surface dose, radiation risk percentage, or EVA safety conclusion is shown. DONKI flare/CME/SEP entries describe observed solar activity; their presence does not measure effects at the Jezero crop. NASA's own [DONKI caveat](https://ccmc.gsfc.nasa.gov/tools/DONKI/) calls its information research/prototyping quality and identifies NOAA SWPC as the official forecast source. Static hosting remains intact; no backend or API credential was added.
