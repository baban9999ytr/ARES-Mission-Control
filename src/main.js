import demo from './data/demo-terrain.json' with {type:'json'};
import {planRoute,isBlocked} from './engine/routing.js';
import {clientPointToCell,clampPan,cellToSvg,stepKeyboardCell} from './engine/map-grid.js';
import {validateMissionPack,mapDisplayCoordinates} from './data/mission-pack.js';
import {selectMissionData,layerForMode} from './data/mission-mode.js';
import {validateScienceCatalog,scienceCoverage,coordinateEvidence} from './data/science-catalog.js';
import {fetchDonki,formatDonkiStatus} from './data/donki.js';
import {buildBriefing} from './data/briefing.js';
import {validateMissionLibrary,planMission,buildMissionReport} from './data/mission-library.js';
import {createCustomMission,validateCustomMission,editCustomMission,serializeCustomMission,parseCustomMission,MAX_CUSTOM_STOPS} from './data/mission-builder.js';

const $=s=>document.querySelector(s);
const DEMO_WAYPOINTS=[
  {id:'delta',name:'Delta escarpment',type:'Illustrative study target',x:61,y:14,code:'EX-01',desc:'Example point on the synthetic map.'},
  {id:'rim',name:'Crater rim overlook',type:'Illustrative study target',x:66,y:40,code:'EX-02',desc:'Example point on the synthetic map.'},
  {id:'basin',name:'Ancient lakebed',type:'Illustrative study target',x:43,y:47,code:'EX-03',desc:'Example point on the synthetic map.'},
];
const state={data:demo,kind:'demo',waypoints:DEMO_WAYPOINTS,start:{x:13,y:29},destination:DEMO_WAYPOINTS[0],presetId:'delta',layer:'optical',mode:'terrain',pick:null,keyboardCell:null,hazards:true,showRoutes:true,routes:{distance:null,terrain:null},zoom:1,panX:0,panY:0,eva:false,activeMission:null,missionLegs:[]};
const library={missions:[],loaded:false,error:null,phase:'All',search:''};
const editor={mode:'edit',undo:[],redo:[],drag:null,listDrag:null,selectedStop:null};
const customActive=()=>state.kind==='measured'&&state.activeMission?.phase==='Custom';
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
function calculateRoutes(){
  if(state.kind==='measured'&&state.activeMission){
    const plan=planMission(state.data,state.activeMission);
    if(plan){state.missionLegs=plan.legs;state.routes=plan.routes;}
    else{state.missionLegs=[];state.routes={distance:null,terrain:null};announce('One or more mission legs have no valid measured-CTX route.',true);}
  }else{
    state.missionLegs=[];
    const hazard=state.kind==='demo'&&state.hazards;
    state.routes.distance=planRoute(state.data,state.start,state.destination,'distance',hazard);
    state.routes.terrain=planRoute(state.data,state.start,state.destination,'terrain',hazard);
  }
  renderMap();renderComparison();
}
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
  if(state.activeMission){
    const stops=state.activeMission.stops;
    if(customActive()){
      for(let i=0;i<stops.length;i++){
        const visual=editor.drag?.kind==='stop'&&editor.drag.index===i&&editor.drag.preview?editor.drag.preview:stops[i];
        const label=i===0?'S':i===stops.length-1?'D':String(i+1);
        const preview=editor.drag?.kind==='stop'&&editor.drag.index===i&&editor.drag.preview;
        svg+=marker(visual,label,preview?'mission-preview':(i===0?'start mission-draggable':i===stops.length-1?'destination mission-draggable':'mission-stop mission-draggable'));
      }
    }else{
      for(let i=1;i<stops.length-1;i++)svg+=marker(stops[i],String(i+1),'mission-stop');
      const isReturn=state.start.x===state.destination.x&&state.start.y===state.destination.y;
      svg+=isReturn?marker(state.start,'S/D','mission-return'):marker(state.start,'S','start')+marker(state.destination,'D','destination');
    }
  }else{
    for(const p of state.waypoints){if(p.x===state.destination.x&&p.y===state.destination.y)continue;const q=svgPoint(p);svg+=`<g class="map-waypoint"><circle cx="${q.x}" cy="${q.y}" r="5"/><text x="${q.x+9}" y="${q.y-8}">${escapeHtml(p.code)}</text></g>`;}
    svg+=marker(state.start,'S','start')+marker(state.destination,'D','destination');
  }
  if((state.pick||customActive()&&editor.mode==='add')&&state.keyboardCell)svg+=marker(state.keyboardCell,'+','keyboard-cursor');
  $('#mapSvg').innerHTML=svg;
  $('#zoomPct').textContent=`${Math.round(state.zoom*100)}%`;
  if(state.kind==='measured'){$('#scaleBar').hidden=false;$('#scaleBar').style.width=`${400/(d.gridWidth*d.cellMeters)*stage.clientWidth*state.zoom}px`;$('#scaleText').textContent='400 m';}else{$('#scaleBar').hidden=true;$('#scaleText').textContent='Illustrative grid';}
}
function renderComparison(){
  for(const mode of ['distance','terrain']){const r=state.routes[mode];$(`#${mode}Distance`).textContent=r?fmtDistance(r.meters):'No route';$(`#${mode}Slope`).textContent=r?fmtSlope(r.maxSlope):'—';$(`#${mode}Ascent`).textContent=r?`${Math.round(r.ascending)} m`:'—';}
  document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode)));
  const a=state.routes.distance,b=state.routes.terrain,selected=state.routes[state.mode];
  $('#routeContext').textContent=state.activeMission?state.activeMission.id+' · '+state.missionLegs.length+' fixed-order A* legs · '+coordinates(state.destination):`${state.presetId?'Illustrative example destination':'Custom map destination'} · ${coordinates(state.destination)}`;
  $('#routeExplainer').textContent=!selected?'No route exists through the available cells. Choose two valid points.':state.kind==='measured'?'Both routes use sampled CTX DEM elevations. Terrain preferred adds an illustrative slope cost; shortest minimizes grid distance. Neither assesses safety.':'Both routes use synthetic height values. Terrain preferred adds an illustrative slope cost.';
  $('#routeDifference').textContent=a&&b?`Compared with shortest: ${signed(Math.round(b.meters-a.meters))} m distance, ${signed(b.maxSlope-a.maxSlope,1)}° maximum sampled step slope, ${signed(Math.round(b.ascending-a.ascending))} m ascent. The illustrative slope cost determines which cells A* prefers; shared sections overlap on the map.`:'No comparison is available for these points.';
  $('#startCoordinates').textContent=coordinates(state.start);$('#destinationCoordinates').textContent=coordinates(state.destination);
  $('#evaTarget').textContent=state.presetId?state.destination.name:'Custom destination';$('#evaDistance').textContent=selected?fmtDistance(selected.meters):'—';$('#evaSlope').textContent=selected?fmtSlope(selected.maxSlope):'—';$('#evaHeading').textContent=state.activeMission&&state.missionLegs.length>1?'—':`${Math.round((Math.atan2(state.destination.x-state.start.x,state.start.y-state.destination.y)*180/Math.PI+360)%360)}°`;
  $('#waypoints').innerHTML=state.waypoints.map(p=>`<button type="button" class="waypoint ${state.presetId===p.id?'active':''}" data-waypoint="${escapeHtml(p.id)}" aria-pressed="${state.presetId===p.id}"><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.type)} · ${escapeHtml(p.code)}</small></button>`).join('');
  renderMissionSummary();
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
function setPick(which){state.pick=state.pick===which?null:which;state.keyboardCell=state.pick?{...(state.pick==='start'?state.start:state.destination)}:null;for(const [id,mode] of [['pickStart','start'],['pickDestination','destination']]){const b=$(`#${id}`);b.classList.toggle('active',state.pick===mode);b.setAttribute('aria-pressed',String(state.pick===mode));}if(state.pick){const blocked=isBlocked(state.data,state.keyboardCell.x,state.keyboardCell.y,state.kind==='demo'&&state.hazards);announce(`Choose ${state.pick} at ${coordinates(state.keyboardCell)}. Use arrow keys and Enter on the map, or click a valid cell.${blocked?' This cell is unavailable.':''}`,blocked);$('#mapStage').focus();}else announce(state.activeMission?'Mission ready. Drag markers to edit stops; compare both routes at right.':'Create a mission or choose an exercise to begin.');renderMap();}
function setPoint(which,cell){if(!cell){announce('Click inside the mapped footprint.',true);return;}if(isBlocked(state.data,cell.x,cell.y,state.kind==='demo'&&state.hazards)){announce('That grid cell has no usable DEM elevation or is inside an enabled demo hazard. Choose another cell.',true);return;}if(state.activeMission){state.activeMission=null;state.missionLegs=[];editor.mode='navigate';editor.undo=[];editor.redo=[];renderMissionLibrary();}if(which==='start')state.start=cell;else{state.destination={...cell,id:'custom',name:'Custom destination',type:'Map-selected point',code:'CUSTOM',desc:'Selected on the current map grid.'};state.presetId=null;}setPick(null);calculateRoutes();announce(`${which==='start'?'Start':'Destination'} set to ${coordinates(cell)}. Routes recalculated.`);}
function setZoom(next){const stage=$('#mapStage');state.zoom=Math.max(1,Math.min(3,Math.round(next*10)/10));state.panX=clampPan(state.panX,state.zoom,stage.clientWidth);state.panY=clampPan(state.panY,state.zoom,stage.clientHeight);renderMap();}
function downloadJson(payload,filename){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
function exportBriefing(){if(state.activeMission&&state.missionLegs.length){downloadJson(buildMissionReport({mission:state.activeMission,legs:state.missionLegs,routes:state.routes},state.data,state.mode),'ARES-mission-'+state.activeMission.id+'.json');toast('Mission briefing exported');return;}downloadJson(buildBriefing(state),'ARES-route-briefing.json');toast('Route briefing exported');}

function renderMissionBuilder(){
  const measured=state.kind==='measured',active=customActive(),mission=state.activeMission;
  $('#missionBuilder').hidden=!measured;
  $('#missionDuplicate').disabled=!measured||!mission||active;
  $('#missionDuplicate').hidden=active;
  $('#missionEditor').hidden=!active;
  $('#mapStage').classList.toggle('mission-adding',active&&editor.mode==='add');
  $('#mapStage').classList.toggle('mission-editing',active&&editor.mode!=='add');
  $('#mapHint').textContent=active&&editor.mode==='add'?'Click a valid map cell, or use arrow keys and Enter to append a stop · Escape cancels':active?'Drag a marker to move a stop · Drag background to pan · Scroll to zoom':'Drag map to pan · Scroll or use + / − to zoom';
  if(!active)return;
  if($('#missionTitle').value!==mission.title)$('#missionTitle').value=mission.title;
  document.querySelectorAll('[data-edit-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.editMode===editor.mode)));
  $('#missionUndo').disabled=editor.undo.length===0;
  $('#missionRedo').disabled=editor.redo.length===0;
  $('#missionAdd').disabled=mission.stops.length>=MAX_CUSTOM_STOPS;
  $('#missionEditorStops').innerHTML=mission.stops.map((p,index)=>{
    const n=mission.stops.length,number=index+1;
    const label=index===0?'Start':index===n-1?'Destination':'Stop '+number;
    const location=escapeHtml(coordinates(p));
    return '<div class="mission-editor-row'+(editor.selectedStop===index?' selected':'')+'" data-stop-row="'+index+'">'+
      '<button type="button" class="mission-stop-grip" data-stop-grip="'+index+'" aria-label="Drag to reorder stop '+number+'">⠿</button>'+
      '<div class="mission-stop-info"><strong>'+escapeHtml(label)+'</strong><small>'+location+'</small></div>'+
      '<div class="mission-stop-controls">'+
        '<button type="button" data-stop-up="'+index+'" aria-label="Move stop '+number+' earlier" '+(index===0?'disabled':'')+'>↑</button>'+
        '<button type="button" data-stop-down="'+index+'" aria-label="Move stop '+number+' later" '+(index===n-1?'disabled':'')+'>↓</button>'+
        '<button type="button" data-stop-remove="'+index+'" aria-label="Remove stop '+number+'" '+(n<=2?'disabled':'')+'>×</button>'+
      '</div></div>';
  }).join('');
}
function installCustomMission(mission,resetHistory=true){
  if(state.kind!=='measured')return;
  const safe=validateCustomMission(mission,state.data);
  state.activeMission=safe;
  state.start={...safe.stops[0]};
  state.destination={...safe.stops.at(-1),id:'CUSTOM',name:safe.title,type:'User-designed measured-grid mission',code:'CUSTOM'};
  state.presetId=null;
  if(resetHistory){editor.undo=[];editor.redo=[];}
  editor.mode='edit';editor.selectedStop=null;
  setPick(null);
  calculateRoutes();
  renderMissionLibrary();
  $('#missionDrawer').open=false;
}
function applyCustomEdit(operation){
  if(!customActive())return;
  const previous=state.activeMission;
  try{
    const next=editCustomMission(previous,operation,state.data);
    if(JSON.stringify(next)===JSON.stringify(previous))return;
    editor.undo.push(previous);
    if(editor.undo.length>30)editor.undo.shift();
    editor.redo=[];
    state.activeMission=next;
    state.start={...next.stops[0]};
    state.destination={...next.stops.at(-1),id:'CUSTOM',name:next.title,type:'User-designed measured-grid mission',code:'CUSTOM'};
    editor.mode='edit';calculateRoutes();renderMissionLibrary();
    $('#missionEditorStatus').textContent='Mission updated · '+next.stops.length+' ordered stops · both route modes recalculated.';
  }catch(error){
    $('#missionEditorStatus').textContent=error.message;
    announce(error.message,true);
  }
}
function restoreCustomHistory(from,to){
  if(!customActive()||!from.length)return;
  const next=from.pop();
  to.push(state.activeMission);
  state.activeMission=next;
  state.start={...next.stops[0]};
  state.destination={...next.stops.at(-1),id:'CUSTOM',name:next.title,type:'User-designed measured-grid mission',code:'CUSTOM'};
  calculateRoutes();renderMissionLibrary();
  $('#missionEditorStatus').textContent='Restored prior mission state and recalculated routes.';
}
function nearestCustomStop(e,rect){
  if(!customActive())return -1;
  let winner=-1,best=27*27;
  const cx=rect.width/2,cy=rect.height/2;
  state.activeMission.stops.forEach((p,index)=>{
    const x=(p.x+.5)/state.data.gridWidth*rect.width;
    const y=(p.y+.5)/state.data.gridHeight*rect.height;
    const dx=(cx+(x-cx)*state.zoom+state.panX)-(e.clientX-rect.left);
    const dy=(cy+(y-cy)*state.zoom+state.panY)-(e.clientY-rect.top);
    const dist=dx*dx+dy*dy;
    if(dist<best){best=dist;winner=index;}
  });
  return winner;
}
function cellUnderPointer(e,stage){
  return clientPointToCell(e.clientX,e.clientY,stage.getBoundingClientRect(),state.data.gridWidth,state.data.gridHeight,state.zoom,state.panX,state.panY);
}

function renderMissionLibrary(){
  renderMissionBuilder();
  const active=state.kind==='measured'&&library.loaded;
  $('#missionControls').hidden=!active;
  $('#missionStatus').textContent=state.kind!=='measured'?'Mission editing requires measured CTX. Switch datasets in Advanced.':library.error?'Catalog unavailable: '+library.error:library.loaded?'Measured CTX ready · 30 illustrative exercises available.':'Loading measured mission catalog…';
  if(!active){$('#missionList').replaceChildren();$('#missionDetail').textContent='These exercises cannot be loaded in synthetic mode.';return;}
  const query=library.search.trim().toLowerCase();
  const filtered=library.missions.filter(m=>(library.phase==='All'||m.phase===library.phase)&&
    (!query||[m.id,m.title,m.objective,m.researchQuestion].some(s=>s.toLowerCase().includes(query))));
  $('#missionList').innerHTML=filtered.map(m=>'<button type="button" class="mission-item" data-mission="'+escapeHtml(m.id)+'" aria-pressed="'+(state.activeMission?.id===m.id)+'"><strong><span class="mission-id">'+escapeHtml(m.id)+'</span>'+escapeHtml(m.title)+'</strong><small>'+escapeHtml(m.phase)+' · '+(m.stops.length-1)+' fixed-order '+(m.stops.length===2?'leg':'legs')+'</small></button>').join('')||'<p class="mission-empty">No missions match this filter.</p>';
  const m=state.activeMission;
  $('#missionDetail').innerHTML=m?'<strong>'+escapeHtml(m.id+' · '+m.title)+'</strong><p>'+escapeHtml(m.objective)+'</p><p><b>Research question:</b> '+escapeHtml(m.researchQuestion)+'</p><ol>'+m.stops.map((p,i)=>'<li>Stop '+(i+1)+': '+escapeHtml(coordinates(p))+'</li>').join('')+'</ol><p>Grid stops are illustrative CTX exercises, not source-verified Jezero science targets.</p>':'Select a mission to load its fixed-order grid stops, compute both route modes and compare leg totals.';
}
function renderMissionSummary(){
  const m=state.activeMission;
  $('#missionSummary').hidden=!m;
  if(!m)return;
  $('#missionSummaryTitle').textContent=m.id+' · '+m.title;
  $('#missionSummaryNote').textContent=m.objective+' · '+m.stops.length+' ordered stops · '+state.missionLegs.length+' independently planned '+(state.missionLegs.length===1?'leg.':'legs.');
  $('#missionLegs').innerHTML=state.missionLegs.map(leg=>'<div class="mission-leg"><span>LEG '+leg.index+' · '+escapeHtml(leg.from.x+','+leg.from.y)+' → '+escapeHtml(leg.to.x+','+leg.to.y)+'</span><strong>'+fmtDistance(leg[state.mode].meters)+' · '+fmtSlope(leg[state.mode].maxSlope)+'</strong></div>').join('');
}
function selectLibraryMission(id){
  if(state.kind!=='measured'||!library.loaded)return;
  const mission=library.missions.find(m=>m.id===id);
  if(!mission)return;
  const plan=planMission(state.data,mission);
  if(!plan){announce('This mission cannot be routed on the current measured crop.',true);return;}
  editor.mode='navigate';editor.undo=[];editor.redo=[];
  state.activeMission=mission;state.missionLegs=plan.legs;
  state.start={...mission.stops[0]};
  state.destination={...mission.stops[mission.stops.length-1],id:mission.id,name:mission.title,type:'Illustrative measured-grid mission',code:mission.id};
  state.presetId=null;
  setPick(null);calculateRoutes();renderMissionLibrary();
  $('#missionDrawer').open=false;$('#missionLibraryOpen').setAttribute('aria-expanded','false');
  announce('Loaded '+mission.id+': '+plan.legs.length+' independently routed legs.');
}
function clearLibraryMission(){
  if(!state.activeMission||state.kind!=='measured')return;
  editor.mode='navigate';editor.undo=[];editor.redo=[];
  state.activeMission=null;state.missionLegs=[];state.start={...state.data.start};
  state.destination=state.waypoints[0];state.presetId=state.destination.id;
  calculateRoutes();renderMissionLibrary();announce('Returned to default CTX route comparison.');
}
async function loadLibrary(){
  try{
    const response=await fetch('./data/scenarios/measured-missions.json',{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    library.missions=validateMissionLibrary(await response.json(),state.data);
    library.loaded=true;library.error=null;
    const requested=new URLSearchParams(location.search).get('mission');
    if(requested)selectLibraryMission(requested);
  }catch(error){library.error=error.message;library.loaded=false;console.warn('Mission library unavailable',error);}
  renderMissionLibrary();
}
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
  $('#waypoints').addEventListener('click',e=>{const b=e.target.closest('[data-waypoint]');if(!b)return;const p=state.waypoints.find(x=>x.id===b.dataset.waypoint);if(p){editor.mode='navigate';editor.undo=[];editor.redo=[];state.activeMission=null;state.missionLegs=[];state.destination=p;state.presetId=p.id;calculateRoutes();renderMissionLibrary();announce(`Example destination selected: ${p.name}.`);}});
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;renderMap();renderComparison();}));
  $('#pickStart').addEventListener('click',()=>setPick('start'));$('#pickDestination').addEventListener('click',()=>setPick('destination'));
  $('#routeToggle').addEventListener('change',e=>{state.showRoutes=e.target.checked;renderMap();});$('#hazardToggle').addEventListener('change',e=>{state.hazards=e.target.checked;calculateRoutes();});
  $('#zoomIn').addEventListener('click',()=>setZoom(state.zoom+.2));$('#zoomOut').addEventListener('click',()=>setZoom(state.zoom-.2));$('#panReset').addEventListener('click',()=>{state.zoom=1;state.panX=0;state.panY=0;renderMap();});
  $('#routeButton').addEventListener('click',()=>{calculateRoutes();toast('Routes recalculated');});$('#briefingExport').addEventListener('click',exportBriefing);
  $('#datasetSwitch').addEventListener('click',()=>{const url=new URL(location.href);if(state.kind==='measured')url.searchParams.set('mode','demo');else url.searchParams.delete('mode');location.href=url.href;});
  $('#missionPhase').addEventListener('change',e=>{library.phase=e.target.value;renderMissionLibrary();});
  $('#missionSearch').addEventListener('input',e=>{library.search=e.target.value;renderMissionLibrary();});
  $('#missionLibraryOpen').addEventListener('click',()=>{$('#missionDrawer').open=!$('#missionDrawer').open;$('#missionLibraryOpen').setAttribute('aria-expanded',String($('#missionDrawer').open));if($('#missionDrawer').open)$('#missionSearch').focus();});
  $('#missionDrawer').addEventListener('toggle',()=>$('#missionLibraryOpen').setAttribute('aria-expanded',String($('#missionDrawer').open)));
  $('#missionList').addEventListener('click',e=>{const b=e.target.closest('[data-mission]');if(b)selectLibraryMission(b.dataset.mission);});
  $('#missionClear').addEventListener('click',clearLibraryMission);
  $('#missionNew').addEventListener('click',()=>{
    if(state.kind==='measured'){
      installCustomMission(createCustomMission(state.data));
      $('#missionEditorStatus').textContent='New custom mission created. Drag stops or select Add stop on map.';
    }
  });
  $('#missionDuplicate').addEventListener('click',()=>{
    if(state.kind==='measured'&&state.activeMission&&!customActive()){
      const base=state.activeMission;
      installCustomMission(createCustomMission(state.data,base));
      $('#missionEditorStatus').textContent='Duplicated '+base.id+' into an editable custom mission. The original catalog is unchanged.';
    }
  });
  $('#missionTitle').addEventListener('change',e=>applyCustomEdit({type:'rename',title:e.target.value}));
  document.querySelectorAll('[data-edit-mode]').forEach(button=>button.addEventListener('click',()=>{
    if(!customActive())return;
    if(button.dataset.editMode==='add'&&state.activeMission.stops.length>=MAX_CUSTOM_STOPS)return;
    editor.mode=button.dataset.editMode;
    if(editor.mode==='add'){state.keyboardCell={...state.activeMission.stops.at(-1)};$('#mapStage').focus();}
    renderMissionBuilder();renderMap();
    $('#missionEditorStatus').textContent=editor.mode==='add'?'Click a valid measured CTX cell to append a stop.':editor.mode==='edit'?'Drag a numbered map stop to move it. Background drag still pans.':'Drag the map background to pan without moving stops.';
  }));
  $('#missionUndo').addEventListener('click',()=>restoreCustomHistory(editor.undo,editor.redo));
  $('#missionRedo').addEventListener('click',()=>restoreCustomHistory(editor.redo,editor.undo));
  $('#missionSave').addEventListener('click',()=>{
    if(!customActive())return;
    downloadJson(serializeCustomMission(state.activeMission,state.data),'ARES-custom-mission.json');
    $('#missionEditorStatus').textContent='Saved editable mission blueprint as JSON.';
  });
  $('#missionImport').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      if(file.size>100000)throw new Error('Mission JSON exceeds 100 KB limit.');
      if(state.kind!=='measured')throw new Error('Switch to measured CTX mode before importing.');
      const mission=parseCustomMission(JSON.parse(await file.text()),state.data);
      installCustomMission(mission);
      $('#missionEditorStatus').textContent='Imported editable mission with '+mission.stops.length+' stops.';
    }catch(error){$('#missionEditorStatus').textContent=error.message;announce(error.message,true);}
    finally{e.target.value='';}
  });
  document.querySelector('.mission-file-label').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#missionImport').click();}});
  const stopList=$('#missionEditorStops');
  stopList.addEventListener('click',e=>{
    if(!customActive())return;
    const up=e.target.closest('[data-stop-up]'),down=e.target.closest('[data-stop-down]'),remove=e.target.closest('[data-stop-remove]');
    const row=e.target.closest('[data-stop-row]');if(row&&!up&&!down&&!remove){editor.selectedStop=Number(row.dataset.stopRow);renderMissionBuilder();}
    if(up)applyCustomEdit({type:'reorder',index:Number(up.dataset.stopUp),to:Number(up.dataset.stopUp)-1});
    if(down)applyCustomEdit({type:'reorder',index:Number(down.dataset.stopDown),to:Number(down.dataset.stopDown)+1});
    if(remove)applyCustomEdit({type:'remove',index:Number(remove.dataset.stopRemove)});
  });
  stopList.addEventListener('pointerdown',e=>{
    const grip=e.target.closest('[data-stop-grip]');
    if(!grip||!customActive())return;
    editor.listDrag={pointerId:e.pointerId,index:Number(grip.dataset.stopGrip),startY:e.clientY};
    grip.setPointerCapture(e.pointerId);
  });
  stopList.addEventListener('pointermove',e=>{
    if(!editor.listDrag||editor.listDrag.pointerId!==e.pointerId)return;
    const row=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-stop-row]');
    stopList.querySelectorAll('[data-stop-row]').forEach(el=>{
      el.classList.toggle('drop-target',row===el);
      el.classList.toggle('dragging',Number(el.dataset.stopRow)===editor.listDrag.index);
    });
  });
  stopList.addEventListener('pointerup',e=>{
    const drag=editor.listDrag;if(!drag||drag.pointerId!==e.pointerId)return;
    const row=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-stop-row]');
    editor.listDrag=null;
    stopList.querySelectorAll('[data-stop-row]').forEach(el=>el.classList.remove('drop-target','dragging'));
    if(row&&stopList.contains(row)){
      const to=Number(row.dataset.stopRow);
      if(to!==drag.index)applyCustomEdit({type:'reorder',index:drag.index,to});
    }
  });
  stopList.addEventListener('pointercancel',()=>{editor.listDrag=null;stopList.querySelectorAll('[data-stop-row]').forEach(el=>el.classList.remove('drop-target','dragging'));});
  $('#scienceScope').addEventListener('change',e=>{research.scope=e.target.value;research.selected=null;renderScience();});
  $('#scienceList').addEventListener('click',e=>{const b=e.target.closest('[data-science]');if(b){research.selected=b.dataset.science;renderScience();}});
  $('#weatherDrawer').addEventListener('toggle',e=>{if(e.target.open&&!research.weatherLoaded){research.weatherLoaded=true;loadWeather();}});
  $('#weatherRefresh').addEventListener('click',loadWeather);
  for(const id of ['dataInspect','provenanceButton'])$(`#${id}`).addEventListener('click',()=>$('#dataDialog').showModal());$('#dataClose').addEventListener('click',()=>$('#dataDialog').close());
  $('#fullscreenButton').addEventListener('click',()=>{const el=$('#mapStage');if(!document.fullscreenElement)el.requestFullscreen?.().catch(()=>toast('Fullscreen unavailable'));else document.exitFullscreen?.();});
  $('#evaButton').addEventListener('click',()=>{state.eva=!state.eva;document.body.classList.toggle('eva-active',state.eva);$('#evaButton').setAttribute('aria-pressed',String(state.eva));});$('#evaExit').addEventListener('click',()=>{state.eva=false;document.body.classList.remove('eva-active');$('#evaButton').setAttribute('aria-pressed','false');});
  const stage=$('#mapStage');let drag=null;
  stage.addEventListener('wheel',e=>{e.preventDefault();setZoom(state.zoom+(e.deltaY<0?.2:-.2));},{passive:false});
  stage.addEventListener('keydown',e=>{
    const adding=customActive()&&editor.mode==='add';
    if(e.target!==stage||!state.pick&&!adding)return;
    if(e.key.startsWith('Arrow')){
      e.preventDefault();state.keyboardCell=stepKeyboardCell(state.keyboardCell,e.key,state.data.gridWidth,state.data.gridHeight);
      const blocked=isBlocked(state.data,state.keyboardCell.x,state.keyboardCell.y,state.kind==='demo'&&state.hazards);
      $('#cursorCoordinates').textContent=coordinates(state.keyboardCell);
      announce(`${coordinates(state.keyboardCell)}. ${blocked?'Unavailable cell; choose another.':adding?'Press Enter or Space to add this stop.':'Press Enter or Space to set '+state.pick+'.'}`,blocked);renderMap();
    }else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(adding)applyCustomEdit({type:'add',point:state.keyboardCell});else setPoint(state.pick,state.keyboardCell);}
    else if(e.key==='Escape'){e.preventDefault();if(adding){editor.mode='edit';renderMissionBuilder();renderMap();$('#missionEditorStatus').textContent='Add stop canceled.';}else setPick(null);}
  });
  stage.addEventListener('pointerdown',e=>{
    if(e.target.closest('button,.map-scale,.map-layer-label'))return;
    const index=customActive()&&editor.mode!=='add'?nearestCustomStop(e,stage.getBoundingClientRect()):-1;
    const kind=index>=0?'stop':customActive()&&editor.mode==='add'?'add':'pan';
    drag={kind,index,pointerId:e.pointerId,x:e.clientX,y:e.clientY,panX:state.panX,panY:state.panY,moved:false,preview:null};
    editor.drag=kind==='stop'?drag:null;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove',e=>{
    const rect=stage.getBoundingClientRect();
    const cell=cellUnderPointer(e,stage);
    $('#cursorCoordinates').textContent=cell?coordinates(cell):'Outside mapped footprint';
    if(!drag||drag.pointerId!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(Math.hypot(dx,dy)>4)drag.moved=true;
    if(drag.kind==='stop'){
      drag.preview=cell&&!isBlocked(state.data,cell.x,cell.y,false)?cell:null;
      if(drag.moved){stage.classList.add('mission-dragging');renderMap();}
    }else if(drag.kind==='pan'&&drag.moved){
      stage.classList.add('panning');
      state.panX=clampPan(drag.panX+dx,state.zoom,rect.width);
      state.panY=clampPan(drag.panY+dy,state.zoom,rect.height);
      renderMap();
    }
  });
  stage.addEventListener('pointerup',e=>{
    if(!drag||drag.pointerId!==e.pointerId)return;
    const last=drag;drag=null;editor.drag=null;
    stage.classList.remove('panning','mission-dragging');
    if(last.kind==='stop'){
      if(last.moved){
        const point=cellUnderPointer(e,stage);
        if(point)applyCustomEdit({type:'move',index:last.index,point});
        else $('#missionEditorStatus').textContent='Drag ended outside mapped terrain; stop not moved.';
      }
      else {editor.selectedStop=last.index;renderMissionBuilder();$('#missionEditorStatus').textContent='Stop '+(last.index+1)+' selected. Drag its marker to move it, or use the stop list to reorder or remove it.';}
      renderMap();
    }else if(last.kind==='add'&&!last.moved){
      const point=cellUnderPointer(e,stage);
      if(point)applyCustomEdit({type:'add',point});
      else $('#missionEditorStatus').textContent='Choose a valid point inside the CTX map.';
    }else if(last.kind==='pan'&&!last.moved&&state.pick){
      setPoint(state.pick,cellUnderPointer(e,stage));
    }
  });
  stage.addEventListener('pointercancel',()=>{drag=null;editor.drag=null;stage.classList.remove('panning','mission-dragging');renderMap();});
  window.addEventListener('resize',()=>{state.panX=clampPan(state.panX,state.zoom,stage.clientWidth);state.panY=clampPan(state.panY,state.zoom,stage.clientHeight);renderMap();});
}
async function loadMeasured(){try{const response=await fetch('./public/data/mission-pack.json',{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const measured=validateMissionPack(await response.json());const selected=selectMissionData(demo,measured,location.search);if(selected.kind==='measured'){state.data=selected.terrain;state.kind='measured';state.waypoints=measured.waypoints;state.start={...measured.start};state.destination=measured.waypoints[0];state.presetId=state.destination.id;state.hazards=false;state.layer='optical';}renderDataset();calculateRoutes();renderScience();if(state.kind==='measured')await loadLibrary();else renderMissionLibrary();}catch(error){console.warn('Measured pack unavailable; synthetic demo retained',error);renderDataset();calculateRoutes();renderScience();renderMissionLibrary();toast('Measured pack unavailable; synthetic demo active');}}
attach();
// The default measured page never paints synthetic terrain while its pack loads.
if(new URLSearchParams(location.search).get('mode')==='demo'){
  renderDataset();
  calculateRoutes();
}
loadMeasured();
loadScience();
fetch('./build-info.json',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(info=>{if(info?.id)$('#buildId').textContent=`Build: ${info.id}`;}).catch(()=>{});
