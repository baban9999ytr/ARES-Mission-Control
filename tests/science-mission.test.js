import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createScienceMission,editCustomMission,serializeCustomMission,parseCustomMission,createCustomMission} from '../src/data/mission-builder.js';
import {planMission} from '../src/data/mission-library.js';
import {comparisonFacts} from '../src/data/route-comparison.js';

const pack=JSON.parse(readFileSync(new URL('../public/data/mission-pack.json',import.meta.url)));
const catalog=JSON.parse(readFileSync(new URL('../data/scenarios/measured-missions.json',import.meta.url)));
const example=catalog.missions.find(m=>m.id==='SC-01');

test('science mission plans measured outbound and return legs and sums actual route metrics',()=>{
  const mission=createScienceMission(pack,example.stops[0],example.stops[1]);
  assert.deepEqual(mission.stops[0],mission.stops.at(-1));
  const plan=planMission(pack,mission);
  assert.equal(plan.legs.length,2);
  assert.deepEqual(plan.legs[1].from,mission.stops[1]);
  assert.deepEqual(plan.legs[1].to,mission.stops[0]);
  for(const mode of ['distance','terrain']){
    assert.ok(Math.abs(plan.routes[mode].meters-plan.legs.reduce((sum,leg)=>sum+leg[mode].meters,0))<1e-8);
    assert.ok(Math.abs(plan.routes[mode].ascending-plan.legs.reduce((sum,leg)=>sum+leg[mode].ascending,0))<1e-8);
    assert.equal(plan.routes[mode].maxSlope,Math.max(...plan.legs.map(leg=>leg[mode].maxSlope)));
  }
  const facts=comparisonFacts(plan.routes.distance,plan.routes.terrain,pack,plan.legs);
  assert.ok(facts.distanceDelta>0);assert.ok(facts.slopeReduction>0);
  for(const weight of [0,1,2,4,8]){
    const weighted=planMission(pack,mission,weight);
    assert.deepEqual(weighted.legs.at(-1).to,mission.stops[0]);
    assert.ok(Math.abs(weighted.routes.terrain.meters-weighted.legs.reduce((sum,leg)=>sum+leg.terrain.meters,0))<1e-8);
    if(weight===0)assert.equal(weighted.routes.terrain.meters,weighted.routes.distance.meters);
  }
});

test('base movement keeps return endpoint synchronized, while science stops remain editable',()=>{
  let mission=createScienceMission(pack,example.stops[0],example.stops[1]);
  mission=editCustomMission(mission,{type:'move',index:0,point:{x:13,y:10}},pack);
  assert.deepEqual(mission.stops[0],mission.stops.at(-1));
  mission=editCustomMission(mission,{type:'add',point:{x:48,y:18}},pack);
  assert.equal(mission.stops.length,4);
  assert.deepEqual(mission.stops.at(-1),mission.stops[0]);
  mission=editCustomMission(mission,{type:'activity',index:2,activityType:'imaging',description:'Panorama from illustrative cell'},pack);
  mission=editCustomMission(mission,{type:'reorder',index:2,to:1},pack);
  assert.equal(mission.stops[1].activityType,'imaging');
  assert.match(mission.stops[1].description,/Panorama/);
  assert.throws(()=>editCustomMission(mission,{type:'remove',index:0},pack),/base/i);
  assert.throws(()=>editCustomMission(mission,{type:'reorder',index:0,to:1},pack),/Base/);
});

test('science blueprint round-trips in existing JSON kind; legacy custom mission remains compatible',()=>{
  const mission=createScienceMission(pack,example.stops[0],example.stops[1]);
  const saved=serializeCustomMission(mission,pack);
  assert.equal(saved.kind,'ares-custom-mission');assert.equal(saved.scienceMission,true);
  assert.deepEqual(parseCustomMission(JSON.parse(JSON.stringify(saved)),pack).stops,mission.stops);
  const legacy=createCustomMission(pack);
  assert.equal(serializeCustomMission(legacy,pack).scienceMission,undefined);
  assert.equal(parseCustomMission(serializeCustomMission(legacy,pack),pack).scienceMission,undefined);
  assert.throws(()=>parseCustomMission({...saved,stops:[saved.stops[0],saved.stops[1],{x:13,y:11}]},pack),/return to base/i);
});
