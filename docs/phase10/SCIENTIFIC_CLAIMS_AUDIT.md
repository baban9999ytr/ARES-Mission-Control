# Scientific claims and provenance audit

| User-facing information | Classification | Role and correction |
|---|---|---|
| MRO CTX optical imagery | Source-derived measured product | Visual terrain context; source and processing references are in `sources.html` and `docs/DATA_SOURCES.md` |
| CTX DEM elevations | Source-derived measured product | Sampled at 40 m route cell spacing; vertical reference comes from pack metadata |
| Route length, step slope and ascent | Computed from sampled DEM and grid geometry | Phase 10 summary uses `comparisonFacts` on live route objects; values are not an independent field measurement |
| Terrain-preferred cost | Illustrative engineering assumption | `C = L[1 + 4(θ/20°)^2]`; no certified slope threshold or safety probability |
| Permanent landmarks and 30 missions | Illustrative | Geographic examples on measured terrain, not verified named geological destinations |
| Science target catalog | Source-dependent candidate research metadata | A URL alone does not verify coordinate meaning; no current catalog point is eligible for routing |
| DONKI solar events | External contextual data | Not local Martian surface radiation or an optimization input; failed and stale attempts must not claim retrieval |
| Synthetic optical/elevation/thermal/hazard demo | Synthetic illustration | Separate `?mode=demo`; no measured thermal or hazard layer is claimed |
| Surface radiation dose, thermal field, rock/soil traversability, suit/health limits | Unavailable or unmodeled | No operational safety or astronaut suitability conclusion |

Search targets used in this audit: real, measured, synthetic, illustrative, verified, estimated, NASA, thermal, radiation, hazard, safe, and optimal across `index.html`, `sources.html`, `src/`, and documentation. The principal risky inference was that a lower sampled slope implied a safer traverse; current UI caveats explicitly reject that inference. The existing `missionStatus` phrase “verified measured-grid exercises” refers to grid validity, not verified science sites; the adjacent “Not named science sites” disclosure must remain visible. NASA-derived inputs do not imply NASA endorsement.
