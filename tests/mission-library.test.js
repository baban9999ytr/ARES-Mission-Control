import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import scenarios from '../data/scenarios/measured-missions.json' with {type:'json'};
import pack from '../public/data/mission-pack.json' with {type:'json'};
import demo from '../src/data/demo-terrain.json' with {type:'json'};
import {validateMissionLibrary,planMission,buildMissionReport} from '../src/data/mission-library.js';

test('Mission Library provides exactly 10 measured exercises per phase',()=>{
  const missions=validateMissionLibrary(scenarios,pack);
  assert.equal(missions.length,30);
  for(const phase of ['Explorer','Scientist','Commander']){
    assert.equal(missions.filter(m=>m.phase===phase).length,10);
  }
  assert.equal(new Set(missions.map(m=>m.id)).size,30);
});

test('The measured catalog must never be applied to synthetic terrain or changed geometry',()=>{
  assert.throws(()=>validateMissionLibrary(scenarios,demo));
  const wrong={...pack,cellMeters:100};
  assert.throws(()=>validateMissionLibrary(scenarios,wrong));
  const duplicate=structuredClone(scenarios);
  duplicate.missions[1].id=duplicate.missions[0].id;
  assert.throws(()=>validateMissionLibrary(duplicate,pack));
  const blocked=structuredClone(scenarios);
  blocked.missions[0].stops[1].x=-2;
  assert.throws(()=>validateMissionLibrary(blocked,pack));
});

test('Explorer route uses the production planner and preserves reported distances',()=>{
  const mission=validateMissionLibrary(scenarios,pack).find(m=>m.id==='EX-01');
  const plan=planMission(pack,mission);
  assert.ok(plan);
  assert.equal(plan.legs.length,1);
  assert.ok(Math.abs(plan.routes.distance.meters-480)<1e-6);
  assert.ok(Math.abs(plan.routes.terrain.meters-480)<1e-6);
  assert.deepEqual(plan.routes.terrain.cells.at(0),mission.stops[0]);
  assert.deepEqual(plan.routes.terrain.cells.at(-1),mission.stops.at(-1));
});

test('Commander route is a series of fixed-order independent legs, never a global tour',()=>{
  const mission=validateMissionLibrary(scenarios,pack).find(m=>m.id==='CM-04');
  const plan=planMission(pack,mission);
  assert.ok(plan);
  assert.equal(plan.legs.length,4);
  assert.deepEqual(mission.stops[0],mission.stops.at(-1));
  for(const mode of ['distance','terrain']){
    const total=plan.legs.reduce((sum,leg)=>sum+leg[mode].meters,0);
    const ascent=plan.legs.reduce((sum,leg)=>sum+leg[mode].ascending,0);
    assert.ok(Math.abs(total-plan.routes[mode].meters)<1e-7);
    assert.ok(Math.abs(ascent-plan.routes[mode].ascending)<1e-7);
    assert.equal(plan.routes[mode].maxSlope,Math.max(...plan.legs.map(leg=>leg[mode].maxSlope)));
    const points=plan.routes[mode].cells;
    assert.deepEqual(points[0],mission.stops[0]);
    assert.deepEqual(points.at(-1),mission.stops.at(-1));
    assert.ok(points.length>mission.stops.length);
  }
  const report=buildMissionReport(plan,pack,'terrain','2026-11-15T12:00:00.000Z');
  assert.equal(report.legs.length,4);
  assert.equal(report.mission.id,'CM-04');
  assert.match(report.methodology,/independent A\* legs/);
  assert.match(report.warning,/unverified/);
  assert.equal(report.selectedPreference,'terrain');
  assert.equal(report.totals.terrainPreferred.distanceMeters,plan.routes.terrain.meters);
  assert.deepEqual(report.mission.gridStops,mission.stops);
  assert.equal(report.generatedAt,'2026-11-15T12:00:00.000Z');
});

test('Planner and static build expose Mission Library without duplicating source catalog',async()=>{
  const root=new URL('../',import.meta.url);
  const [html,main,build]=await Promise.all(['index.html','src/main.js','tools/build.js'].map(name=>readFile(new URL(name,root),'utf8')));
  assert.match(html,/id="missionDrawer"/);
  assert.match(html,/id="missionSearch"/);
  assert.match(html,/id="missionSummary"/);
  assert.match(main,/data\/scenarios\/measured-missions\.json/);
  assert.match(main,/state\.activeMission/);
  assert.match(build,/data\/scenarios\/measured-missions\.json/);
  assert.match(main,/buildMissionReport/);
});
