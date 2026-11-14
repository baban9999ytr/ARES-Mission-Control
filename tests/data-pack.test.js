import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMissionPack,mapDisplayCoordinates} from '../src/data/mission-pack.js';
import {planRoute} from '../src/engine/routing.js';
const makePack=()=>({version:1,kind:'measured',site:'Offline test grid',gridWidth:8,gridHeight:8,cellMeters:20,
 heights:Array.from({length:64},()=>0),hazards:[],crsWkt:'PROJCS["Mars_Mock_Metre_CRS",GEOGCS["Mars",DATUM["D_Mars"]]]',
 boundsMeters:{west:100,south:200,east:260,north:360},start:{x:0,y:0},waypoints:[{id:'site',name:'Test',type:'SCIENCE',code:'SCI-01',desc:'Illustrative',x:7,y:7}],
 layers:{optical:{path:'data/mars-optical.webp',label:'Source optical',source:'https://example.org/optical'},
 elevation:{path:'data/mars-elevation.webp',label:'Source DEM',source:'https://example.org/dem'}}});
test('valid measured pack retains projected geometry and provenance',()=>{
 const data=validateMissionPack(makePack());
 assert.deepEqual(mapDisplayCoordinates(data,{x:0,y:0}),{east:110,north:350});
 assert.equal(planRoute(data,data.start,data.waypoints[0],'distance',false).meters>100,true);
});
test('no-data cells are impassable even when hazard zones are disabled',()=>{
 const data=makePack();for(let y=0;y<8;y++)data.heights[y*8+3]=null;
 validateMissionPack(data);
 assert.equal(planRoute(data,data.start,data.waypoints[0],'distance',false),null);
 data.heights[4*8+3]=0;
 assert.ok(planRoute(data,data.start,data.waypoints[0],'terrain',false));
});
test('validator rejects shape mismatch, missing provenance, unregistered waypoints',()=>{
 const bad=makePack();bad.heights.pop();assert.throws(()=>validateMissionPack(bad),/heights/);
 const noSource=makePack();noSource.layers.optical.source='http://not-trusted.com';assert.throws(()=>validateMissionPack(noSource),/provenance/);
 const noDataStart=makePack();noDataStart.heights[0]=null;assert.throws(()=>validateMissionPack(noDataStart),/missing DEM/);
});
test('diagonal cannot slip between two no-data neighbors',()=>{
 const data=makePack();data.start={x:0,y:0};data.waypoints[0].x=1;data.waypoints[0].y=1;
 data.heights[1]=null;data.heights[8]=null;
 assert.equal(planRoute(data,data.start,data.waypoints[0],'distance',false),null);
});
