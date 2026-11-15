import {cellIndex, slopeDegrees} from '../engine/routing.js';

/** Measurements between the same sampled grid-cell centres used by the router. */
export function routeSegments(route, data, legs = []) {
  if (!route) return [];
  const boundaries = [];
  let last = 0;
  for (const leg of legs) {
    last += leg[route.mode].cells.length - 1;
    boundaries.push({end:last,index:leg.index});
  }
  const result = [];
  let cumulativeMeters = 0;
  for (let i = 1; i < route.cells.length; i++) {
    const from = route.cells[i-1], to = route.cells[i];
    const lengthMeters = Math.hypot(to.x-from.x,to.y-from.y)*(data.cellMeters??data.demoCellMeters);
    const startElevation = data.heights[cellIndex(from.x,from.y,data.gridWidth)];
    const endElevation = data.heights[cellIndex(to.x,to.y,data.gridWidth)];
    const elevationChange = endElevation-startElevation;
    cumulativeMeters += lengthMeters;
    result.push({number:i,mode:route.mode,from,to,lengthMeters,startElevation,endElevation,
      endpointMeanElevation:(startElevation+endElevation)/2,elevationChange,
      slopeDegrees:slopeDegrees(startElevation,endElevation,lengthMeters),cumulativeMeters,
      leg:boundaries.find(boundary=>i<=boundary.end)?.index??null});
  }
  return result;
}

export function overlapCount(a,b){
  if (!a?.length || !b?.length) return 0;
  const edge = s => [s.from,s.to].map(p=>`${p.x},${p.y}`).sort().join('|');
  const seen = new Set(a.map(edge));
  return b.reduce((count,segment)=>count+Number(seen.has(edge(segment))),0);
}
