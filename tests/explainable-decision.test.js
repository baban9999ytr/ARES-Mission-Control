import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planRoute,routeCost,SUPPORTED_SLOPE_WEIGHTS} from '../src/engine/routing.js';
import {comparisonFacts,tradeoffExplanation} from '../src/data/route-comparison.js';
import {profileData,profileSvg} from '../src/data/elevation-profile.js';
import {decisionReport} from '../src/data/decision-report.js';
import {buildBriefing} from '../src/data/briefing.js';

const pack=JSON.parse(fs.readFileSync(new URL('../public/data/mission-pack.json',import.meta.url)));
const blocked=(data,x,y)=>x<0||y<0||x>=data.gridWidth||y>=data.gridHeight||!Number.isFinite(data.heights[y*data.gridWidth+x]);
function dijkstra(data,start,goal,weight){
  const w=data.gridWidth,n=w*data.gridHeight,dist=Array(n).fill(Infinity),done=new Set();
  dist[start.y*w+start.x]=0;
  for(;;){let u=-1,best=Infinity;for(let i=0;i<n;i++)if(!done.has(i)&&dist[i]<best){u=i;best=dist[i];}if(u<0)return Infinity;if(u===goal.y*w+goal.x)return best;done.add(u);
    const x=u%w,y=Math.floor(u/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;
      if(blocked(data,nx,ny)||dx&&dy&&(blocked(data,x+dx,y)||blocked(data,x,y+dy)))continue;
      const v=best+routeCost(data,{x,y},{x:nx,y:ny},Math.hypot(dx,dy),'terrain',false,weight).cost;
      dist[ny*w+nx]=Math.min(dist[ny*w+nx],v);
    }
  }
}

test('every supported nonnegative coefficient agrees with independent Dijkstra; distance baseline stays fixed',()=>{
  const data={gridWidth:6,gridHeight:5,cellMeters:40,heights:[0,0,0,0,0,0,0,30,40,50,0,0,0,20,null,30,0,0,0,20,10,20,0,0,0,0,0,0,0,0]};
  const start={x:0,y:2},goal={x:5,y:2};
  const baseline=planRoute(data,start,goal,'distance',false);
  for(const weight of SUPPORTED_SLOPE_WEIGHTS){
    const terrain=planRoute(data,start,goal,'terrain',false,weight);
    assert.ok(Math.abs(terrain.totalCost-dijkstra(data,start,goal,weight))<1e-8);
    assert.deepEqual(planRoute(data,start,goal,'distance',false,weight).cells,baseline.cells);
  }
  assert.throws(()=>planRoute(data,start,goal,'terrain',false,-1),RangeError);
  assert.throws(()=>planRoute(data,start,goal,'terrain',false,3),RangeError);
});

test('measured CTX route costs also match independent Dijkstra for all supported weights',()=>{
  const start=pack.start,goal=pack.waypoints[0];
  const shortest=planRoute(pack,start,goal,'distance',false);
  for(const weight of SUPPORTED_SLOPE_WEIGHTS){
    const route=planRoute(pack,start,goal,'terrain',false,weight);
    assert.ok(Math.abs(route.totalCost-dijkstra(pack,start,goal,weight))<1e-8,`w=${weight}`);
    assert.deepEqual(planRoute(pack,start,goal,'distance',false,weight).cells,shortest.cells);
  }
});

test('comparison identifies same route, equal length alternate geometry, and opposing metrics',()=>{
  const data={gridWidth:3,gridHeight:3,cellMeters:1,heights:[0,0,0,0,1,0,0,0,0]};
  const a={cells:[{x:0,y:0},{x:1,y:1},{x:2,y:2}],meters:2*Math.SQRT2,maxSlope:10,ascending:1,mode:'distance'};
  const b={...a,cells:[{x:0,y:2},{x:1,y:1},{x:2,y:0}],maxSlope:5,ascending:2,mode:'terrain'};
  assert.equal(comparisonFacts(a,a,data).identical,true);
  const facts=comparisonFacts(a,b,data);
  assert.equal(facts.equalLengthDifferentGeometry,true);
  assert.ok(facts.advantages.includes('maximum sampled step slope'));
  assert.ok(facts.disadvantages.includes('total ascent'));
  assert.ok(facts.unresolved.includes('metrics favor different routes'));
  assert.match(tradeoffExplanation(facts),/opposing metrics do not establish a single best route/);
  assert.match(tradeoffExplanation(facts,'tr'),/tek bir nesnel çözümü yok/);
});

test('profile points use actual DEM heights and cumulative distance on common axes; no-data is unavailable',()=>{
  const data={gridWidth:3,gridHeight:1,cellMeters:40,heights:[-100,-90,-95],verticalReference:'test datum'};
  const route={cells:[{x:0,y:0},{x:1,y:0},{x:2,y:0}],meters:80,mode:'terrain'};
  const profile=profileData({distance:route,terrain:route},data);
  assert.equal(profile.maxDistance,80);assert.equal(profile.min,-100);assert.equal(profile.max,-90);
  const svg=profileSvg(profile);
  assert.match(svg,/points="50\.00,174\.00 375\.00,14\.00 700\.00,94\.00"/);
  assert.match(svg,/data-profile-index="1" tabindex="0"/);
  assert.equal(profileData({terrain:route},{...data,heights:[-100,null,-95]}),null);
});

test('print report cites data, model and unknowns while existing JSON briefing remains serializable',()=>{
  const distance=planRoute(pack,pack.start,pack.waypoints[0],'distance',false);
  const terrain=planRoute(pack,pack.start,pack.waypoints[0],'terrain',false);
  const routes={distance,terrain};
  for(const language of ['en','tr']){
    const html=decisionReport({data:pack,kind:'measured',start:pack.start,destination:pack.waypoints[0],routes,language});
    assert.match(html,/USGS Mars 2020 CTX archive/);assert.match(html,/Mars 2020 IAU sphere/);
    assert.match(html,/profile-line terrain/);assert.match(html,language==='tr'?/Operasyonel olmayan/:/Non-operational research prototype/);
  }
  assert.equal(JSON.parse(JSON.stringify(buildBriefing({data:pack,kind:'measured',start:pack.start,destination:pack.waypoints[0],mode:'terrain',hazards:false,routes}))).routes.terrainPreferred.plannedCells.length,terrain.cells.length);
});
