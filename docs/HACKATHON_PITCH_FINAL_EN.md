# ARES — three-minute English jury pitch

**0:00–0:35 — The problem**

Planning a route on Mars requires more than drawing a line on an image. A terrain image, an elevation model, a proposed science destination, and space-weather reports answer different questions. If those sources are combined carelessly, a research prototype can make an uncertain route look operationally safe. ARES makes those distinctions visible while demonstrating a real terrain calculation.

**0:35–1:30 — Demonstrate the measured map**

This is a 3.2 by 2.4 kilometre study crop at Jezero Crater, processed from a Mars Reconnaissance Orbiter CTX optical mosaic and digital terrain model. The source pixels are 6 metres for imagery and 20 metres for elevation. Our planner samples the DEM on an 80 by 60 grid, with 40-metre cells. I choose a start and destination directly on the registered map. The two routes are computed from that measured height array at runtime. The shortest route minimizes grid distance; the terrain-preferred route adds an illustrative penalty for steeper sampled steps. For the example points, the display shows about 2.07 kilometres and 17.7 degrees maximum sampled step slope for shortest, versus 2.13 kilometres and 10.4 degrees for terrain preferred. Neither is certified safe.

**1:30–2:10 — Show why the route is real**

We independently compared A* against Dijkstra using the same edge costs. The costs matched. In a controlled in-memory experiment, raising one DEM cell changed the selected path. A nodata barrier caused a detour; a complete barrier made the route unavailable. We independently checked 36 sampled elevation cells against the original GeoTIFF. The original NASA data files were not changed.

**2:10–2:40 — Science and solar context**

The Science Targets explorer keeps global Mars research separate from Jezero locations. The named Jezero records in the submitted catalog either have no single verified point or lie outside this small crop; we show their evidence and coverage status without inventing a route. The Space Weather drawer queries NASA CCMC DONKI for observed solar flare, CME and SEP events, with UTC timestamps and retrieval time. Those events do not measure radiation dose on the surface at Jezero.

**2:40–3:00 — Honest next step**

ARES is a reproducible research demonstration for comparing routes on measured Martian terrain. To support real mission decisions, it would need wider verified coverage, local obstacle and material maps, environmental models, uncertainty propagation and formal operational validation. Today we show exactly what is measured, modeled, illustrative and unavailable.
