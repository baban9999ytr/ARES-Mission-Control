# Explainable route # ARES MISSION CONTROL — PHASE 11
## Science Mission Mode + Complete Main Integration

You are the senior software engineer, scientific software reviewer, QA lead and release engineer for ARES Mission Control, our NASA Space Apps Challenge 2026 project.

**Repository:** `/home/krr/Projects/ARES-MISSION-CONTROL`

**GitHub:** `baban9999ytr/ARES-Mission-Control`

**Production:** https://spcapps.openstacktool.com/

**Deadline:** November 15, 2026, 22:00 Europe/Istanbul.

## PRIMARY OBJECTIVE

Complete and integrate the existing improvements, build a focused **Science Mission Mode**, verify everything, and deliver the completed, tested code to the remote `main` branch.

This is an explicitly authorized request to commit, push, merge and deploy our project changes, provided all release gates pass.

Do not force-push, discard unrelated work, bypass failing tests or overwrite conflicting code.

The final result must be a functional, scientifically credible NASA hackathon submission, not a collection of unfinished features.

---

## PHASE A — RECONCILE EXISTING WORK

Before writing new code:

1. Inspect the complete Git status, all local branches, remote references, open PRs and relevant commits.
2. Fetch the latest remote changes.
3. Review `main`, `feature/phase10-jury-readiness`, `feature/explainable-route-decision` and any additional relevant feature branches.
4. Inspect GitHub PR #15, which currently has merge conflicts.
5. Identify improvements already present in `main`, particularly the independently developed elevation profile.
6. Preserve the best verified implementation of each feature.
7. Preserve the unrelated `docs/a` and all unrelated local changes.
8. Reconcile conflicting implementations without duplicate code, duplicate controls, or lost functionality.

Create an integration branch from the latest `origin/main`.

Merge or selectively incorporate the verified changes using the approach that best preserves history and functionality.

Never use destructive resets or force pushes to bypass conflicts.

Before continuing, verify that the existing measured CTX datasets, mission library, custom mission builder, landmark system, EN/TR interface, exports and routing functionality still work.

## PHASE B — BUILD SCIENCE MISSION MODE

### The goal

ARES must evolve from a route comparison prototype into an explainable, research-oriented Mars science mission planner.

A mission should answer:

- Where does the explorer start?
- Which scientific stop or stops are planned?
- Why were these stops selected?
- How can the explorer reach them?
- How can the explorer return to the starting point?
- What terrain trade-offs exist?
- Which evidence supports the plan?
- What important risks remain unknown?

### B1. Mission workflow

Implement a clear mission lifecycle:

**BASE → SCIENCE STOP(S) → BASE**

Allow users to:

- Select the starting point.
- Add one or more scientific activity stops.
- Assign an objective or description to each stop.
- Reorder the stops.
- Calculate outbound and return legs.
- Compare shortest and terrain-preferred routes.
- Review total mission distance, cumulative ascent and sampled slope statistics.
- Save and restore the mission.

Reuse the existing mission builder, route engine and JSON formats wherever possible.

Do not create a second incompatible mission planning system.

### B2. Science objectives

Provide understandable objective types such as:

- Geological observation
- Surface imaging
- Terrain survey
- Sample collection planning
- Environmental observation

These represent mission-planning activities, not a claim that a verified scientific site or instrument has been identified.

All user-defined or illustrative sites must be clearly labeled.

Investigate whether at least one real NASA-documented science target can be independently verified within the currently supported measured terrain footprint.

If a valid target is available, document its source, coordinate interpretation, CRS transformation and map coverage before enabling route planning.

If no target qualifies, do not fabricate one or move a known target into the crop.

### B3. Return-to-base reasoning

Calculate each mission leg independently using the existing routing engine.

Display the outbound and return routes clearly.

Calculate total mission distance, cumulative ascent, maximum sampled step slope and relevant route trade-offs.

Ensure returning to base is part of the mission plan rather than a decorative line.

Do not claim oxygen sufficiency, astronaut survival probability or operational return safety.

### B4. Explainable decisions

Preserve the existing explainable route decision implementation.

Every comparison must derive explanations from actual calculated values.

Include:

- Distance difference
- Sampled slope difference
- Elevation gain difference
- Geometry changes
- Equal-distance cases
- Trade-offs
- Model sensitivity

Preserve the existing terrain cost coefficient options:

`w = 0, 1, 2, 4, 8`

The 20-degree denominator in the existing formula is a modeling scale, not an operational hazard limit.

Avoid unsupported safety scores and universal route recommendations.

## PHASE C — MISSION EVIDENCE PANEL

Create a compact, elegant evidence panel using four categories:

**MEASURED**
NASA/USGS-derived optical and elevation data.

**CALCULATED**
A* routes, grid distances, derived ascent and sampled step slopes.

**MODELED**
Terrain cost coefficients, illustrative assumptions and sensitivity analysis.

**UNKNOWN**
Sub-grid rocks, sand, cliffs, lighting, weather, local radiation dose, communications, suit limitations and other unverified operational hazards.

The panel should make scientific provenance immediately understandable to a judge.

Include source links, acquisition or processing metadata where available, DEM spacing, vertical reference, coordinate system and coverage.

Do not use decorative numerical confidence percentages without a defensible uncertainty model.

## PHASE D — JURY DEMONSTRATION MODE

Create a one-click demonstration that reliably loads a compelling measured-data mission.

The complete demonstration must show:

1. A real Mars terrain dataset.
2. A science-mission objective.
3. Outbound and return planning.
4. Two route alternatives.
5. A genuine calculated terrain trade-off.
6. Interactive elevation profiles.
7. A clear decision explanation.
8. A human-readable report.

Prefer an existing verified scenario with visibly different route choices.

Do not invent distances or choose fake results to make the demonstration look impressive.

Keep presentation mode optional and nondestructive.

The user must be able to exit it and continue their previous work.

## PHASE E — USER EXPERIENCE

Maintain the existing professional visual design.

Use restrained aerospace mission-control styling.

Avoid excessive neon effects, unnecessary animation, generic AI-generated promotional text, and cluttered dashboards.

Prioritize:

- Fast first interaction
- Readable mission explanation
- Visible route comparison
- Clearly labeled science stops
- Intuitive map controls
- Excellent desktop experience
- Functional mobile layout
- English and Turkish parity
- Keyboard accessibility

The final interface should feel like a real scientific research tool.

## PHASE F — SCIENTIFIC VALIDATION

Preserve all existing data provenance and safety disclaimers.

The project is not a certified EVA navigation system.

Never invent:

- Radiation dose
- Surface temperature measurements
- Oxygen consumption or reserve
- Communication coverage
- Ground traction
- Hazard locations
- Verified scientific sites
- NASA mission approval

Test route computations against the existing independent Dijkstra reference.

Validate:

- Total multi-leg distance
- Return-leg correctness
- Route geometry
- Elevation profile values
- No-data handling
- Changing mission stops
- Saving and restoring missions
- Terrain coefficient changes
- Equal-distance and conflicting-metric cases

## PHASE G — QA AND RELEASE

Execute:

`npm test`

`npm run build`

`npm run test:browser`

Also execute any relevant dataset, routing and import verification utilities.

Fix all regressions introduced by this integration.

Run browser checks at desktop, tablet and mobile widths.

Verify both English and Turkish.

Check printable reports and JSON exports.

Check that the compiled application contains no sensitive files.

Do not alter scientific input data silently.

### Integration and Git requirements

After verification:

1. Commit the integration work with meaningful messages.
2. Push the integration branch.
3. Open or update the appropriate GitHub pull request.
4. Confirm that the intended changes are included and existing `main` changes are preserved.
5. Merge into `main` only when GitHub reports the PR mergeable and required checks pass.
6. Do not bypass branch protection.
7. Fetch and verify the final remote `main` commit.
8. Deploy the verified release to the configured Cloudflare Workers production environment, provided the existing deployment credentials and configuration permit it.
9. Verify the deployed `build-info.json` matches the intended commit.
10. Verify the live site actually serves the new features.

If a release gate fails, stop before the unsafe operation, document the blocker, and preserve the work in a reviewable branch or PR.

No force pushes and no destructive shortcuts.

## PHASE H — FINAL DELIVERABLE

Return a factual completion report with:

- Implemented features
- Reused and reconciled features
- Scientific limitations
- Node test results
- Playwright test results
- Integration branch
- PR URL and status
- Final remote `main` commit SHA, if merged
- Production build SHA, if deployed
- Live verification outcome
- Remaining blockers

Clearly distinguish completed, tested, merged and deployed.

Do not claim a feature is live simply because it exists locally.

## FINAL PRODUCT MESSAGE

ARES does not merely draw paths on Mars.

It helps researchers construct science missions, compare terrain-dependent route choices, explain their engineering assumptions, and understand the evidence and limitations behind each decision.

**Prioritize a complete, tested, deployable experience over adding unnecessary features.**decision verification — 2026-11-15

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
