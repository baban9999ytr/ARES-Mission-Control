import terrain from './data/demo-terrain.json' with { type: 'json' };
import {planRoute} from './engine/routing.js';
import {validateMissionPack,mapDisplayCoordinates} from './data/mission-pack.js';
import {selectMissionData,layerForMode} from './data/mission-mode.js';

const $=(selector)=>document.querySelector(selector);
let WAYPOINTS=[
  {id:'delta', name:'Delta escarpment',type:'SEDIMENTARY STUDY',x:61,y:14,code:'SCI-01',desc:'Examine exposed layers in the ancient river delta. A scientifically interesting target inspired by actual Jezero geology; the demo waypoint is illustrative.'},
  {id:'rim', name:'Crater rim overlook',type:'GEOLOGICAL SURVEY',x:66,y:40,code:'SCI-02',desc:'Compare terrain morphology and investigate the transition toward the crater rim. Waypoint placement is illustrative.'},
  {id:'basin',name:'Ancient lakebed',type:'SAMPLE COLLECTION',x:43,y:47,code:'SCI-03',desc:'Observe layered sedimentary context and select a hypothetical sample objective. Waypoint placement is illustrative.'},
];
let START={x:13,y:29};
let activeTerrain=terrain;
let dataKind='demo';
const state={layer:'optical',destination:WAYPOINTS[0],mode:'terrain',hazards:true,route:null,alternate:null,zoom:1,eva:false,showRoute:true,missionClock:0};
const ICONS={
  radar:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 12 19 6"/>',
  layers:'<path d="m12 2-9 5 9 5 9-5-9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
  route:'<circle cx="6" cy="19" r="2"/><path d="M9 19h8a4 4 0 0 0 0-8H7a4 4 0 0 1 0-8h9"/><circle cx="18" cy="3" r="2"/>',
  mountain:'<path d="m8 3 4 8 3-4 7 13H2L8 3Z"/>',
  thermometer:'<path d="M14 14.76V5a3 3 0 0 0-6 0v9.76a5 5 0 1 0 6 0Z"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 7-5 1 3-7 5-1Z"/>',
  shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/>',
  crosshair:'<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  play:'<path d="m8 5 11 7-11 7V5Z"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  up:'<path d="m6 15 6-6 6 6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  external:'<path d="M13 5h6v6M19 5l-9 9M19 13v6H5V5h6"/>',
  flag:'<path d="M4 22V4m0 1c4-4 8 4 12 0v11c-4 4-8-4-12 0"/>',
  maximize:'<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"/>',
};
const htmlEscape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(name,size=18)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" stroke="currentColor" stroke-width="1.65" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.target}</svg>`;
const pos=p=>`${(p.x+.5)/activeTerrain.gridWidth*1000},${(p.y+.5)/activeTerrain.gridHeight*750}`;
const fmtM=m=>m>=1000?`${(m/1000).toFixed(2)} km`:`${Math.round(m)} m`;
const fmtDeg=d=>Number.isFinite(d)?`${d.toFixed(1)}°`:'—';
const waypointList=()=>WAYPOINTS.map((w,i)=>`<button class="waypoint ${state.destination.id===w.id?'active':''}" data-waypoint="${htmlEscape(w.id)}" aria-pressed="${state.destination.id===w.id}"><span class="waypoint-num">0${i+1}</span><span class="waypoint-copy"><span class="waypoint-title">${htmlEscape(w.name)}</span><span class="waypoint-type">${htmlEscape(w.type)}</span></span>${icon('chevron',15)}</button>`).join('');
const linePath=(route)=>route?.cells.map((p,i)=>`${i===0?'M':'L'} ${pos(p)}`).join(' ')||'';
const hazardSvg=()=>activeTerrain.hazards.map((h,i)=>`<g opacity="${state.hazards?.72:.25}"><circle cx="${(h.x+.5)/activeTerrain.gridWidth*1000}" cy="${(h.y+.5)/activeTerrain.gridHeight*750}" r="${h.radius/activeTerrain.gridWidth*1000}" fill="#D9674B" fill-opacity=".11" stroke="#F1936B" stroke-opacity=".75" stroke-width="1.2" stroke-dasharray="5 7"/><circle cx="${(h.x+.5)/activeTerrain.gridWidth*1000}" cy="${(h.y+.5)/activeTerrain.gridHeight*750}" r="3" fill="#F1936B"/><text x="${(h.x+.5)/activeTerrain.gridWidth*1000 + 10}" y="${(h.y+.5)/activeTerrain.gridHeight*750-10}" class="map-tiny" fill="#F2A17F">RISK ZONE ${String(i+1).padStart(2,'0')}</text></g>`).join('');
const waypointSvg=()=>WAYPOINTS.map((w,i)=>`<g class="waypoint-pin ${w.id===state.destination.id?'selected':''}" data-waypoint="${htmlEscape(w.id)}" transform="translate(${pos(w)})" role="button" tabindex="0" aria-label="Select ${htmlEscape(w.name)}"><circle r="22" fill="transparent"/><circle class="pin-halo" r="14" fill="none" stroke="#67E2DA" stroke-width="1" stroke-opacity="${w.id===state.destination.id?.9:.22}"/><circle r="5.5" fill="${w.id===state.destination.id?'#72F1DF':'#E9B987'}" stroke="#091017" stroke-width="2"/><text x="17" y="-11" class="pin-label">${htmlEscape(w.code)}</text></g>`).join('');
const noDataSvg=()=>{
 if(dataKind!=='measured')return '';
 const {gridWidth:w,gridHeight:h,heights}=activeTerrain;
 const boxes=[];
 for(let y=0;y<h;y++){
  for(let x=0;x<w;){
   if(heights[y*w+x]!==null){x++;continue;}
   const begin=x;while(x<w&&heights[y*w+x]===null)x++;
   boxes.push(`<rect x="${begin/w*1000}" y="${y/h*750}" width="${(x-begin)/w*1000}" height="${750/h}" fill="url(#unknownHatch)" stroke="#DCAA76" stroke-opacity=".18" stroke-width=".5"/>`);
  }
 }
 return boxes.join('');
};
const renderMap=()=>{
 const layerUrls={optical:'mars-demo-terrain.webp',elevation:'mars-demo-elevation.webp',thermal:'mars-demo-thermal.webp'};
 const packLayer=layerForMode(dataKind,activeTerrain,state.layer);
 const img=$('#terrainImage');
 const imagePath=dataKind==='measured'?(packLayer?`./public/${packLayer.path}`:null):`./public/${layerUrls[state.layer]}`;
 if(imagePath)img.src=imagePath;else img.removeAttribute('src');
 img.alt=packLayer?`${packLayer.label} · cropped registered raster; see source attribution`:dataKind==='measured'?'Unavailable measured raster layer':`Illustrative simulated ${state.layer} terrain image; not a NASA data product`;
 $('#mapLayerLabel').textContent=packLayer?packLayer.label.toUpperCase():dataKind==='measured'?'UNAVAILABLE':{optical:'SIMULATED ORBITAL-STYLE SURFACE',elevation:'SYNTHETIC ELEVATION RENDER',thermal:'SYNTHETIC THERMAL RENDER'}[state.layer];
 $('#mapSvg').innerHTML=`<defs><filter id="routeGlow"><feGaussianBlur stdDeviation="5" /></filter><pattern id="unknownHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#0b1119" fill-opacity=".46"/><line x1="0" y1="0" x2="0" y2="7" stroke="#DA9D6C" stroke-width="1.5" stroke-opacity=".4"/></pattern></defs><g class="map-nodata">${noDataSvg()}</g><g class="map-hazards">${hazardSvg()}</g>
 ${state.showRoute&&state.alternate?`<path d="${linePath(state.alternate)}" stroke="#E6AB70" stroke-width="2" opacity=".56" fill="none" stroke-dasharray="6 9" stroke-linejoin="round"/>`:''}
 ${state.showRoute&&state.route?`<path d="${linePath(state.route)}" stroke="#59E5D8" stroke-width="11" opacity=".20" filter="url(#routeGlow)" fill="none"/><path d="${linePath(state.route)}" stroke="#74F4E2" stroke-width="2.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`:''}
 <g transform="translate(${pos(START)})"><circle r="19" fill="#68DFD0" fill-opacity=".11" stroke="#83E7DD" stroke-width="1" stroke-dasharray="4 3"/><circle r="8" fill="#7BEADD" fill-opacity=".3"/><circle r="3.2" fill="#9DFEF2"/><text x="-16" y="-26" class="pin-label">${dataKind==='measured'?'START · ILLUSTRATIVE':'HAB-01'}</text></g>${waypointSvg()}`;
 $('#mapStage').style.setProperty('--zoom',state.zoom);
 $('#zoomPct').textContent=`${Math.round(state.zoom*100)}%`;
};
const renderStats=()=>{
 const r=state.route;$('#distanceValue').textContent=r?fmtM(r.meters):'—';
 $('#slopeValue').textContent=r?fmtDeg(r.maxSlope):'—';
 $('#ascentValue').textContent=r?`${Math.round(r.ascending)} m`:'—';
 $('#routeTag').textContent=r?(state.mode==='terrain'?'TERRAIN PREFERRED':'SHORTEST PATH'):'NOT CALCULATED';
 $('#routeTag').className=`route-tag ${r?'ready':''}`;
 $('#waypointName').textContent=state.destination.name;
 $('#waypointType').textContent=state.destination.type;
 $('#waypointDesc').textContent=state.destination.desc;
 $('#routeExplainer').textContent=r?(state.mode==='terrain'?
 (dataKind==='measured'?'A* weighs distance and measured DEM slope. Missing DEM cells are excluded. Candidate routes are not verified safe.':'A* weighs distance and simulated slope. Synthetic hazards are excluded when enabled.'):
 (dataKind==='measured'?'A* minimizes grid distance while avoiding missing DEM cells. No certified hazard assessment.':'A* minimizes grid distance while avoiding enabled synthetic hazards.')): 'No path exists through the available grid cells.';
 const alt=state.alternate;
 $('#compareSummary').textContent=r&&alt?(dataKind==='measured'?'Measured DEM · ':'Simulation · ')+`Alternative: ${fmtM(alt.meters)} · ${fmtDeg(alt.maxSlope)} max step slope`:'No alternative route available';
 $('#scientificNote').textContent=dataKind==='measured'?'Raster-derived prototype · Not validated for EVA safety':'Synthetic simulation · No operational safety assessment';
 $('#routeButton').innerHTML=`${icon('route',18)} Recalculate route <span>${icon('chevron',16)}</span>`;
 $('#evaDistance').textContent=r?fmtM(r.meters):'—';
 $('#evaTarget').textContent=state.destination.name;
 $('#evaSlope').textContent=r?fmtDeg(r.maxSlope):'—';
 $('#evaHeading').textContent=Math.round((Math.atan2(state.destination.x-START.x,START.y-state.destination.y)*180/Math.PI+360)%360).toString().padStart(3,'0')+'°';
};
function calculateRoute(){
 state.route=planRoute(activeTerrain,START,state.destination,state.mode,state.hazards);
 const altMode=state.mode==='terrain'?'distance':'terrain';
 state.alternate=planRoute(activeTerrain,START,state.destination,altMode,state.hazards);
 if(!state.route){toast('No route for this waypoint with the current demonstration hazard zones.');}
 renderMap();renderStats();
}
function setDestination(w){state.destination=w;$('#waypoints').innerHTML=waypointList(); calculateRoute();toast(`${htmlEscape(w.code)} selected · ${htmlEscape(w.name)}`);}
function setLayer(name){if(dataKind==='measured'&&!layerForMode(dataKind,activeTerrain,name))return;state.layer=name; document.querySelectorAll('[data-layer]').forEach(b=>{const active=b.dataset.layer===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});renderMap();toast(`Layer: ${name} · ${dataKind==='measured'?'source raster':'synthetic demonstration'}`);}
let toastTimer=0;
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('visible');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>el.classList.remove('visible'),3100);}
function renderMode(){document.body.classList.toggle('eva-active',state.eva);$('#evaButton').classList.toggle('active',state.eva);$('#evaButton').setAttribute('aria-pressed',String(state.eva));}
function attach(){
 $('#waypoints').addEventListener('click',e=>{const btn=e.target.closest('[data-waypoint]');if(btn){const w=WAYPOINTS.find(p=>p.id===btn.dataset.waypoint);if(w)setDestination(w);}});
 $('#mapSvg').addEventListener('click',e=>{const pin=e.target.closest('[data-waypoint]');if(pin){const w=WAYPOINTS.find(p=>p.id===pin.dataset.waypoint);if(w)setDestination(w);}});
 $('#mapSvg').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const pin=e.target.closest('[data-waypoint]');if(pin){e.preventDefault();const w=WAYPOINTS.find(p=>p.id===pin.dataset.waypoint);if(w)setDestination(w);}}});
 document.querySelectorAll('[data-layer]').forEach(b=>b.addEventListener('click',()=>setLayer(b.dataset.layer)));
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>{x.classList.toggle('active',x.dataset.mode===state.mode);x.setAttribute('aria-pressed',String(x.dataset.mode===state.mode));});calculateRoute();}));
 $('#hazardToggle').addEventListener('change',e=>{state.hazards=e.target.checked;calculateRoute();toast(state.hazards?'Synthetic hazards enabled':'Synthetic hazards disabled');});
 $('#routeToggle').addEventListener('change',e=>{state.showRoute=e.target.checked;renderMap();});
 $('#routeButton').addEventListener('click',()=>{calculateRoute();toast('Route recomputed using A*');});
 $('#evaButton').addEventListener('click',()=>{state.eva=!state.eva;renderMode();});
 $('#evaExit').addEventListener('click',()=>{state.eva=false;renderMode();});
 $('#zoomIn').addEventListener('click',()=>{state.zoom=Math.min(1.7,Math.round((state.zoom+.1)*10)/10);renderMap();});
 $('#zoomOut').addEventListener('click',()=>{state.zoom=Math.max(1,Math.round((state.zoom-.1)*10)/10);renderMap();});
 $('#mapStage').addEventListener('mousemove',e=>{
   const b=e.currentTarget.getBoundingClientRect();
   const xf=((e.clientX-b.left)/b.width-.5)/state.zoom+.5;
   const yf=((e.clientY-b.top)/b.height-.5)/state.zoom+.5;
   const x=Math.max(0,Math.min(activeTerrain.gridWidth-1,Math.floor(xf*activeTerrain.gridWidth)));
   const y=Math.max(0,Math.min(activeTerrain.gridHeight-1,Math.floor(yf*activeTerrain.gridHeight)));
   const projected=mapDisplayCoordinates({kind:dataKind,...activeTerrain},{x,y});
   $('#cursorCoordinates').textContent=projected?`E ${Math.round(projected.east)} m / N ${Math.round(projected.north)} m`:`GRID ${String(x).padStart(2,'0')} / ${String(y).padStart(2,'0')}`;
 });
 $('#briefingExport').addEventListener('click',exportBriefing);
 $('#datasetSwitch').addEventListener('click',()=>{const url=new URL(location.href);if(dataKind==='measured')url.searchParams.set('mode','demo');else url.searchParams.delete('mode');location.href=url.href;});
 $('#dataInspect').addEventListener('click',()=>$('#dataDialog').showModal());
 $('#dataClose').addEventListener('click',()=>$('#dataDialog').close());
 $('#fullscreenButton').addEventListener('click',()=>{const el=$('#mapStage');if(!document.fullscreenElement&&el.requestFullscreen)el.requestFullscreen().catch(()=>toast('Fullscreen unavailable'));else if(document.exitFullscreen)document.exitFullscreen();});
}
function exportBriefing(){
 const r=state.route,meta=activeTerrain;
 const briefing={
  title:'ARES Expedition Briefing',generatedAt:new Date().toISOString(),
  warning:'Research planning prototype only; not flight-validated and not for operational astronaut guidance.',
  dataset:{kind:dataKind,site:meta.site??'Synthetic Jezero illustration',crs:meta.crsWkt??null,
    bbox:meta.boundsMeters??null,cellMeters:meta.cellMeters??meta.demoCellMeters,
    verticalReference:meta.verticalReference??null,
    layers:meta.layers?Object.fromEntries(Object.entries(meta.layers).map(([key,v])=>[key,{source:v.source,label:v.label}])):null},
  destination:{...state.destination},origin:{...START},preference:state.mode,
  syntheticHazardsEnabled:dataKind==='demo'?state.hazards:null,
  route:r?{distanceMeters:r.meters,maximumSegmentSlopeDegrees:r.maxSlope,totalAscentMeters:r.ascending,
    plannedCells:r.cells,algorithm:'A* with configurable illustrative slope penalty'}:null,
  alternate:state.alternate?{distanceMeters:state.alternate.meters,maximumSegmentSlopeDegrees:state.alternate.maxSlope}:null,
 };
 const blob=new Blob([JSON.stringify(briefing,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='ARES-expedition-briefing.json';link.click();URL.revokeObjectURL(url);
 toast('Mission briefing exported · research prototype');
}
function applyDataPack(pack){
 activeTerrain=pack;dataKind='measured';
 START=pack.start;WAYPOINTS=pack.waypoints;
 state.destination=WAYPOINTS[0];state.layer='optical';state.hazards=false;
 $('#hazardToggle').checked=false;
 $('#hazardToggle').disabled=true;
 $('#hazardToggleLabel').textContent='No verified hazard zones';
 $('#dataCaution').textContent='Cropped, georeferenced source rasters. Waypoints are illustrative and do not imply a safe route.';
 $('#dataIntegrity').textContent=`Loaded ${pack.quality?.validCells??'—'} measured DEM cells · provenance in dataset card`;
 $('#mapWarning').textContent='RESEARCH RASTER · ROUTES NOT VERIFIED FOR EVA SAFETY';
 $('#dataTag').textContent='RASTER DATA';
 $('#scaleText').textContent=`1 GRID CELL ≈ ${Number(pack.cellMeters).toFixed(1)} m`;
 $('#slopeSource').textContent='SAMPLED DEM ELEVATION';
 $('#distanceSource').textContent='PROJECTED GRID METRES';
 $('#ascentSource').textContent='SAMPLED DEM ELEVATION';
 $('#dataStatus').textContent='REGISTERED RASTERS';
 $('#mapHeading').innerHTML='Jezero CTX <span>/ Mars</span>';
 $('#environmentLabel').textContent='MEASURED CTX STUDY CROP';
 $('#waypointLegend').lastChild.textContent=' ILLUSTRATIVE TARGET';
 $('#hazardLegend').hidden=true;
 $('#sectorLabel').textContent='MARS / JEZERO CTX CROP';
 $('#mapSvg').setAttribute('aria-label','Measured Jezero CTX optical and elevation map with illustrative waypoints and planned route');
 $('#layerCount').textContent=`${Object.keys(pack.layers).length.toString().padStart(2,'0')} AVAILABLE`;
 $('#datasetSwitch').hidden=false;
 $('#datasetSwitch').textContent='Switch to synthetic demo';
 $('#scienceProvenance').textContent='Imported raster datasets. Inspect the full URLs and coordinate information before trusting measurements.';
 $('#scienceAttribution').textContent=pack.site||'Mission sector';
 $('#sourceLink').href=pack.layers.optical.source;
 $('#sourceLink').textContent='CTX optical source ↗';
 $('#dataDialogText').textContent=JSON.stringify({kind:pack.kind,site:pack.site,notice:pack.notice,boundsMeters:pack.boundsMeters,
   cellMeters:pack.cellMeters,validCells:pack.quality?.validCells,verticalUnits:pack.verticalUnits,
   verticalReference:pack.verticalReference,sourceResolution:pack.quality?.sourceResolution,
   sources:Object.fromEntries(Object.entries(pack.layers).map(([k,v])=>[k,{label:v.label,source:v.source}]))},null,2);
 $('#waypoints').innerHTML=waypointList();
 document.querySelectorAll('[data-layer]').forEach(btn=>{const layer=layerForMode('measured',pack,btn.dataset.layer);btn.disabled=!layer;
    btn.querySelector('small').textContent=layer?(btn.dataset.layer==='thermal'?'Source thermal raster':'Registered raster'):'Unavailable';});
 calculateRoute();renderStats();
 toast('Registered source data pack loaded');
}
async function loadDataPack(){
 try{
  const res=await fetch('./public/data/mission-pack.json',{cache:'no-store'});
  if(!res.ok){if(res.status!==404)toast('Measured data pack not available; synthetic mode active');return;}
  const pack=validateMissionPack(await res.json());
  const selected=selectMissionData(terrain,pack,location.search);
  if(selected.kind==='demo'){
    $('#datasetSwitch').hidden=false;
    $('#datasetSwitch').textContent='Switch to measured CTX terrain';
    return;
  }
  applyDataPack(selected.terrain);
 }catch(err){console.warn('ARES retained synthetic fallback:',err);toast('Data pack invalid — keeping safe synthetic fallback');}
}
function start(){
 $('#waypoints').innerHTML=waypointList();
 $('#layerIcons').innerHTML=[['optical','layers','Optical','Orbital-style'],['elevation','mountain','Elevation','Synthetic DEM'],['thermal','thermometer','Thermal','Illustrative']].map(([id,ico,label,description])=>`<button class="layer-option ${id==='optical'?'active':''}" data-layer="${id}" aria-pressed="${id==='optical'}"><span class="layer-icon">${icon(ico,19)}</span><span><strong>${label}</strong><small>${description}</small></span><span class="layer-dot"></span></button>`).join('');
 attach(); // delegate newly created layer buttons
 calculateRoute();renderMode();loadDataPack();
}
start();
