# ARES Mission Control — independent QA field report

**Audit date:** 14 November 2026 (Europe/Istanbul)

**Release decision:** **CONDITIONAL GO** for a mouse-operated, desktop hackathon research demonstration. This is not approval for operational EVA navigation.

## 1. Executive summary and tested build

I tested the clean `feature/phase4-5-science-weather` branch at commit **`32fed15`** (`Integrate DONKI context and geographically gated science explorer`). Initial `git status -sb` showed no changes. I did not change production source or existing tests, switch branches, commit, push, merge, deploy, or restart a production service. The only repository additions from this audit are this report and `docs/screenshots/qa-field/` evidence.

The measured CTX planner, runtime A* routing, catalog coverage labels, synthetic-mode separation, live DONKI fetch, and export worked in executed desktop tests. Four browser criteria failed: keyboard-only map point placement, tablet access to route comparison while viewing the map, a misleading “Retrieved” timestamp after all DONKI requests fail, and the absence of an open/close control for Science Targets. The first two materially affect jury usability if a keyboard or tablet is used. Existing science warnings correctly avoid claiming safe EVA routes or measured Mars radiation.

## 2. Environment and scope

- Repository: `/home/krr/Projects/ARES-MISSION-CONTROL`; Node project version `0.2.0`, Node test runner and static build. The documented `npm run dev` process (`node tools/dev-server.js`) was already running at `http://localhost:4173/`; process and HTTP 200 were verified without restarting it.
- Browser: Chromium-backed in-app browser. Tested viewport dimensions were **1440 × 900**, **390 × 844**, **320 × 700**, and **768 × 1024**. Screenshot bitmaps exclude browser scrollbar/chrome pixels, so mobile files measure 375 × 812 and 305 × 667 respectively. Screenshots are real browser captures, saved as JPEG; filenames use `.jpg`.
- Local required assets returned HTTP 200: `/`, `/planner.css`, `/src/main.js`, `/src/data/donki.js`, `/public/data/mission-pack.json`, optical/elevation WebPs, and both science catalogs. The optical image rendered with `naturalWidth=1000`.
- Implemented: measured CTX and synthetic demo modes; optical/elevation measured layers; custom grid start/destination; two route costs; science research explorer; observed DONKI context; JSON briefing export.
- Research-only or unavailable: all named Jezero catalog routes on this crop, ten candidate EVA scenarios, measured thermal, local radiation dose, oxygen/communication/traction models, and certified safety thresholds.

## 3. Automated commands actually executed

| Command | Exit | Observed result | What it exercises |
| --- | ---: | --- | --- |
| `npm run check` | 0 | **24 passed, 0 failed, 0 skipped**; static build completed | Production JS routing, pack validation, map geometry, mode separation, catalog and DONKI modules, briefing; some fixture inputs. |
| `.venv/bin/python tools/test_raster_import.py` | 0 | Internal nodata-barrier fixture passed | Importer, registration/provenance and masked output fixture. |
| `.venv/bin/python tools/audit_ctx_rasters.py` | 0 | 36 source DEM samples; max absolute pack difference **0.0004375 m** after JSON rounding; 4800 valid crop cells | Actual local CTX optical/DEM GeoTIFFs and bundled pack. |
| `node tools/audit_ctx_routes.mjs` | 0 | A* and independent Dijkstra costs agreed; in-memory +1000 m cell changed path; partial barrier detoured **2230.782105 m**; complete barrier rejected | Bundled measured pack, production route module, independent reference algorithm. |
| `git diff --check` | 0 | No whitespace errors before audit report | Repository diff only. |

The previous `docs/PHASE5_QA_REPORT.md` was read as a claim to check, not accepted as this audit's result. Its 24-test count happened to be reproduced by the command above. The 36-cell comparison verifies importer consistency, not absolute DEM accuracy. The current crop contains no naturally missing DEM cell.

## 4. Browser test matrix

Each row has exactly one outcome. Evidence files are under `docs/screenshots/qa-field/`.

| Case | Outcome | Executed observation / evidence |
| --- | --- | --- |
| QA-01 initial loading and assets | **PASS** | Measured CTX default, 1000-pixel optical image, controls, provenance, 200s for required local assets, no unexpected console errors. [Desktop](docs/screenshots/qa-field/01-desktop-initial.jpg). |
| QA-02 zoom, pan, reset and alignment | **PASS** | 120% zoom; drag changed shared world pan to `70px, 40px`; clicking stage centre selected grid cell (34,26), displayed E **4,587,380 m**, N **1,092,340 m**. Inverse transform predicts the same cell. Reset restored 100%, 0px pan. [Zoom/pan](docs/screenshots/qa-field/02-zoom-pan-route.jpg). |
| QA-03a valid route selection | **PASS** | At 120%, start click selected (40,30), E 4,587,620/N 1,092,180 m; after pan, destination (34,26); both routes recalculated to 306 m for this pair. Mobile and tablet map clicks also recalculated. |
| QA-03b blocked destination through rendered UI | **BLOCKED** | The shipped crop has 4800/4800 valid cells; no rendered nodata destination is available. The production module and controlled-mask tests rejected blocked cells, but a browser UI rejection was not demonstrated. |
| QA-04 route comparison | **PASS** | Default endpoints: shortest **2.07 km, 17.7°, 52 m**; terrain preferred **2.13 km, 10.4°, 38 m**. Both use the same endpoints. Selecting Shortest changed `aria-pressed` and SVG emphasis. Elevation layer used `mars-elevation.webp`, `naturalWidth=1000`, with identical route geometry. [Elevation](docs/screenshots/qa-field/11-elevation-layer.jpg). |
| QA-05a science content and eligibility | **PASS** | Three Forks displayed submitted coordinate meaning, E/N projection and **Outside current map coverage**; Delta displayed **Location not available as a verified single point**; Bright Angel showed dated NASA rover-position evidence and outside coverage. Global Jezero was labeled research context only. Selecting records did not change the measured destination. [Coverage](docs/screenshots/qa-field/12-three-forks-coverage.jpg). |
| QA-05b Science Targets open/close | **FAIL** | The section is always expanded. There is no close/collapse control; see ARES-QA-004. |
| QA-06 live DONKI | **PASS** | Drawer opened and browser fetched a seven-day window. At **2026-11-14T18:59:05.337Z** it showed FLR **7**, CME **23**, SEP **0**; refresh at **18:59:06.388Z** retained correct counts. First visible event was CME at 14 Nov 2026 14:00 UTC with a CCMC source-record link. Separate read-only API probes returned HTTP **200**, `application/json`, CORS `*` for FLR/CME/SEP. Disclaimer says observations are not Mars surface dose or EVA safety. [Live drawer](docs/screenshots/qa-field/04-weather-live.jpg). |
| QA-07a controlled DONKI outage and recovery | **PASS** | A temporary copy of `dist/` under `/tmp/ares-qa-donki-offline-32fed15` redirected only the DONKI base to a nonexistent local path, giving 404 for all three types while local app assets remained available. Browser showed **unavailable**, zero event rows, and a working CTX route. Returning to the unmodified app and refreshing fetched 7/23/0 again at 18:59:54.924Z. [Outage](docs/screenshots/qa-field/05-weather-unavailable.jpg). This is a response-level test harness, not a change to production files or NASA connectivity. |
| QA-07b outage freshness wording | **FAIL** | The all-failed response still says `Retrieved 2026-11-14T18:59:45.631Z`; no event data was retrieved. See ARES-QA-003. |
| QA-08 mode switching | **PASS** | Repeated measured → demo → measured → demo → measured. Demo loaded `mars-demo-terrain.webp`, enabled synthetic thermal (`mars-demo-thermal.webp`) and labeled synthetic hazards. Measured returned to `mars-optical.webp`, disabled thermal as **Unavailable**, and hid hazard control. No console errors. [Synthetic thermal](docs/screenshots/qa-field/06-synthetic-thermal.jpg). |
| QA-09a viewport overflow | **PASS** | Browser `documentElement.scrollWidth` stayed below/equal viewport width at 1440, 390, 320 and 768. Map remained clickable at 320 and 768. [390](docs/screenshots/qa-field/07-mobile-390.jpg), [320](docs/screenshots/qa-field/08-mobile-320.jpg), [tablet](docs/screenshots/qa-field/09-tablet-768.jpg). |
| QA-09b tablet comparison visibility | **FAIL** | At 768 × 1024, analysis panel begins around document y=**1767 px**, below the tall left science panel; the route metrics are not visible beside the map. See ARES-QA-002. |
| QA-10a basic keyboard/accessibility | **PASS** | Buttons and select had accessibility names; focus indicator on map was a visible 3px blue outline. Enter opened the dataset dialog, Escape closed it, and focus returned to Details. Error/status text and source links were present. This is not a WCAG or screen-reader certification. |
| QA-10b keyboard map point placement | **FAIL** | Enter activated **Set start**, but Enter and Space on the focused map did not place a point or change E/N. See ARES-QA-001. [Focused map](docs/screenshots/qa-field/10-keyboard-map-focus.jpg). |
| QA-11 measured briefing export | **PASS** | Browser downloaded [briefing JSON](docs/screenshots/qa-field/briefing-measured.json). It identified `kind: measured`, 40 m cells, CTX source, default start (12,28), illustrative destination (57,12), shortest **2065.096679918781 m**, terrain **2131.370849898476 m**, `syntheticHazardsEnabled: null`, and an explicit safety warning. Display rounds these to 2.07/2.13 km. |

**Case totals: 11 PASS, 4 FAIL, 1 BLOCKED, 0 NOT TESTED (16 cases).**

## 5. Confirmed bugs and priorities

### ARES-QA-001 — Keyboard users cannot place a map point

**Severity:** High. **Environment:** Chromium in-app browser, 390 × 844, `32fed15`. **Preconditions:** Measured CTX loaded. **Steps:** (1) Focus **Set start** and press Enter. (2) Focus the map stage. (3) Press Enter or Space. **Expected:** A documented keyboard action places a valid routing point or an accessible coordinate selector is provided. **Actual:** `aria-pressed=true`, but feedback stays “Click a valid map cell,” start remains E 4,586,500/N 1,092,260 m, and no route changes. **Evidence:** [focused map screenshot](docs/screenshots/qa-field/10-keyboard-map-focus.jpg), browser DOM readings above. **Reproducibility:** Always in tested session. **Suggested fix:** Add keyboard grid navigation and an explicit confirm action, with live E/N and invalid-cell feedback; keep pointer behavior intact.

### ARES-QA-002 — Route comparison is far below the tablet map

**Severity:** Medium. **Environment:** Chromium in-app browser, 768 × 1024, `32fed15`. **Preconditions:** Default measured page. **Steps:** (1) Set 768 × 1024 viewport. (2) Load the page and inspect the first screen. **Expected:** Route metrics can be compared while viewing or immediately alongside the map. **Actual:** The left tool panel, expanded science catalog and grid layout set the analysis panel top to about y=1767 px. The first 1024px screen shows map and tool list but no comparison. **Evidence:** [tablet screenshot](docs/screenshots/qa-field/09-tablet-768.jpg), measured DOM rectangle. **Reproducibility:** Always at tested viewport. **Suggested fix:** At tablet widths, constrain/scroll the left panel independently, place route comparison immediately after the map, or collapse long research sections.

### ARES-QA-003 — Failed DONKI fetch is labeled “Retrieved”

**Severity:** Medium. **Environment:** Chromium in-app browser, isolated 1265 × 712 outage harness, `32fed15` production build. **Preconditions:** All three DONKI requests fail; local assets remain available. **Steps:** (1) Open Space Weather in the controlled outage harness. (2) Read status line. **Expected:** “Attempted at” or equivalent failure timestamp, no claim of retrieved data. **Actual:** Status correctly says unavailable and no substitution, then says `Retrieved 2026-11-14T18:59:45.631Z` with FLR/CME/SEP unavailable. **Evidence:** [outage screenshot](docs/screenshots/qa-field/05-weather-unavailable.jpg). **Reproducibility:** Always with all requests failed. **Suggested fix:** Separate request-attempt time from successful retrieval time; omit “Retrieved” on full failure.

### ARES-QA-004 — Science Targets cannot be collapsed

**Severity:** Low. **Environment:** Chromium in-app browser, desktop/tablet/mobile, `32fed15`. **Preconditions:** Page loaded. **Steps:** (1) Locate Science Targets. (2) Inspect section heading and controls. (3) Attempt to close it. **Expected:** QA brief's open/close interaction for a compact explorer. **Actual:** Section is permanently expanded; only catalog selection and item buttons exist. This contributes to the tablet panel height. **Evidence:** [tablet screenshot](docs/screenshots/qa-field/09-tablet-768.jpg) and [science panel screenshot](docs/screenshots/qa-field/03-three-forks-outside.jpg). **Reproducibility:** Always. **Suggested fix:** Use an accessible disclosure or tab while preserving target list and descriptions.

**Top three priorities:** (1) keyboard map selection, (2) tablet route-comparison layout, (3) failed-fetch freshness wording. At 320px, zoom buttons were about 27 × 35 px and several text links had about 16px line height. Larger touch targets are a usability improvement; no click failure was observed, so this is not counted as another confirmed bug.

## 6. Scientific accuracy and limitations

The optical and elevation display layers retained a common 1000px width and identical route SVG geometry when switched. Their numerical heights come from the 80 × 60 pack, with source GeoTIFF comparison recorded above. This does not prove local obstacle clearance, true within-cell slope, absolute elevation uncertainty or EVA suitability. The route engine uses an illustrative slope penalty, not a certified 15° cutoff. The in-memory nodata test does not create a nodata cell in the visible shipped crop. Catalog URLs and coordinate-type notes are research evidence; only the Bright Angel rover-position coordinate has an independently cross-checked primary NASA slide in the current implementation, and it is outside coverage. DONKI observed solar events are not Jezero radiation-dose measurements or safety predictions.

## 7. Five hard jury questions and factual answers

1. **How accurate is the elevation surface?** The pack matches the documented resampling of the local 20m CTX DEM at 36 checked grid cells to within 0.0004375m after JSON rounding. That is an import-consistency result, not a geodetic error bound. The route grid is 40m and can miss smaller terrain features.
2. **How do you know A* chooses the minimum for each model?** A separate Dijkstra implementation returned the same route cost for the tested endpoints and both edge-cost modes. The terrain mode's slope weight is illustrative, so model optimality does not establish operational safety.
3. **Could astronauts follow the displayed path?** No safety approval exists. Rocks, sand, cliffs below grid resolution, lighting, communications, life support, and uncertainty are outside this prototype.
4. **Why can I inspect Three Forks but not route there?** Its submitted Mars-projected point is north of the crop. The application correctly reports outside coverage and does not snap it to a fabricated cell. Three Forks' coordinate source is still submitted research, not independently authenticated in this audit.
5. **What happens when NASA DONKI is down?** The drawer showed unavailable and no fabricated events in a controlled failure. A wording bug still labels the attempt time “Retrieved”; this should be corrected before relying on that timestamp. Live probes during this audit returned 200/JSON with 7 FLR, 23 CME and 0 SEP records, but future availability is not guaranteed.

## 8. Tests not performed and human QA handoff

No physical phone/tablet, screen reader, cross-browser matrix, instrumented performance trace, independently calibrated DEM accuracy study, or actual on-crop nodata browser click was performed. The failure harness returned local 404 responses rather than intercepting the NASA host in the unmodified browser tab; recovery was verified against the unmodified app. Touch input was approximated with browser clicks at mobile viewports. The previously generated report's browser claims were not used as evidence for this field audit.

Human QA Officer checklist before the jury:

1. Open a fresh browser profile on the presentation machine; confirm the Measured CTX badge, optical map, 2.07/2.13km example comparison and thermal **Unavailable**.
2. Choose two points with a mouse or touch, verify coordinates and route change, then toggle route emphasis and elevation layer.
3. Scroll to Three Forks and Delta; show outside/no-single-point language. Do not claim a named science route.
4. Open Space Weather. Read its actual retrieval status and time aloud. If unavailable, do not narrate cached or synthetic events as live data; clarify the timestamp wording if bug ARES-QA-003 persists.
5. Use desktop width for the jury until ARES-QA-002 is fixed. Provide a mouse/touch method for point selection until ARES-QA-001 is fixed.
6. Keep the safety caveat visible; describe 40m sampling and illustrative slope cost. Confirm exported JSON is labeled measured and example waypoint illustrative.

**Final recommendation: CONDITIONAL GO.** The core measured-terrain research demonstration is reproducible with the tested desktop/mouse workflow. Fix or explicitly mitigate the four confirmed UI issues before claiming broader accessibility or tablet readiness. No findings imply the application is certified for real EVA planning.
