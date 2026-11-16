import { readFile, writeFile } from "node:fs/promises";
import { planRoute, isBlocked } from "../src/engine/routing.js";
import {
  validateMissionPack,
  mapDisplayCoordinates,
} from "../src/data/mission-pack.js";

const root = new URL("../", import.meta.url);
const missions = JSON.parse(
  await readFile(
    new URL("data/scenarios/measured-missions.json", root),
    "utf8",
  ),
);
const pack = validateMissionPack(
  JSON.parse(
    await readFile(new URL("public/data/mission-pack.json", root), "utf8"),
  ),
);
if (missions.schemaVersion !== 1 || missions.missions.length !== 30)
  throw new Error("Expected exactly 30 mission records");
const phases = new Map([
  ["Explorer", 0],
  ["Scientist", 0],
  ["Commander", 0],
]);
const ids = new Set();
const round = (n) => Number(n.toFixed(3));
const gridLocation = (p) => {
  const { east, north } = mapDisplayCoordinates(pack, p);
  return `(${p.x}, ${p.y}) [E ${Math.round(east)} m, N ${Math.round(north)} m]`;
};
const results = [];
for (const mission of missions.missions) {
  if (ids.has(mission.id) || !phases.has(mission.phase))
    throw new Error(`Duplicate or invalid scenario: ${mission.id}`);
  ids.add(mission.id);
  phases.set(mission.phase, phases.get(mission.phase) + 1);
  if (mission.stops.length < 2)
    throw new Error(`Not enough stops: ${mission.id}`);
  if (
    !mission.stops.every(
      (p) =>
        Number.isInteger(p.x) &&
        Number.isInteger(p.y) &&
        !isBlocked(pack, p.x, p.y, false),
    )
  )
    throw new Error(`Invalid/blocked grid point in ${mission.id}`);
  const legs = [];
  for (let i = 1; i < mission.stops.length; i++) {
    const start = mission.stops[i - 1],
      goal = mission.stops[i];
    const shortest = planRoute(pack, start, goal, "distance", false);
    const terrain = planRoute(pack, start, goal, "terrain", false);
    if (!shortest || !terrain)
      throw new Error(`No route for ${mission.id}, leg ${i}`);
    legs.push({ index: i, start, goal, shortest, terrain });
  }
  results.push({ mission, legs });
}
if ([...phases.values()].some((n) => n !== 10))
  throw new Error("Expected 10 missions per phase");
const lines = [
  "# ARES — 30 measured-grid mission scenarios",
  "",
  "Generated from `public/data/mission-pack.json` using the production `src/engine/routing.js` A* implementation. Re-run `node tools/generate_mission_results.mjs --write` after changing the pack or routing code. Figures are **model outputs**, not independent scientific validation. Grid points are illustrative, not authenticated Jezero science targets.",
  "",
  "**Data:** 80×60 grid at 40 m spacing. Crop E 4,586,000–4,589,200 m, N 1,091,000–1,093,400 m. Coordinates are cell centres in the Mars projected CRS, not Earth coordinates. A route segment may cross features unresolved by the 40 m grid.",
  "",
  "**Metrics:** Distance is grid path distance; maximum slope is maximum *adjacent-cell step* angle; ascent sums positive DEM height changes along the model path. Terrain-preferred adds an **illustrative** slope penalty. None establishes route safety, geological site identity, oxygen needs, communication feasibility or EVA duration.",
  "",
  "**Evidence:** This file is machine-generated route output, *not* proof of browser screenshots. Screenshot evidence must be captured separately using the app. Multi-leg Commander missions are multiple independent A* routes, not one native multi-stop optimization.",
  "",
];
for (const phase of ["Explorer", "Scientist", "Commander"]) {
  lines.push("", `## ${phase} — 10 missions`, "");
  for (const { mission: m, legs } of results.filter(
    (x) => x.mission.phase === phase,
  )) {
    const dist = (mode) => legs.reduce((n, l) => n + l[mode].meters, 0);
    const ascent = (mode) => legs.reduce((n, l) => n + l[mode].ascending, 0);
    const steep = (mode) => Math.max(...legs.map((l) => l[mode].maxSlope));
    lines.push(
      `### ${m.id}: ${m.title}`,
      "",
      m.objective,
      "",
      `**Question:** ${m.researchQuestion}`,
      "",
      `**Grid stops:** ${m.stops.map(gridLocation).join(" → ")}`,
      "",
      `**Computed totals:** Shortest ${round(dist("shortest"))} m, max step slope ${round(steep("shortest"))}°, ascent ${round(ascent("shortest"))} m. Terrain preferred ${round(dist("terrain"))} m, max step slope ${round(steep("terrain"))}°, ascent ${round(ascent("terrain"))} m.`,
      "",
      "| Leg | Shortest distance (m) | Terrain distance (m) | Shortest ascent (m) | Terrain ascent (m) |",
      "| --- | ---: | ---: | ---: | ---: |",
    );
    for (const l of legs)
      lines.push(
        `| ${l.index}: ${l.start.x},${l.start.y} → ${l.goal.x},${l.goal.y} | ${round(l.shortest.meters)} | ${round(l.terrain.meters)} | ${round(l.shortest.ascending)} | ${round(l.terrain.ascending)} |`,
      );
    lines.push(
      "",
      "**Limit:** Illustrative grid-based model exercise; no named source-verified field target at these cells.",
      "",
    );
  }
}
lines.push(
  "## Research notes",
  "",
  "- The catalog intentionally does not associate cells with Jezero Delta, Kodiak, Three Forks, Máaz, Séítah, Belva, Bright Angel or Enchanted Lake; currently submitted source coordinates are outside this pack or not point-defined.",
  "- Do not extrapolate outside the measured crop or infer boulder, traction, thermal, atmospheric, radiation or certified human safety conditions.",
  "- For qualitative interpretation compare both production modes at the same endpoints. Equal routes are legitimate, not a failed experiment.",
  "- Store human screenshots separately; this generator does not open a browser.",
  "",
  "## Provenance",
  "",
  "- Data: `public/data/mission-pack.json` and metadata/provenance therein.",
  "- Calculations: `src/engine/routing.js` (production A* cost and metrics).",
  "- Scenario definitions: `data/scenarios/measured-missions.json`.",
  "- Source and CRS descriptions: `IMPORT_REAL_DATA.md` and `docs/REALITY_CHECK.md`.",
  "",
);
const report = lines.join("\n");
if (process.argv.includes("--write")) {
  await writeFile(new URL("docs/MISSION_SCENARIO_CATALOG.md", root), report);
  console.log(
    "Wrote 30 calculated mission scenarios to docs/MISSION_SCENARIO_CATALOG.md",
  );
} else if (process.argv.includes("--check")) {
  const existing = await readFile(
    new URL("docs/MISSION_SCENARIO_CATALOG.md", root),
    "utf8",
  );
  if (existing !== report)
    throw new Error(
      "Mission catalog is out of date; run node tools/generate_mission_results.mjs --write",
    );
  console.log(
    "30 missions and generated markdown verified against production route engine",
  );
} else process.stdout.write(report);
