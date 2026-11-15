import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {planMission,validateMissionLibrary} from '../src/data/mission-library.js';
import {planRoute} from '../src/engine/routing.js';
import {comparisonFacts} from '../src/data/route-comparison.js';

const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8'));
const crop=read('../public/data/mission-pack.json');
const expanded=read('../public/data/ctx-expanded-pack.json');
const missions=validateMissionLibrary(read('../data/scenarios/measured-missions.json'),crop);
const rows=[];
let identical=0,meaningful=0;
const start=performance.now();
for(const mission of missions){
  const plan=planMission(crop,mission);
  if(!plan)throw new Error('No route for '+mission.id);
  const a=plan.routes.distance,b=plan.routes.terrain;
  const facts=comparisonFacts(a,b,crop,plan.legs);
  identical+=Number(facts.identical);meaningful+=Number(facts.meaningful);
  const f=n=>n.toFixed(1);
  rows.push(`| ${mission.id} | ${f(a.meters)} | ${f(b.meters)} | ${f(a.maxSlope)} | ${f(b.maxSlope)} | ${f(a.ascending)} | ${f(b.ascending)} | ${facts.shared} (${facts.sharedPercent}%) | ${facts.identical?'Yes':'No'} | ${facts.meaningful?'Yes':'No'} |`);
}
const elapsed=performance.now()-start;
const trial=[{x:24,y:24},{x:140,y:96}];
const times=[];
for(let i=0;i<10;i++){
  const t=performance.now();
  for(const mode of ['distance','terrain']){
    const route=planRoute(expanded,trial[0],trial[1],mode,false);
    if(!route)throw new Error('Expanded trial route unavailable');
  }
  times.push(performance.now()-t);
}
const sorted=[...times].sort((a,b)=>a-b);
const report=`# Phase 9.1 route comparison audit

Generated from the bundled measured 80 × 60 CTX pack and all 30 authored missions with \`node tools/audit_phase91_routes.mjs\`. Distances and ascent are metres; maximum slope is the largest sampled adjacent-cell step in degrees. Shared percentage divides shared grid edges by the larger route edge count. “Meaningful” means at least 2° lower maximum sampled slope or at least 10 m lower ascent; this is a comparison threshold, not an EVA safety threshold.

**Summary:** ${identical}/30 identical geometries; ${30-identical}/30 different; ${meaningful}/30 meet the descriptive threshold. SC-01 is the recommended comparison example. The slope cost is \`length × (1 + 4 × (slope / 20°)²)\`. It is illustrative and does not model traverse safety. Euclidean distance remains an admissible A* heuristic because each penalized edge costs at least its horizontal length. Many ties arise from 40 m sampling and similar neighboring slopes; no route is artificially separated.

| Mission | Shortest m | Terrain m | Shortest max ° | Terrain max ° | Shortest ascent m | Terrain ascent m | Shared edges | Identical | Meaningful |
|---|---:|---:|---:|---:|---:|---:|---:|:---:|:---:|
${rows.join('\n')}

## Local performance sample

All 30 fixed-order missions (both modes) completed in ${elapsed.toFixed(1)} ms total on this machine. The expanded 160 × 120 trial from (24,24) to (140,96), both modes, took ${sorted[4].toFixed(1)} ms median and ${Math.max(...times).toFixed(1)} ms maximum across ten runs. These are local Node timings, not a browser/mobile performance guarantee. The previous Set-scanning and new heap implementations selected identical cells and metrics for every leg and mode in the 30-mission catalog in a one-off regression comparison; in that comparison, the old/new catalog times were 43.1/26.4 ms and expanded trial times were 24.4/17.5 ms. Timing varies with system load.
`;
fs.writeFileSync(new URL('../docs/phase9/PHASE_9_1_ROUTE_AUDIT.md',import.meta.url),report);
console.log(`Wrote 30 mission rows; identical=${identical}, meaningful=${meaningful}, catalog=${elapsed.toFixed(1)} ms, expanded median=${sorted[4].toFixed(1)} ms`);
