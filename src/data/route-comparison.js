import {overlapCount,routeSegments} from './route-segments.js';

export function comparisonFacts(shortest,terrain,data,legs=[]){
  if(!shortest||!terrain)return null;
  const a=routeSegments(shortest,data,legs),b=routeSegments(terrain,data,legs);
  const shared=overlapCount(a,b);
  const identical=shortest.cells.length===terrain.cells.length&&shortest.cells.every((p,i)=>p.x===terrain.cells[i].x&&p.y===terrain.cells[i].y);
  const distanceDelta=terrain.meters-shortest.meters;
  const slopeReduction=shortest.maxSlope-terrain.maxSlope;
  const ascentReduction=shortest.ascending-terrain.ascending;
  const meaningful=slopeReduction>=2||ascentReduction>=10;
  return {identical,shared,sharedPercent:Math.round(shared/Math.max(a.length,b.length,1)*100),distanceDelta,slopeReduction,ascentReduction,meaningful};
}
