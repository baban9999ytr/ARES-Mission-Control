# Official challenge alignment

Reviewed the [official 2026 Interplanetary Survival Guide: Martian Map Details tab](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/) on 15 November 2026. The objectives are paraphrased below; the page's examples and potential considerations are suggestions, not mandatory deliverables.

| Official objective or consideration | ARES evidence | Limitation | Status |
|---|---|---|---|
| Create a map, tool, or interface for a Mars surface exploration mission using NASA data and tools | Interactive Jezero CTX map with MRO imagery and DEM, A* routes, missions and local comparison | Research prototype, not an astronaut-use system | Partial |
| Layer data from NASA science missions to help navigate a location or route | Registered optical and elevation products are composited; catalog and DONKI appear as separate research context | Only DEM elevation enters routing. Multiple independently measured data kinds are not fused into the cost model | Partial |
| Identify a science goal and a suitable location | Thirty illustrative mission questions and a source-linked science catalog | Catalog targets are not verified as routeable points in current measured coverage | Partial |
| Consider three or more data kinds such as optical, thermal, spectral, topographic, atmospheric, radiation, or chemical | Measured optical and topographic products; DONKI solar events provide separate external context | This is a **suggestion**, not a stated minimum. Measured thermal, local radiation, soil and obstacle layers are unavailable. Synthetic thermal is demo-only | Partial |
| Consider information for crew safety, mobility, equipment, and obstacle avoidance | Sampled DEM slope and ascent alternatives, transparent model caveats | No verified local rock, soil, radiation, thermal, lighting, communications, suit or energy constraints; routes cannot certify safety | Partial |
| Consider a route map connecting science objectives while avoiding major obstacles | A* route map and fixed-order mission legs | No source-verified science destination in routeable coverage; small obstacles are unresolved by the 40 m grid | Partial |
| Format may be static or interactive, including habitat, tablet, HUD or other displays | Interactive workstation and responsive web page | No tested field tablet or helmet HUD implementation | Implemented as a web interface |

The challenge says teams **may consider** particular data kinds, formats, time frames and transportation scenarios. It does not state that all of them are required. This mapping distinguishes measured inputs, research context, and actual route optimization inputs. ARES does not claim NASA endorsement or operational Marswalk readiness. The separate team submission portal still needs a human check for project status and required artifacts.
