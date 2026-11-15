# Phase 9.1 route comparison audit

Generated from the bundled measured 80 × 60 CTX pack and all 30 authored missions with `node tools/audit_phase91_routes.mjs`. Distances and ascent are metres; maximum slope is the largest sampled adjacent-cell step in degrees. Shared percentage divides shared grid edges by the larger route edge count. “Meaningful” means at least 2° lower maximum sampled slope or at least 10 m lower ascent; this is a comparison threshold, not an EVA safety threshold.

**Summary:** 9/30 identical geometries; 21/30 different; 13/30 meet the descriptive threshold. SC-01 is the recommended comparison example. The slope cost is `length × (1 + 4 × (slope / 20°)²)`. It is illustrative and does not model traverse safety. Euclidean distance remains an admissible A* heuristic because each penalized edge costs at least its horizontal length. Many ties arise from 40 m sampling and similar neighboring slopes; no route is artificially separated.

| Mission | Shortest m | Terrain m | Shortest max ° | Terrain max ° | Shortest ascent m | Terrain ascent m | Shared edges | Identical | Meaningful |
|---|---:|---:|---:|---:|---:|---:|---:|:---:|:---:|
| EX-01 | 480.0 | 480.0 | 4.7 | 4.7 | 0.0 | 0.0 | 12 (100%) | Yes | No |
| EX-02 | 2646.2 | 2735.9 | 18.3 | 9.8 | 75.9 | 56.3 | 15 (29%) | No | Yes |
| EX-03 | 2440.0 | 2440.0 | 8.0 | 8.0 | 10.9 | 10.9 | 61 (100%) | Yes | No |
| EX-04 | 1800.0 | 1800.0 | 8.0 | 8.0 | 19.1 | 19.1 | 45 (100%) | Yes | No |
| EX-05 | 1561.7 | 1561.7 | 7.0 | 6.2 | 4.2 | 3.7 | 10 (31%) | No | No |
| EX-06 | 1866.3 | 1866.3 | 7.0 | 7.0 | 5.1 | 2.3 | 37 (82%) | No | No |
| EX-07 | 2026.8 | 2026.8 | 12.9 | 3.6 | 31.0 | 14.5 | 2 (5%) | No | Yes |
| EX-08 | 442.8 | 442.8 | 5.5 | 5.6 | 0.0 | 0.0 | 2 (22%) | No | No |
| EX-09 | 2553.6 | 2553.6 | 7.6 | 4.6 | 76.7 | 70.8 | 3 (6%) | No | Yes |
| EX-10 | 2065.1 | 2131.4 | 17.7 | 10.4 | 52.3 | 38.5 | 0 (0%) | No | Yes |
| SC-01 | 2200.0 | 2365.7 | 20.2 | 5.1 | 52.2 | 6.6 | 0 (0%) | No | Yes |
| SC-02 | 2200.0 | 2200.0 | 8.1 | 8.1 | 15.0 | 15.0 | 55 (100%) | Yes | No |
| SC-03 | 2080.0 | 2080.0 | 5.9 | 5.9 | 1.8 | 1.8 | 52 (100%) | Yes | No |
| SC-04 | 2080.0 | 2080.0 | 3.4 | 3.4 | 4.8 | 4.8 | 52 (100%) | Yes | No |
| SC-05 | 2530.2 | 2530.2 | 7.1 | 4.7 | 73.0 | 70.7 | 21 (42%) | No | Yes |
| SC-06 | 2483.3 | 2483.3 | 4.8 | 4.8 | 39.9 | 33.0 | 4 (8%) | No | No |
| SC-07 | 1720.0 | 1720.0 | 8.6 | 8.6 | 19.7 | 19.7 | 43 (100%) | Yes | No |
| SC-08 | 1720.0 | 1720.0 | 8.6 | 8.6 | 40.6 | 40.6 | 43 (100%) | Yes | No |
| SC-09 | 3222.7 | 3222.7 | 7.0 | 7.0 | 12.6 | 7.8 | 30 (47%) | No | No |
| SC-10 | 2862.3 | 2862.3 | 8.1 | 8.0 | 20.3 | 5.0 | 0 (0%) | No | Yes |
| CM-01 | 1761.7 | 1761.7 | 10.7 | 10.7 | 6.8 | 4.0 | 14 (38%) | No | No |
| CM-02 | 2532.5 | 2598.8 | 20.2 | 5.3 | 55.3 | 6.5 | 8 (13%) | No | Yes |
| CM-03 | 2629.1 | 2629.1 | 7.9 | 7.4 | 14.2 | 10.7 | 28 (45%) | No | No |
| CM-04 | 2880.0 | 2880.0 | 5.0 | 5.0 | 33.6 | 33.6 | 72 (100%) | Yes | No |
| CM-05 | 4036.5 | 4036.5 | 4.0 | 3.0 | 54.7 | 34.7 | 20 (23%) | No | Yes |
| CM-06 | 2774.2 | 2774.2 | 8.7 | 5.7 | 7.3 | 3.6 | 9 (15%) | No | Yes |
| CM-07 | 2143.9 | 2143.9 | 7.9 | 6.5 | 15.1 | 12.0 | 9 (21%) | No | No |
| CM-08 | 2397.6 | 2397.6 | 8.1 | 5.7 | 4.7 | 1.4 | 8 (16%) | No | Yes |
| CM-09 | 7329.7 | 7429.1 | 13.3 | 7.0 | 118.2 | 97.4 | 117 (64%) | No | Yes |
| CM-10 | 6910.8 | 6910.8 | 10.6 | 6.6 | 122.6 | 93.6 | 57 (35%) | No | Yes |

## Local performance sample

All 30 fixed-order missions (both modes) completed in 58.7 ms total on this machine. The expanded 160 × 120 trial from (24,24) to (140,96), both modes, took 8.2 ms median and 16.5 ms maximum across ten runs. These are local Node timings, not a browser/mobile performance guarantee. The previous Set-scanning and new heap implementations selected identical cells and metrics for every leg and mode in the 30-mission catalog in a one-off regression comparison; in that comparison, the old/new catalog times were 43.1/26.4 ms and expanded trial times were 24.4/17.5 ms. Timing varies with system load.
