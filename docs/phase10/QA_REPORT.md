# Phase 10 QA report

Baseline `npm run check`: 62 tests passed and the static build completed. After the jury UI changes, `npm run check` passed 66 tests (62 existing and 4 Phase 10) and built 42 files, 1,436,724 bytes. The Phase 10 regression tests cover measured SC-01 values, EN/TR explanation text, identical and unfavorable routes, static quick-launch wiring, and stale/failed DONKI wording.

Browser QA used the local dev server in an in-app Chromium browser. Turkish SC-01 launch showed the mission ID, both route toggles enabled, 100% zoom, and the computed “166 m (7,5%) / 15,1° / 45,6 m” summary. Browser DOM checks at 1440×900, 1280×720, 768×1024, 390×844 and 320×720 reported no document horizontal overflow. The tablet layout still puts comparison below the map. Physical touch hardware was unavailable. Full keyboard, export print formatting, English interaction sweep, and before/after screenshot artifacts were not completed in this increment.

The dev server on port 4173 was already running. A second `npm run dev` attempt returned `EADDRINUSE`; the existing server served the modified files and was used for browser QA.
