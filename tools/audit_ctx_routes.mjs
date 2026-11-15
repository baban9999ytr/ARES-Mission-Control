import fs from 'node:fs';
import assert from 'node:assert/strict';
import {planRoute} from '../src/engine/routing.js';
const p=JSON.parse(fs.readFileSync(new URL('../public/data/mission-pack.json',import.meta.url),'utf8'));
const W=p.gridWidth,H=p.gridHeight,cm=p.cellMeters,idx=(x,y)=>y*W+x;
const blocked=(a,x,y)=>x<0||y<0||x>=W||y>=H||a.heights[idx(x,y)]===null;
function edge(a,x,y,nx,ny,mode){const run=Math.hypot(nx-x,ny-y)*cm;const rise=a.heights[idx(nx,ny)]-a.heights[idx(x,y)];const slope=Math.atan2(Math.abs(rise),run)*180/Math.PI;return {run,rise,slope,cost:run*(mode==='terrain'?1+4*(slope/20)**2:1)}}
function metrics(a,path,mode){let meters=0,maxSlope=0,ascent=0,cost=0;for(let i=1;i<path.length;i++){const q=edge(a,path[i-1].x,path[i-1].y,path[i].x,path[i].y,mode);meters+=q.run;maxSlope=Math.max(maxSlope,q.slope);ascent+=Math.max(0,q.rise);cost+=q.cost}return {meters,maxSlope,ascent,cost}}
function dijkstra(a,start,goal,mode){const dist=new Float64Array(W*H).fill(Infinity),done=new Uint8Array(W*H);dist[idx(start.x,start.y)]=0;for(let n=0;n<W*H;n++){let u=-1,best=Infinity;for(let i=0;i<dist.length;i++)if(!done[i]&&dist[i]<best){best=dist[i];u=i}if(u<0)break;if(u===idx(goal.x,goal.y))return best;done[u]=1;const x=u%W,y=Math.floor(u/W);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(blocked(a,nx,ny)||dx&&dy&&(blocked(a,x+dx,y)||blocked(a,x,y+dy)))continue;const j=idx(nx,ny),v=best+edge(a,x,y,nx,ny,mode).cost;if(v<dist[j])dist[j]=v}}return Infinity}
const start=p.start,goal=p.waypoints[0];
const original=planRoute(p,start,goal,'terrain',false),short=planRoute(p,start,goal,'distance',false);
const chosen=original.cells[Math.floor(original.cells.length/2)];const changed={...p,heights:[...p.heights]};changed.heights[idx(chosen.x,chosen.y)]+=1000;const reroute=planRoute(changed,start,goal,'terrain',false);
const barrier={...p,heights:[...p.heights]};for(let y=8;y<50;y++)barrier.heights[idx(35,y)]=null;const detour=planRoute(barrier,start,goal,'distance',false);for(let y=0;y<H;y++)barrier.heights[idx(35,y)]=null;const rejected=planRoute(barrier,start,goal,'distance',false);
for(const [label,a,mode,route] of [['shortest',p,'distance',short],['terrain',p,'terrain',original],['modified-terrain',changed,'terrain',reroute]]){const independent=metrics(a,route.cells,mode),reference=dijkstra(a,start,goal,mode);for(const [key,actual] of [['meters',route.meters],['maxSlope',route.maxSlope],['ascent',route.ascending],['cost',route.totalCost]])assert.ok(Math.abs(actual-independent[key])<1e-8,`${label} ${key} mismatch`);assert.ok(Math.abs(route.totalCost-reference)<1e-8,`${label} Dijkstra mismatch`);console.log(label,JSON.stringify({cells:route.cells.length,first:route.cells[0],last:route.cells.at(-1),app:{meters:route.meters,maxSlope:route.maxSlope,ascent:route.ascending,cost:route.totalCost},independent,referenceCost:reference,costDifference:route.totalCost-reference}))}
assert.ok(JSON.stringify(original.cells)!==JSON.stringify(reroute.cells));
assert.ok(!reroute.cells.some(c=>c.x===chosen.x&&c.y===chosen.y));
assert.ok(detour&&!detour.cells.some(c=>c.x===35&&c.y>=8&&c.y<50));
assert.equal(rejected,null); 
console.log('controlled_change',JSON.stringify({raisedCell:chosen,originalPathUsesCell:original.cells.some(c=>c.x===chosen.x&&c.y===chosen.y),newPathUsesCell:reroute.cells.some(c=>c.x===chosen.x&&c.y===chosen.y),pathChanged:JSON.stringify(original.cells)!==JSON.stringify(reroute.cells)}));
console.log('nodata',JSON.stringify({partialBarrierDetourMeters:detour?.meters,partialRouteCrossesBarrier:detour?.cells.some(c=>c.x===35&&c.y>=8&&c.y<50),completeBarrierRejected:rejected===null}));
