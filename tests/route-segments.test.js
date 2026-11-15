import test from 'node:test';
import assert from 'node:assert/strict';
import {routeSegments,overlapCount} from '../src/data/route-segments.js';

test('route segment metrics use orthogonal and diagonal grid geometry',()=>{
  const data={gridWidth:3,gridHeight:2,cellMeters:40,heights:[-2410,-2405,-2400,-2409,-2404,-2397]};
  const route={mode:'terrain',cells:[{x:0,y:0},{x:1,y:0},{x:2,y:1}]};
  const segments=routeSegments(route,data,[{index:1,terrain:{cells:route.cells}}]);
  assert.equal(segments[0].lengthMeters,40);
  assert.equal(segments[0].endpointMeanElevation,-2407.5);
  assert.equal(segments[0].elevationChange,5);
  assert.ok(Math.abs(segments[0].slopeDegrees-7.125)<0.01);
  assert.ok(Math.abs(segments[1].lengthMeters-40*Math.SQRT2)<1e-8);
  assert.equal(segments[1].leg,1);
  assert.ok(Math.abs(segments[1].cumulativeMeters-40-40*Math.SQRT2)<1e-8);
  assert.equal(overlapCount(segments,routeSegments({mode:'distance',cells:route.cells},data)),2);
});
