import test from 'node:test';
import assert from 'node:assert/strict';
import pack from '../public/data/mission-pack.json' with {type:'json'};
import {validateMissionPack} from '../src/data/mission-pack.js';
import {isBlocked,planRoute,slopeDegrees} from '../src/engine/routing.js';

test('bundled CTX pack routes on measured cells with consistent distance and slope',()=>{
  validateMissionPack(pack);
  assert.equal(pack.quality.validCells,pack.heights.filter(Number.isFinite).length);
  const distance=planRoute(pack,pack.start,pack.waypoints[0],'distance',false);
  const terrain=planRoute(pack,pack.start,pack.waypoints[0],'terrain',false);
  assert.ok(distance&&terrain);
  for(const route of [distance,terrain]){
    assert.ok(route.cells.every(p=>!isBlocked(pack,p.x,p.y,false)));
    let meters=0,maxSlope=0,ascent=0;
    for(let i=1;i<route.cells.length;i++){
      const a=route.cells[i-1],b=route.cells[i];
      const run=Math.hypot(a.x-b.x,a.y-b.y)*pack.cellMeters;
      const rise=pack.heights[b.y*pack.gridWidth+b.x]-pack.heights[a.y*pack.gridWidth+a.x];
      meters+=run;maxSlope=Math.max(maxSlope,slopeDegrees(0,rise,run));ascent+=Math.max(0,rise);
    }
    assert.ok(Math.abs(route.meters-meters)<1e-7);
    assert.ok(Math.abs(route.maxSlope-maxSlope)<1e-10);
    assert.ok(Math.abs(route.ascending-ascent)<1e-7);
  }
  assert.ok(distance.meters<terrain.meters);
  assert.ok(terrain.maxSlope<distance.maxSlope);
});

test('missing DEM cells are rejected even in shortest-path mode',()=>{
  const modified={...pack,heights:[...pack.heights]};
  const target=pack.waypoints[0];
  modified.heights[target.y*pack.gridWidth+target.x]=null;
  assert.equal(isBlocked(modified,target.x,target.y,false),true);
  assert.equal(planRoute(modified,pack.start,target,'distance',false),null);
  assert.throws(()=>validateMissionPack(modified));
});

test('an internal nodata barrier forces a detour and cannot be crossed',()=>{
  const modified={...pack,heights:[...pack.heights]};
  const baseline=planRoute(pack,pack.start,pack.waypoints[0],'distance',false);
  for(let y=8;y<50;y++)modified.heights[y*pack.gridWidth+35]=null;
  const detour=planRoute(modified,pack.start,pack.waypoints[0],'distance',false);
  assert.ok(detour);
  assert.ok(detour.meters>baseline.meters);
  assert.ok(detour.cells.every(p=>!isBlocked(modified,p.x,p.y,false)));
  assert.ok(detour.cells.every(p=>p.x!==35||p.y<8||p.y>=50));
  for(let y=0;y<pack.gridHeight;y++)modified.heights[y*pack.gridWidth+35]=null;
  assert.equal(planRoute(modified,pack.start,pack.waypoints[0],'distance',false),null);
});
