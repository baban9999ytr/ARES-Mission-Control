# Explainable route decision verification — 2026-11-15

## Scope and provenance

Implemented on isolated branch `feature/explainable-route-decision`, based on `feature/phase10-jury-readiness` at `1c4ced0`. The untracked pre-existing `docs/a` was left untouched. The repository README identifies Cloudflare Workers Static Assets as the live preview host. A read-only request on 2026-11-15 returned HTTP 200 and live `build-info.json` commit `600b8a1daea84b5d521b0061bd5fc1aa6d7e915d`; this branch was not deployed, pushed, or merged. The branch's release status is local only.

The CTX optical mosaic and DEM are USGS Astrogeology source products. Heights in the sampled pack are metres relative to the Mars 2020 IAU sphere (radius 3,396,190 m). Grid routes and calculations are derived from those DEM samples. The coefficient `w` in `L × [1 + w × (sampled step slope / 20°)²]` is an illustrative engineering assumption. The 20° term is a model scale, not a hazard threshold. Mission points are illustrative; `?mode=demo` remains synthetic. Local rocks, sand, small cliffs, lighting, communications, weather, radiation dose, suit limits, and verified science-site locations are unavailable or unmodeled.

## Implemented

- Route comparison facts include signed distance, percent, maximum sampled step slope, and ascent differences; identical geometry, equal length with different geometry, advantages, disadvantages, and unresolved trade-offs. Existing EN/TR decision text is retained, with an explicit trade-off statement.
- Two SVG profiles share horizontal distance and vertical elevation axes. Points are DEM samples at route-cell centres, joined by straight segments. Hover, keyboard focus, click, and touch selection inspect the corresponding map segment. No smoothing or invented height values are used.
- The terrain coefficient can be set to 0, 1, 2, 4 (default), or 8. The shortest path always minimizes geometric grid distance. The UI reports whether terrain path geometry changes versus default and updates both routes' displayed values. JSON exports remain and now include model assumptions.
- A printable EN/TR report contains mission/dataset identity, projected coordinates, CRS, source links, comparison values and explanation, both profiles, model assumptions, unknowns, and a non-operational disclaimer.

## Executed verification

- `npm test`: 73 Node tests passed. `npm run build` completed successfully.
- `node --test tests/explainable-decision.test.js`: 5 passed, including independent Dijkstra cost equality for all five coefficients on a no-data fixture and the measured CTX pack; shortest-distance geometry unchanged across coefficients.
- `npm run test:browser`: 13 Chromium Playwright tests passed, including mobile width 390 px, EN/TR profile behavior, coefficient controls, print popup, JSON download, and a custom mission JSON export/import round trip. Existing tablet and 320 px touch cases also passed.
- Earlier baseline run: 68 existing Node tests and 10 existing Playwright tests passed before additions.

## Deferred and release risks

No obstacle layer, weather-to-route model, dose estimate, overall safety score, verified science-target routing, uncertainty propagation, or operational traversability claim was added. The profile resolves only 40 m sampled routing cells and cannot reveal subcell hazards. Browser verification used Chromium and emulated touch; physical touch, screen-reader review, other browsers, and print output on physical paper remain unverified. The live preview has a different build ID; release requires an authorized deployment and post-deployment checks. No production submission or NASA endorsement is implied.
