import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateMissionPack} from '../src/data/mission-pack.js';
import {validateMissionLibrary,planMission} from '../src/data/mission-library.js';
import {routeSegments} from '../src/data/route-segments.js';
import {buildElevationProfileSeries} from '../src/data/elevation-profile.js';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const pack=validateMissionPack(JSON.parse(read('../public/data/mission-pack.json')));
const missions=validateMissionLibrary(JSON.parse(read('../data/scenarios/measured-missions.json')),pack);

test('SC-01 elevation profile uses only measured DEM route-cell samples',()=>{
  const mission=missions.find(m=>m.id==='SC-01');
  const plan=planMission(pack,mission);
  assert.ok(plan);
  for(const mode of ['distance','terrain']){
    const segments=routeSegments(plan.routes[mode],pack,plan.legs);
    const series=buildElevationProfileSeries(plan.routes[mode],segments);
    assert.equal(series.length,segments.length+1);
    assert.equal(series[0].elevationMeters,segments[0].startElevation);
    assert.equal(series.at(-1).elevationMeters,segments.at(-1).endElevation);
    assert.deepEqual(series.map(p=>p.distanceMeters),[0,...segments.map(s=>s.cumulativeMeters)]);
    assert.deepEqual(series.map(p=>p.elevationMeters),[segments[0].startElevation,...segments.map(s=>s.endElevation)]);
  }
});

test('multi-stop missions keep leg boundaries in the profile samples',()=>{
  const mission=missions.find(m=>m.id==='CM-04');
  const plan=planMission(pack,mission);
  assert.ok(plan.legs.length>1);
  for(const mode of ['distance','terrain']){
    const segments=routeSegments(plan.routes[mode],pack,plan.legs);
    const boundaries=segments.filter((s,i)=>i===0||s.leg!==segments[i-1].leg);
    assert.equal(boundaries.length,plan.legs.length);
    assert.ok(boundaries.every(s=>Number.isInteger(s.leg)));
  }
});
