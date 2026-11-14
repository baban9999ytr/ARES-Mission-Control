import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planRoute} from '../src/engine/routing.js';
import {buildBriefing} from '../src/data/briefing.js';
const pack=JSON.parse(readFileSync(new URL('../public/data/mission-pack.json',import.meta.url)));
test('production briefing serializes actual measured route results and provenance',()=>{
  const start=pack.start,destination=pack.waypoints[0],routes={distance:planRoute(pack,start,destination,'distance',false),terrain:planRoute(pack,start,destination,'terrain',false)};
  const briefing=buildBriefing({data:pack,kind:'measured',start,destination,mode:'terrain',hazards:false,routes},'2026-11-14T12:00:00Z');
  assert.equal(briefing.dataset.kind,'measured');assert.equal(briefing.dataset.cellMeters,40);
  assert.equal(briefing.routes.shortest.distanceMeters,routes.distance.meters);
  assert.equal(briefing.routes.terrainPreferred.totalCost,routes.terrain.totalCost);
  assert.equal(briefing.syntheticHazardsEnabled,null);
  assert.match(JSON.stringify(briefing),/not verified safe/);
});
