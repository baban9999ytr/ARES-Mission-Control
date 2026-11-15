import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateMissionPack,validateCompatibleRegion,mapDisplayCoordinates} from '../src/data/mission-pack.js';
import {JEZERO_LANDMARKS,eligibleLandmarks,projectedToCell,projectedToSvg} from '../src/data/landmarks.js';
import {planRoute} from '../src/engine/routing.js';
import {comparisonFacts} from '../src/data/route-comparison.js';
import {routePathsMarkup} from '../src/data/route-visualization.js';

const load=name=>validateMissionPack(JSON.parse(fs.readFileSync(new URL(`../public/data/${name}`,import.meta.url))));
const crop=load('mission-pack.json'),expanded=load('ctx-expanded-pack.json');

test('expanded measured grid covers four times the routeable area with independent registered layers',()=>{
  assert.equal(validateCompatibleRegion(crop,expanded,{west:4574000,south:1080000,east:4604000,north:1102500}),expanded);
  assert.equal(expanded.gridWidth,160);assert.equal(expanded.gridHeight,120);
  assert.equal(expanded.cellMeters,40);
  assert.equal(expanded.boundsMeters.east-expanded.boundsMeters.west,6400);
  assert.equal(expanded.boundsMeters.north-expanded.boundsMeters.south,4800);
  assert.equal(expanded.crsWkt,crop.crsWkt);
  assert.equal(expanded.quality.validCells,expanded.heights.filter(Number.isFinite).length);
  assert.equal(expanded.quality.validCells,19200);
  assert.notEqual(expanded.layers.optical.path,crop.layers.optical.path);
  assert.notEqual(expanded.layers.elevation.path,crop.layers.elevation.path);
  for(const layer of Object.values(expanded.layers))assert.ok(fs.existsSync(new URL(`../public/${layer.path}`,import.meta.url)));
});

test('permanent projected landmarks map back to the same positions in crop, sector and overview',()=>{
  assert.equal(JEZERO_LANDMARKS.length,5);
  for(const p of JEZERO_LANDMARKS){
    assert.equal(p.crs,'ESRI:103885');assert.equal(p.status,'illustrative');
    for(const pack of [crop,expanded]){
      const cell=projectedToCell(pack,p);
      assert.ok(cell,`${p.id} outside pack`);
      const q=mapDisplayCoordinates(pack,cell);
      assert.ok(Math.abs(q.east-p.east)<=20&&Math.abs(q.north-p.north)<=20);
      assert.ok(projectedToSvg(pack.boundsMeters,p));
    }
    assert.ok(projectedToSvg({west:4574000,south:1080000,east:4604000,north:1102500},p));
  }
  assert.equal(eligibleLandmarks(crop).length,5);
  assert.equal(eligibleLandmarks(expanded).length,5);
  assert.equal(projectedToCell(crop,{east:4590500,north:1092200}),null);
});

test('expanded sector routes on valid sampled cells and rejects missing terrain',()=>{
  const from={x:24,y:24},to={x:140,y:96};
  for(const mode of ['distance','terrain']){
    const r=planRoute(expanded,from,to,mode,false);
    assert.deepEqual(r.cells[0],from);assert.deepEqual(r.cells.at(-1),to);
    assert.ok(r.cells.every(p=>Number.isFinite(expanded.heights[p.y*expanded.gridWidth+p.x])));
    assert.ok(r.meters>=Math.hypot(to.x-from.x,to.y-from.y)*40);
  }
  const blocked={...expanded,heights:[...expanded.heights]};
  blocked.heights[to.y*expanded.gridWidth+to.x]=null;
  assert.equal(planRoute(blocked,from,to,'terrain',false),null);
});

test('comparison distinguishes true same-geometry routes and measured differences',()=>{
  const start=crop.start,same=planRoute(crop,start,start,'distance',false);
  assert.equal(comparisonFacts(same,same,crop).identical,true);
  const goal=crop.waypoints[0],a=planRoute(crop,start,goal,'distance',false),b=planRoute(crop,start,goal,'terrain',false);
  const facts=comparisonFacts(a,b,crop);
  assert.ok(facts.sharedPercent>=0&&facts.sharedPercent<=100);
  assert.ok(Math.abs(facts.distanceDelta-(b.meters-a.meters))<1e-9);
});

test('identical route geometry still renders two fixed-priority path elements',()=>{
  const identical={cells:[{x:1,y:1},{x:2,y:1}]};
  const routes={distance:identical,terrain:identical};
  const markup=routePathsMarkup(routes,{distance:true,terrain:true},true,()=> 'M1,1L2,1');
  assert.equal((markup.match(/<path /g)||[]).length,2);
  assert.ok(markup.indexOf('map-route shortest')<markup.indexOf('map-route terrain'));
  assert.ok(markup.includes('stroke-width="8"')&&markup.includes('stroke-width="5"'));
  assert.equal((markup.match(/d="M1,1L2,1"/g)||[]).length,2);
  assert.equal((routePathsMarkup(routes,{distance:false,terrain:true},true,()=> 'M1,1L2,1').match(/<path /g)||[]).length,1);
});
