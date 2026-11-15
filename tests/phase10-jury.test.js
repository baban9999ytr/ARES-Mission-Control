import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateMissionPack} from '../src/data/mission-pack.js';
import {validateMissionLibrary,planMission} from '../src/data/mission-library.js';
import {comparisonFacts,decisionExplanation} from '../src/data/route-comparison.js';
import {formatDonkiStatus} from '../src/data/donki.js';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const pack=validateMissionPack(JSON.parse(read('../public/data/mission-pack.json')));
const missions=validateMissionLibrary(JSON.parse(read('../data/scenarios/measured-missions.json')),pack);

test('SC-01 decision uses recomputed measured routes',()=>{
  const plan=planMission(pack,missions.find(m=>m.id==='SC-01'));
  const facts=comparisonFacts(plan.routes.distance,plan.routes.terrain,pack,plan.legs);
  assert.ok(Math.abs(facts.distanceDelta-165.6854)<.01);
  assert.ok(Math.abs(facts.distancePercent-7.5312)<.01);
  assert.ok(Math.abs(facts.slopeReduction-15.1074)<.01);
  assert.ok(Math.abs(facts.ascentReduction-45.639)<.01);
  assert.match(decisionExplanation(facts),/166 m \(7\.5%\).*15\.1°.*45\.6 m/);
  assert.match(decisionExplanation(facts,'tr'),/166 m \(7,5%\).*15,1°.*45,6 m/);
});

test('identical and unfavorable routes receive honest explanations',()=>{
  const route=planMission(pack,missions.find(m=>m.id==='SC-01')).routes.distance;
  assert.match(decisionExplanation(comparisonFacts(route,route,pack)),/same route/);
  assert.match(decisionExplanation({identical:false,distanceDelta:100,distancePercent:5,meaningful:false}),/without a meaningful/);
});

test('SC-05 equal-distance alternate geometry never reads as farther',()=>{
  const plan=planMission(pack,missions.find(m=>m.id==='SC-05'));
  const facts=comparisonFacts(plan.routes.distance,plan.routes.terrain,pack,plan.legs);
  assert.equal(facts.identical,false);
  assert.equal(facts.distanceDelta,0);
  assert.ok(facts.slopeReduction>2);
  for(const language of ['en','tr']){
    const text=decisionExplanation(facts,language);
    assert.doesNotMatch(text,/0 m|farther|longer|daha uzun/);
    assert.match(text,language==='tr'?/mesafesi aynı.*2,4°/:/same measured distance.*2\.4°/);
  }
});

test('EX-05 equal-distance small differences and SC-02 identical geometry have distinct messages',()=>{
  const facts=id=>{const plan=planMission(pack,missions.find(m=>m.id===id));return comparisonFacts(plan.routes.distance,plan.routes.terrain,pack,plan.legs);};
  const equal=facts('EX-05'),identical=facts('SC-02');
  assert.equal(equal.identical,false);assert.equal(equal.distanceDelta,0);assert.equal(equal.meaningful,false);
  assert.match(decisionExplanation(equal),/same measured distance.*small/);
  assert.equal(identical.identical,true);
  assert.match(decisionExplanation(identical),/selected the same route/);
});

test('SC-10 equal-distance ascent gain does not invent a 0.0 degree slope gain',()=>{
  const plan=planMission(pack,missions.find(m=>m.id==='SC-10'));
  const facts=comparisonFacts(plan.routes.distance,plan.routes.terrain,pack,plan.legs);
  assert.equal(facts.distanceDelta,0);
  assert.ok(facts.slopeReduction>0&&facts.slopeReduction<.05);
  assert.ok(facts.ascentReduction>10);
  assert.match(decisionExplanation(facts),/same maximum sampled step slope.*15\.3 m/);
  assert.doesNotMatch(decisionExplanation(facts),/0\.0°/);
});

test('stale and failed DONKI responses never claim successful retrieval',()=>{
  for(const status of ['stale','unavailable']){
    const result={status,startDate:'2026-11-08',endDate:'2026-11-15',retrievedAt:'2026-11-15T00:00:00Z',types:[],message:'Unavailable'};
    assert.match(formatDonkiStatus(result),/Attempted/);
    assert.doesNotMatch(formatDonkiStatus(result),/· Retrieved /);
    assert.match(formatDonkiStatus(result,'tr'),/Denendi/);
  }
});
