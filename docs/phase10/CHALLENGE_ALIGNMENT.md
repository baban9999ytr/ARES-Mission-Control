# Challenge alignment

Official challenge: [Interplanetary Survival Guide: Martian Map](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/). The full official page returned an inaccessible response during this audit. This matrix uses the challenge overview indexed by search and must be checked against the official portal before submission. No claim is made that all detailed deliverables have been verified.

| Challenge objective from overview | Current ARES capability and evidence | Limit | Status |
|---|---|---|---|
| Layered, integrated view of a Martian location or route | Registered CTX optical and DEM layers in `src/main.js`; measured pack metadata in `public/data/mission-pack.json` | One Jezero study area and expanded sector; regional overview is context only | Partial |
| Data from multiple NASA science missions | MRO CTX map products plus research catalog and DONKI context | Only CTX DEM measurements enter route optimization. DONKI is solar-event context, not local dose; science catalog does not supply routeable verified targets | Partial |
| Route and destination details for a human explorer | A* alternatives, sampled slope, ascent, segment inspection, 30 exercises and custom stops | Stops are illustrative and no operational traverse certification exists | Partial |
| Current conditions and practical Marswalk planning | DONKI displays external event records with availability status | No verified local thermal, radiation, weather, obstacles, soil, communications or suit data in the route model | Not implemented for operational planning |
| Science along the route | Source-linked Jezero and global catalogs | Catalog coordinates are outside coverage or not eligible; no source-confirmed science target is routeable | Partial |

Phase 10 improves the first-screen explanation and route decision summary. The mapped objectives are an interpretation of the accessible overview, not a verbatim transcription of the full official specification. Submission requirements and deadline remain a human portal check.
