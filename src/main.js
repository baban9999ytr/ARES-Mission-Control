import demo from './data/demo-terrain.json' with {type:'json'};
import {planRoute,isBlocked} from './engine/routing.js';
import {clientPointToCell,clampPan,cellToSvg,stepKeyboardCell} from './engine/map-grid.js';
import {validateMissionPack,mapDisplayCoordinates} from './data/mission-pack.js';
import {selectMissionData,layerForMode} from './data/mission-mode.js';
import {validateScienceCatalog,scienceCoverage,coordinateEvidence} from './data/science-catalog.js';
import {fetchDonki,formatDonkiStatus} from './data/donki.js';
import {buildBriefing} from './data/briefing.js';

const $=s=>document.querySelector(s);
const DEMO_WAYPOINTS=[
  {id:'delta',name:'Delta escarpment',type:'Illustrative study target',x:61,y:14,code:'EX-01',desc:'Example point on the synthetic map.'},
  {id:'rim',name:'Crater rim overlook',type:'Illustrative study target',x:66,y:40,code:'EX-02',desc:'Example point on the synthetic map.'},
  {id:'basin',name:'Ancient lakebed',type:'Illustrative study target',x:43,y:47,code:'EX-03',desc:'Example point on the synthetic map.'},
];
const state={data:demo,kind:'demo',waypoints:DEMO_WAYPOINTS,start:{x:13,y:29},destination:DEMO_WAYPOINTS[0],presetId:'delta',layer:'optical',mode:'terrain',pick:null,keyboardCell:null,hazards:true,showRoutes:true,routes:{distance:null,terrain:null},zoom:1,panX:0,panY:0,eva:false};
const research={catalogs:{jezero:null,global:null},scope:'jezero',selected:null,weatherLoaded:false};
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDistance=m=>m>=1000?`${(m/1000).toFixed(2)} km`:`${Math.round(m)} m`;
const fmtSlope=d=>`${d.toFixed(1)}°`;
const signed=(n,digits=0)=>`${n>=0?'+':''}${n.toFixed(digits)}`;
const svgPoint=p=>cellToSvg(p,state.data.gridWidth,state.data.gridHeight);
function coordinates(p){if(state.kind==='demo')return `Grid ${p.x}, ${p.y}`;const q=mapDisplayCoordinates(state.data,p);return `E ${Math.round(q.east)} m · N ${Math.round(q.north)} m`;}
function announce(message,error=false){$('#pointFeedback').textContent=message;$('#pointFeedback').classList.toggle('error',error);}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),2500);}
function linePath(route){return route?.cells.map((p,i)=>{const q=svgPoint(p);return `${i?'L':'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`}).join(' ')||'';}
function marker(point,letter,kind){const q=svgPoint(point);return `<g class="map-marker ${kind}" transform="translate(${q.x},${q.y})"><circle r="14"/><text y="1">${letter}</text></g>`;}
function calculateRoutes(){const hazard=state.kind==='demo'&&state.hazards;state.routes.distance=planRoute(state.data,state.start,state.destination,'distance',hazard);state.routes.terrain=planRoute(state.data,state.start,state.destination,'terrain',hazard);renderMap();renderComparison();}
function renderMap(){
  const d=state.data;const stage=$('#mapStage');const world=$('#mapWorld');
  world.style.setProperty('--zoom',state.zoom);world.style.setProperty('--pan-x',`${state.panX}px`);world.style.setProperty('--pan-y',`${state.panY}px`);
  const layer=layerForMode(state.kind,d,state.layer);const demoFiles={optical:'mars-demo-terrain.webp',elevation:'mars-demo-elevation.webp',thermal:'mars-demo-thermal.webp'};
  const src=state.kind==='measured'?(layer?`./public/${layer.path}`:null):`./public/${demoFiles[state.layer]}`;
  if(src)$('#terrainImage').src=src;else $('#terrainImage').removeAttribute('src');
  $('#terrainImage').alt=state.kind==='measured'?`${layer?.label??'Unavailable'} · CTX crop`:`Synthetic ${state.layer} illustration`;
  $('#mapLayerLabel').textContent=state.kind==='measured'?(layer?.label??'Unavailable'):(state.layer==='thermal'?'Synthetic thermal illustration':`Synthetic ${state.layer} illustration`);
  const paths=['distance','terrain'].filter(mode=>state.routes[mode]);
  paths.sort((a,b)=>a===state.mode?1:b===state.mode?-1:0);
  let svg='<defs><pattern id="unknown" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#15242d"/><path d="M0 0V6" stroke="#bdbdbd" stroke-width="2"/></pattern></defs>';
  if(state.kind==='measured')for(let y=0;y<d.gridHeight;y++)for(let x=0;x<d.gridWidth;x++)if(d.heights[y*d.gridWidth+x]===null)svg+=`<rect x="${x/d.gridWidth*1000}" y="${y/d.gridHeight*750}" width="${1000/d.gridWidth}" height="${750/d.gridHeight}" fill="url(#unknown)"/>`;
  if(state.kind==='demo'&&state.hazards)for(const h of d.hazards)svg+=`<circle class="hazard-cell" cx="${(h.x+.5)/d.gridWidth*1000}" cy="${(h.y+.5)/d.gridHeight*750}" r="${h.radius/d.gridWidth*1000}"/>`;
  if(state.showRoutes)for(const mode of paths)svg+=`<path class="map-route ${mode}${mode===state.mode?'':' secondary'}" d="${linePath(state.routes[mode])}" stroke-width="${mode===state.mode?4:2.6}"/>`;
  for(const p of state.waypoints){if(p.x===state.destination.x&&p.y===state.destination.y)continue;const q=svgPoint(p);svg+=`<g class="map-waypoint"><circle cx="${q.x}" cy="${q.y}" r="5"/><text x="${q.x+9}" y="${q.y-8}">${escapeHtml(p.code)}</text></g>`;}
  svg+=marker(state.start,'S','start')+marker(state.destination,'D','destination');
  if(state.pick&&state.keyboardCell)svg+=marker(state.keyboardCell,'+','keyboard-cursor');
  $('#mapSvg').innerHTML=svg;
  $('#zoomPct').textContent=`${Math.round(state.zoom*100)}%`;
  if(state.kind==='measured'){$('#scaleBar').hidden=false;$('#scaleBar').style.width=`${400/(d.gridWidth*d.cellMeters)*stage.clientWidth*state.zoom}px`;$('#scaleText').textContent='400 m';}else{$('#scaleBar').hidden=true;$('#scaleText').textContent='Illustrative grid';}
}
function renderComparison(){
  for(const mode of ['distance','terrain']){const r=state.routes[mode];$(`#${mode}Distance`).textContent=r?fmtDistance(r.meters):'No route';$(`#${mode}Slope`).textContent=r?fmtSlope(r.maxSlope):'—';$(`#${mode}Ascent`).textContent=r?`${Math.round(r.ascending)} m`:'—';}
  document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode)));
  const a=state.routes.distance,b=state.routes.terrain,selected=state.routes[state.mode];
  $('#routeContext').textContent=`${state.presetId?'Illustrative example destination':'Custom map destination'} · ${coordinates(state.destination)}`;
  $('#routeExplainer').textContent=!selected?'No route exists through the available cells. Choose two valid points.':state.kind==='measured'?'Both routes use sampled CTX DEM elevations. Terrain preferred adds an illustrative slope cost; shortest minimizes grid distance. Neither assesses safety.':'Both routes use synthetic height values. Terrain preferred adds an illustrative slope cost.';
  $('#routeDifference').textContent=a&&b?`Compared with shortest: ${signed(Math.round(b.meters-a.meters))} m distance, ${signed(b.maxSlope-a.maxSlope,1)}° maximum sampled step slope, ${signed(Math.round(b.ascending-a.ascending))} m ascent. The illustrative slope cost determines which cells A* prefers; shared sections overlap on the map.`:'No comparison is available for these points.';
  $('#startCoordinates').textContent=coordinates(state.start);$('#destinationCoordinates').textContent=coordinates(state.destination);
  $('#evaTarget').textContent=state.presetId?state.destination.name:'Custom destination';$('#evaDistance').textContent=selected?fmtDistance(selected.meters):'—';$('#evaSlope').textContent=selected?fmtSlope(selected.maxSlope):'—';$('#evaHeading').textContent=`${Math.round((Math.atan2(state.destination.x-state.start.x,state.start.y-state.destination.y)*180/Math.PI+360)%360)}°`;
  $('#waypoints').innerHTML=state.waypoints.map(p=>`<button type="button" class="waypoint ${state.presetId===p.id?'active':''}" data-waypoint="${escapeHtml(p.id)}" aria-pressed="${state.presetId===p.id}"><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.type)} · ${escapeHtml(p.code)}</small></button>`).join('');
}
function renderDataset(){const d=state.data,measured=state.kind==='measured';
  $('#datasetName').textContent=measured?d.site:'Synthetic Jezero demonstration';$('#datasetSummary').textContent=measured?'USGS CTX optical mosaic and DEM · Jezero study crop. Routes use a sampled 40 m grid.':'Illustrative map and height grid; not geographically registered.';
  $('#dataTag').textContent=measured?'Measured CTX':'Synthetic demo';$('#dataStatus').textContent=measured?'Measured CTX':'Synthetic demo';$('#mapHeading').textContent=measured?'Jezero CTX study crop':'Synthetic Jezero terrain';$('#mapSubheading').textContent=measured?'Projected Mars equirectangular metres · Research route prototype':'Illustrative map · Select a point tool to explore';
  $('#datasetSwitch').hidden=false;$('#datasetSwitch').textContent=measured?'Switch to synthetic demo':'Switch to measured CTX';
  $('#layerIcons').innerHTML=['optical','elevation','thermal'].map(name=>{const layer=layerForMode(state.kind,d,name),available=!measured||!!layer;const description=measured?available?'Registered CTX raster':'Unavailable':name==='thermal'?'Synthetic illustration':'Synthetic illustration';return `<button type="button" data-layer="${name}" class="layer-option ${state.layer===name?'active':''}" aria-pressed="${state.layer===name}" ${available?'':'disabled'}><span><strong>${name[0].toUpperCase()+name.slice(1)}</strong><small>${description}</small></span></button>`}).join('');
  $('#hazardToggle').checked=state.hazards;$('#hazardToggle').disabled=measured;$('#hazardToggleLabel').textContent=measured?'No verified hazard layer':'Synthetic hazard zones';$('#hazardRow').hidden=measured;
  $('#sourceOrg').textContent=measured?'USGS Astrogeology · MRO CTX':'Synthetic illustration';$('#opticalResolution').textContent=measured?'6 m source pixels':'Illustrative';$('#demResolution').textContent=measured?'20 m source pixels':'Synthetic';$('#gridResolution').textContent=measured?`${d.cellMeters} m route cells`:'Illustrative';$('#coverage').textContent=measured?`${(d.boundsMeters.east-d.boundsMeters.west)/1000} × ${(d.boundsMeters.north-d.boundsMeters.south)/1000} km · ${d.quality.validCells}/${d.quality.totalCells} DEM cells`:'Not geographically registered';
  $('#scientificNote').textContent=measured?'40 m grid slopes are endpoint differences from sampled DEM heights; no terrain safety validation.':'Synthetic demonstration; no measured thermal or hazard assessment.';
  $('#dataDialogText').textContent=measured?JSON.stringify({dataset:d.site,sourceOrganization:'USGS Astrogeology / MRO CTX',crs:d.crsWkt,boundsMeters:d.boundsMeters,verticalUnits:d.verticalUnits,verticalReference:d.verticalReference,sourceResolution:d.quality.sourceResolution,routingGridMeters:d.cellMeters,validCells:d.quality.validCells,totalCells:d.quality.totalCells,sources:Object.fromEntries(Object.entries(d.layers).map(([k,v])=>[k,v.source])),limitations:d.notice},null,2):'Synthetic procedural demo. Terrain, heights, thermal color, hazards and waypoints are illustrative. No measured elevations or registered Mars coordinates.';
}
function setLayer(name){if(state.kind==='measured'&&!layerForMode(state.kind,state.data,name))return;state.layer=name;document.querySelectorAll('[data-layer]').forEach(b=>{b.classList.toggle('active',b.dataset.layer===name);b.setAttribute('aria-pressed',String(b.dataset.layer===name));});renderMap();}
function setPick(which){state.pick=state.pick===which?null:which;state.keyboardCell=state.pick?{...(state.pick==='start'?state.start:state.destination)}:null;for(const [id,mode] of [['pickStart','start'],['pickDestination','destination']]){const b=$(`#${id}`);b.classList.toggle('active',state.pick===mode);b.setAttribute('aria-pressed',String(state.pick===mode));}if(state.pick){const blocked=isBlocked(state.data,state.keyboardCell.x,state.keyboardCell.y,state.kind==='demo'&&state.hazards);announce(`Choose ${state.pick} at ${coordinates(state.keyboardCell)}. Use arrow keys and Enter on the map, or click a valid cell.${blocked?' This cell is unavailable.':''}`,blocked);$('#mapStage').focus();}else announce('Select a point tool to plan your own route.');renderMap();}
function setPoint(which,cell){if(!cell){announce('Click inside the mapped footprint.',true);return;}if(isBlocked(state.data,cell.x,cell.y,state.kind==='demo'&&state.hazards)){announce('That grid cell has no usable DEM elevation or is inside an enabled demo hazard. Choose another cell.',true);return;}if(which==='start')state.start=cell;else{state.destination={...cell,id:'custom',name:'Custom destination',type:'Map-selected point',code:'CUSTOM',desc:'Selected on the current map grid.'};state.presetId=null;}setPick(null);calculateRoutes();announce(`${which==='start'?'Start':'Destination'} set to ${coordinates(cell)}. Routes recalculated.`);}
function setZoom(next){const stage=$('#mapStage');state.zoom=Math.max(1,Math.min(3,Math.round(next*10)/10));state.panX=clampPan(state.panX,state.zoom,stage.clientWidth);state.panY=clampPan(state.panY,state.zoom,stage.clientHeight);renderMap();}
function exportBriefing(){const briefing=buildBriefing(state);const blob=new Blob([JSON.stringify(briefing,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='ARES-route-briefing.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),0);toast('Route briefing exported');}
function renderScience(){
  const catalog=research.catalogs[research.scope],list=$('#scienceList'),detail=$('#scienceDetail');
  if(!catalog){list.textContent='Catalog unavailable or still loading.';detail.textContent='';return;}
  list.innerHTML=catalog.points.map(p=>`<button type="button" data-science="${escapeHtml(p.id)}" class="science-item" aria-pressed="${research.selected===p.id}">${escapeHtml(p.name.en)} <small>${escapeHtml(p.geological_category)}</small></button>`).join('');
  const p=catalog.points.find(x=>x.id===research.selected);
  if(!p){detail.textContent='Select a target to inspect its source and location status.';return;}
  const coverage=research.scope==='global'?{label:'Global Mars research context. Not eligible for this local map.',eligible:false}:state.kind!=='measured'?{label:'Measured CTX map required for coverage check.',eligible:false}:scienceCoverage(p,state.data,false);
  const c=p.coordinates,geo=c&&c.latitude!=null?`${c.latitude}° N, ${c.longitude_east}° E (submitted)`:'No single coordinate';
  const projected=coverage.projected?`E ${coverage.projected.east.toFixed(1)} m · N ${coverage.projected.north.toFixed(1)} m`:'';
  const evidence=coordinateEvidence[p.id];
  detail.innerHTML=`<h3>${escapeHtml(p.name.en)} <small>${escapeHtml(p.name.tr)}</small></h3><p>${escapeHtml(p.scientific_description.en)}</p><p lang="tr">${escapeHtml(p.scientific_description.tr)}</p><dl><dt>Scientific objective</dt><dd>${escapeHtml(p.scientific_target)}</dd><dt>Coordinate meaning</dt><dd>${escapeHtml(c?.represents??'Regional reference or unavailable')}</dd><dt>Submitted coordinate</dt><dd>${escapeHtml(geo)}</dd><dt>Projected position</dt><dd>${escapeHtml(projected||'Unavailable')}</dd><dt>Source verification</dt><dd>${evidence?`${escapeHtml(evidence.status)} · <a href="${escapeHtml(evidence.url)}" target="_blank" rel="noopener noreferrer">Coordinate evidence ↗</a>`:'Candidate claim; original coordinate source not independently authenticated.'}</dd><dt>Coordinate uncertainty</dt><dd>Not quantified in the submitted catalog; point meaning limits interpretation.</dd><dt>Map coverage / route eligibility</dt><dd><strong>${escapeHtml(coverage.label)}</strong> No ARES route generated.</dd><dt>Image attribution</dt><dd>${escapeHtml(p.image.credit)} · <a href="${escapeHtml(p.image.url)}" target="_blank" rel="noopener noreferrer">Image source ↗</a></dd></dl><a href="${escapeHtml(p.nasa_source_url)}" target="_blank" rel="noopener noreferrer">Research source ↗</a>`;
}
async function loadScience(){
  for(const [scope,file] of [['jezero','jezero-science-points.json'],['global','science-points.json']]){
    try{const response=await fetch(`./${file}`,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);research.catalogs[scope]=validateScienceCatalog(await response.json(),scope);}catch(error){console.warn(`${scope} catalog unavailable`,error);}
  }
  renderScience();
}
async function loadWeather(){
  const button=$('#weatherRefresh'),status=$('#weatherStatus'),container=$('#weatherEvents');button.disabled=true;status.textContent='Retrieving FLR, CME and SEP events from NASA DONKI…';container.replaceChildren();
  try{const result=await fetchDonki();status.textContent=formatDonkiStatus(result);
    for(const event of result.events.slice(0,12)){const row=document.createElement('div');row.className='weather-event';const title=document.createElement('strong');title.textContent=`${event.type} · ${new Date(event.time).toLocaleString('en-GB',{timeZone:'UTC',dateStyle:'medium',timeStyle:'short'})} UTC`;const sub=document.createElement('small');sub.textContent=`${event.catalog} · ${event.source}`;row.append(title,sub);if(event.link){const a=document.createElement('a');a.href=event.link;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Source record ↗';row.append(a);}container.append(row);}
  }catch(error){status.textContent='DONKI unavailable. No events are being substituted.';console.warn('DONKI request failed',error);}finally{button.disabled=false;}
}
function attach(){
  $('#layerIcons').addEventListener('click',e=>{const b=e.target.closest('[data-layer]');if(b&&!b.disabled)setLayer(b.dataset.layer);});
  $('#waypoints').addEventListener('click',e=>{const b=e.target.closest('[data-waypoint]');if(!b)return;const p=state.waypoints.find(x=>x.id===b.dataset.waypoint);if(p){state.destination=p;state.presetId=p.id;calculateRoutes();announce(`Example destination selected: ${p.name}.`);}});
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;renderMap();renderComparison();}));
  $('#pickStart').addEventListener('click',()=>setPick('start'));$('#pickDestination').addEventListener('click',()=>setPick('destination'));
  $('#routeToggle').addEventListener('change',e=>{state.showRoutes=e.target.checked;renderMap();});$('#hazardToggle').addEventListener('change',e=>{state.hazards=e.target.checked;calculateRoutes();});
  $('#zoomIn').addEventListener('click',()=>setZoom(state.zoom+.2));$('#zoomOut').addEventListener('click',()=>setZoom(state.zoom-.2));$('#panReset').addEventListener('click',()=>{state.zoom=1;state.panX=0;state.panY=0;renderMap();});
  $('#routeButton').addEventListener('click',()=>{calculateRoutes();toast('Routes recalculated');});$('#briefingExport').addEventListener('click',exportBriefing);
  $('#datasetSwitch').addEventListener('click',()=>{const url=new URL(location.href);if(state.kind==='measured')url.searchParams.set('mode','demo');else url.searchParams.delete('mode');location.href=url.href;});
  $('#scienceScope').addEventListener('change',e=>{research.scope=e.target.value;research.selected=null;renderScience();});
  $('#scienceList').addEventListener('click',e=>{const b=e.target.closest('[data-science]');if(b){research.selected=b.dataset.science;renderScience();}});
  $('#weatherDrawer').addEventListener('toggle',e=>{if(e.target.open&&!research.weatherLoaded){research.weatherLoaded=true;loadWeather();}});
  $('#weatherRefresh').addEventListener('click',loadWeather);
  for(const id of ['dataInspect','provenanceButton'])$(`#${id}`).addEventListener('click',()=>$('#dataDialog').showModal());$('#dataClose').addEventListener('click',()=>$('#dataDialog').close());
  $('#fullscreenButton').addEventListener('click',()=>{const el=$('#mapStage');if(!document.fullscreenElement)el.requestFullscreen?.().catch(()=>toast('Fullscreen unavailable'));else document.exitFullscreen?.();});
  $('#evaButton').addEventListener('click',()=>{state.eva=!state.eva;document.body.classList.toggle('eva-active',state.eva);$('#evaButton').setAttribute('aria-pressed',String(state.eva));});$('#evaExit').addEventListener('click',()=>{state.eva=false;document.body.classList.remove('eva-active');$('#evaButton').setAttribute('aria-pressed','false');});
  const stage=$('#mapStage');let drag=null;
  stage.addEventListener('keydown',e=>{if(e.target!==stage||!state.pick)return;if(e.key.startsWith('Arrow')){e.preventDefault();state.keyboardCell=stepKeyboardCell(state.keyboardCell,e.key,state.data.gridWidth,state.data.gridHeight);const blocked=isBlocked(state.data,state.keyboardCell.x,state.keyboardCell.y,state.kind==='demo'&&state.hazards);$('#cursorCoordinates').textContent=coordinates(state.keyboardCell);announce(`${coordinates(state.keyboardCell)}. ${blocked?'Unavailable cell; choose another.':'Press Enter or Space to set '+state.pick+'.'}`,blocked);renderMap();}else if(e.key==='Enter'||e.key===' '){e.preventDefault();setPoint(state.pick,state.keyboardCell);}else if(e.key==='Escape'){e.preventDefault();setPick(null);}});
  stage.addEventListener('pointerdown',e=>{if(e.target.closest('button,.map-scale,.map-layer-label'))return;drag={x:e.clientX,y:e.clientY,panX:state.panX,panY:state.panY,moved:false};stage.setPointerCapture(e.pointerId);});
  stage.addEventListener('pointermove',e=>{const rect=stage.getBoundingClientRect();const cell=clientPointToCell(e.clientX,e.clientY,rect,state.data.gridWidth,state.data.gridHeight,state.zoom,state.panX,state.panY);$('#cursorCoordinates').textContent=cell?coordinates(cell):'Outside mapped footprint';if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;if(drag.moved){stage.classList.add('panning');state.panX=clampPan(drag.panX+dx,state.zoom,rect.width);state.panY=clampPan(drag.panY+dy,state.zoom,rect.height);renderMap();}}});
  stage.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;stage.classList.remove('panning');if(!moved&&state.pick){const rect=stage.getBoundingClientRect();setPoint(state.pick,clientPointToCell(e.clientX,e.clientY,rect,state.data.gridWidth,state.data.gridHeight,state.zoom,state.panX,state.panY));}});
  stage.addEventListener('pointercancel',()=>{drag=null;stage.classList.remove('panning');});
  window.addEventListener('resize',()=>{state.panX=clampPan(state.panX,state.zoom,stage.clientWidth);state.panY=clampPan(state.panY,state.zoom,stage.clientHeight);renderMap();});
}
async function loadMeasured(){try{const response=await fetch('./public/data/mission-pack.json',{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const measured=validateMissionPack(await response.json());const selected=selectMissionData(demo,measured,location.search);if(selected.kind==='measured'){state.data=selected.terrain;state.kind='measured';state.waypoints=measured.waypoints;state.start={...measured.start};state.destination=measured.waypoints[0];state.presetId=state.destination.id;state.hazards=false;state.layer='optical';}renderDataset();calculateRoutes();renderScience();}catch(error){console.warn('Measured pack unavailable; synthetic demo retained',error);renderDataset();calculateRoutes();renderScience();toast('Measured pack unavailable; synthetic demo active');}}
attach();
// The default measured page never paints synthetic terrain while its pack loads.
if(new URLSearchParams(location.search).get('mode')==='demo'){
  renderDataset();
  calculateRoutes();
}
loadMeasured();
loadScience();
fetch('./build-info.json',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(info=>{if(info?.id)$('#buildId').textContent=`Build: ${info.id}`;}).catch(()=>{});
