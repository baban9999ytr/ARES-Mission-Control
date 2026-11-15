import demo from './data/demo-terrain.json' with {type:'json'};
import {planRoute,isBlocked} from './engine/routing.js';
import {clientPointToCell,clampPan,cellToSvg,stepKeyboardCell} from './engine/map-grid.js';
import {validateMissionPack,validateCompatibleRegion,mapDisplayCoordinates} from './data/mission-pack.js';
import {selectMissionData} from './data/mission-mode.js';
import {validateScienceCatalog,scienceCoverage,coordinateEvidence} from './data/science-catalog.js';
import {fetchDonki,formatDonkiStatus} from './data/donki.js';
import {buildBriefing} from './data/briefing.js';
import {validateMissionLibrary,planMission,buildMissionReport} from './data/mission-library.js';
import {createCustomMission,validateCustomMission,editCustomMission,serializeCustomMission,parseCustomMission,MAX_CUSTOM_STOPS} from './data/mission-builder.js';
import {DEFAULT_MEASURED_LAYERS,updateMeasuredLayers,layerPresentation,elevationScale,elevationGradient} from './data/layer-compositing.js';
import {routeSegments} from './data/route-segments.js';
import {comparisonFacts} from './data/route-comparison.js';
import {visibleRouteModes,routePathsMarkup} from './data/route-visualization.js';
import {JEZERO_LANDMARKS,eligibleLandmarks,projectedToSvg} from './data/landmarks.js';
import {t,locale,setLanguage,applyStaticTranslations} from './i18n.js';

const $=s=>document.querySelector(s);
const DEMO_WAYPOINTS=[
  {id:'delta',name:'Delta escarpment',nameTr:'Delta yamacı',type:'Illustrative study target',typeTr:'Örnek çalışma hedefi',x:61,y:14,code:'EX-01',desc:'Example point on the synthetic map.',descTr:'Sentetik haritadaki örnek nokta.'},
  {id:'rim',name:'Crater rim overlook',nameTr:'Krater kenarı gözlemi',type:'Illustrative study target',typeTr:'Örnek çalışma hedefi',x:66,y:40,code:'EX-02',desc:'Example point on the synthetic map.',descTr:'Sentetik haritadaki örnek nokta.'},
  {id:'basin',name:'Ancient lakebed',nameTr:'Antik göl yatağı',type:'Illustrative study target',typeTr:'Örnek çalışma hedefi',x:43,y:47,code:'EX-03',desc:'Example point on the synthetic map.',descTr:'Sentetik haritadaki örnek nokta.'},
];
const landmarkPreference=()=>{try{return localStorage.getItem('ares.showLandmarks')!=='false';}catch{return true;}};
const state={data:demo,kind:'demo',region:'crop',regionPacks:{crop:null,expanded:null},waypoints:DEMO_WAYPOINTS,start:{x:13,y:29},destination:DEMO_WAYPOINTS[0],presetId:'delta',layer:'optical',layers:{...DEFAULT_MEASURED_LAYERS},mode:'terrain',pick:null,keyboardCell:null,hazards:true,showRoutes:true,routeVisible:{distance:true,terrain:true},showLandmarks:landmarkPreference(),selectedLandmark:null,routes:{distance:null,terrain:null},segments:{distance:[],terrain:[]},inspected:null,inspectionPinned:false,overview:false,zoom:1,panX:0,panY:0,eva:false,activeMission:null,missionLegs:[]};
const OVERVIEW={west:4574000,south:1080000,east:4604000,north:1102500,width:1600,height:1200};
const library={missions:[],loaded:false,error:null,phase:'All',search:''};
const editor={mode:'edit',undo:[],redo:[],drag:null,listDrag:null,selectedStop:null};
const customActive=()=>state.kind==='measured'&&state.activeMission?.phase==='Custom';
const research={catalogs:{jezero:null,global:null},scope:'jezero',selected:null,weatherLoaded:false,weatherResult:null};
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const L=(en,tr)=>locale()==='tr'?tr:en;
const phaseLabel=phase=>locale()==='tr'?({Explorer:'Kaşif',Scientist:'Bilim İnsanı',Commander:'Komutan',Custom:'Özel'}[phase]||phase):phase;
const userError=error=>error.code?t('error.'+error.code):error.message;
const fmtDistance=m=>m>=1000?`${new Intl.NumberFormat(locale(),{maximumFractionDigits:2,minimumFractionDigits:2}).format(m/1000)} km`:`${new Intl.NumberFormat(locale(),{maximumFractionDigits:0}).format(m)} m`;
const fmtSlope=d=>`${new Intl.NumberFormat(locale(),{maximumFractionDigits:1,minimumFractionDigits:1}).format(d)}°`;
const signed=(n,digits=0)=>`${n>=0?'+':''}${new Intl.NumberFormat(locale(),{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n)}`;
const svgPoint=p=>cellToSvg(p,state.data.gridWidth,state.data.gridHeight);
function coordinates(p){if(state.kind==='demo')return `${L('Grid','Grid')} ${p.x}, ${p.y}`;const q=mapDisplayCoordinates(state.data,p),fmt=n=>new Intl.NumberFormat(locale(),{maximumFractionDigits:0,useGrouping:false}).format(n);return `${L('E','D')} ${fmt(q.east)} m · ${L('N','K')} ${fmt(q.north)} m`;}
function announce(message,error=false){$('#pointFeedback').textContent=message;$('#pointFeedback').classList.toggle('error',error);}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('visible'),2500);}
function linePath(route){return route?.cells.map((p,i)=>{const q=svgPoint(p);return `${i?'L':'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`}).join(' ')||'';}
function marker(point,letter,kind){const q=svgPoint(point);return `<g class="map-marker ${kind}" transform="translate(${q.x},${q.y})"><circle r="14"/><text y="1">${letter}</text></g>`;}
function landmarkLayer(bounds){
  if(!state.showLandmarks)return '';
  const points=state.kind==='measured'?JEZERO_LANDMARKS:DEMO_WAYPOINTS;
  return `<g id="permanentLandmarkLayer">${points.map((p,index)=>{
    const q=state.kind==='measured'?projectedToSvg(bounds,p):svgPoint(p);
    if(!q)return '';
    const label=locale()==='tr'?p.nameTr:p.name;
    return `<g class="map-landmark${state.kind==='demo'?' synthetic':''}" data-landmark-id="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="${escapeHtml(label)}" transform="translate(${q.x.toFixed(2)},${q.y.toFixed(2)})"><title>${escapeHtml(label)}</title><circle class="landmark-ring" r="19"/><path class="landmark-symbol" d="M0,-9 L8,0 L0,9 L-8,0 Z"/><circle class="landmark-hit" r="22"/><text class="landmark-label" x="24" y="4">${escapeHtml(state.zoom>=1.5?label:p.code)}</text></g>`;
  }).join('')}</g>`;
}
function openLandmark(id){
  const point=(state.kind==='measured'?JEZERO_LANDMARKS:DEMO_WAYPOINTS).find(p=>p.id===id);
  if(!point)return;
  state.selectedLandmark=id;
  const eligible=state.waypoints.find(p=>p.id===id);
  $('#landmarkName').textContent=locale()==='tr'?point.nameTr:point.name;
  $('#landmarkDescription').textContent=state.kind==='measured'?(locale()==='tr'?point.descTr:point.desc):L('Synthetic illustration; no geographic position.','Sentetik gösterim; coğrafi konum yok.');
  $('#landmarkCoordinates').textContent=state.kind==='measured'?`${L('E','D')} ${point.east} m · ${L('N','K')} ${point.north} m · ESRI:103885`:`${L('Grid','Grid')} ${point.x}, ${point.y}`;
  $('#landmarkAdd').disabled=!eligible;
  $('#landmarkAdd').textContent=state.kind==='demo'?L('Use as destination','Hedef olarak kullan'):t('map.landmarkAdd');
  $('#landmarkAvailability').textContent=eligible?'':L('Outside the selected routeable region. Choose another region before using this point.','Seçili rota bölgesinin dışında. Bu noktayı kullanmadan önce başka bir bölge seçin.');
  $('#landmarkPopup').hidden=false;
}
function setRegion(region,force=false){
  if(state.kind!=='measured'||!state.regionPacks[region]||region===state.region)return;
  if(customActive()&&!force){$('#regionSelect').value=state.region;announce(L('Save or exit the custom mission before changing route regions.','Rota bölgesini değiştirmeden önce özel görevi kaydedin veya görevden çıkın.'),true);return;}
  state.region=region;state.data=state.regionPacks[region];state.waypoints=eligibleLandmarks(state.data);
  state.activeMission=null;state.missionLegs=[];state.start={...(state.waypoints.find(p=>p.id==='base')??state.data.start)};state.destination=state.waypoints[1]??state.waypoints[0];state.presetId=state.destination?.id??null;
  state.overview=false;state.zoom=1;state.panX=0;state.panY=0;state.selectedLandmark=null;$('#landmarkPopup').hidden=true;
  editor.mode='navigate';editor.undo=[];editor.redo=[];$('#regionSelect').value=region;
  renderDataset();calculateRoutes();renderMissionLibrary();
  announce(L(`Route region: ${region==='crop'?'3.2 × 2.4':'6.4 × 4.8'} km measured CTX.`,`Rota bölgesi: ${region==='crop'?'3,2 × 2,4':'6,4 × 4,8'} km ölçümlü CTX.`));
}
function calculateRoutes(){
  if(state.kind==='measured'&&state.activeMission){
    const plan=planMission(state.data,state.activeMission);
    if(plan){state.missionLegs=plan.legs;state.routes=plan.routes;}
    else{state.missionLegs=[];state.routes={distance:null,terrain:null};announce(L('One or more mission legs have no valid measured-CTX route.','Bir veya daha fazla görev ayağı için geçerli ölçümlü CTX rotası yok.'),true);}
  }else{
    state.missionLegs=[];
    const hazard=state.kind==='demo'&&state.hazards;
    state.routes.distance=planRoute(state.data,state.start,state.destination,'distance',hazard);
    state.routes.terrain=planRoute(state.data,state.start,state.destination,'terrain',hazard);
  }
  state.segments={distance:routeSegments(state.routes.distance,state.data,state.missionLegs),terrain:routeSegments(state.routes.terrain,state.data,state.missionLegs)};
  state.inspected=null;state.inspectionPinned=false;
  renderMap();renderComparison();
}
function inspectSegment(mode,index,pin=false){
  const segment=state.segments[mode]?.[index];
  if(!segment){state.inspected=null;state.inspectionPinned=false;$('#segmentInspection').hidden=true;$('#segmentSelect').value='';updateInspectedHighlight();return;}
  state.inspected={mode,index};state.inspectionPinned=pin;
  const format=value=>new Intl.NumberFormat(locale(),{maximumFractionDigits:1}).format(value);
  $('#segmentInspection').hidden=false;
  $('#segmentInspection').innerHTML=`<strong>${t('segment.title',{number:segment.number,mode:t(mode==='distance'?'compare.shortest':'compare.terrain')})}</strong><dl><div><dt>${t('segment.length')}</dt><dd>${format(segment.lengthMeters)} m</dd></div><div><dt>${t('segment.start')}</dt><dd>${format(segment.startElevation)} m</dd></div><div><dt>${t('segment.end')}</dt><dd>${format(segment.endElevation)} m</dd></div><div><dt>${t('segment.mean')}</dt><dd>${format(segment.endpointMeanElevation)} m</dd></div><div><dt>${t('segment.change')}</dt><dd>${segment.elevationChange>=0?'+':''}${format(segment.elevationChange)} m</dd></div><div><dt>${t('segment.slope')}</dt><dd>${format(segment.slopeDegrees)}°</dd></div><div><dt>${t('segment.cumulative')}</dt><dd>${format(segment.cumulativeMeters)} m</dd></div>${segment.leg?`<div><dt>${t('segment.leg')}</dt><dd>${segment.leg}</dd></div>`:''}</dl><small>${t('segment.caveat')}</small>`;
  $('#segmentSelect').value=`${mode}:${index}`;
  updateInspectedHighlight();
}
function updateInspectedHighlight(){
  const path=$('#inspectedRoutePath');if(!path)return;
  const s=state.inspected&&state.segments[state.inspected.mode]?.[state.inspected.index];
  if(!s||!state.showRoutes||!state.routeVisible[state.inspected.mode]||state.overview){path.setAttribute('d','');return;}
  const a=svgPoint(s.from),b=svgPoint(s.to);
  path.setAttribute('d',`M${a.x.toFixed(2)},${a.y.toFixed(2)}L${b.x.toFixed(2)},${b.y.toFixed(2)}`);
}
function renderMap(){
  const d=state.data;const stage=$('#mapStage');const world=$('#mapWorld');
  world.style.setProperty('--zoom',state.zoom);world.style.setProperty('--pan-x',`${state.panX}px`);world.style.setProperty('--pan-y',`${state.panY}px`);
  const demoFiles={optical:'mars-demo-terrain.webp',elevation:'mars-demo-elevation.webp',thermal:'mars-demo-thermal.webp'};
  const optical=$('#terrainImage'),elevation=$('#elevationImage');
  if(state.overview&&state.kind==='measured'){
    const overviewOptical='./public/data/ctx-overview-optical.webp',overviewElevation='./public/data/ctx-overview-elevation.webp';
    if(optical.getAttribute('src')!==overviewOptical)optical.src=overviewOptical;
    if(elevation.getAttribute('src')!==overviewElevation)elevation.src=overviewElevation;
    optical.hidden=!state.layers.optical;elevation.hidden=!state.layers.elevation;
    elevation.style.opacity=String(state.layers.optical?state.layers.opacity/100:1);
    elevation.style.mixBlendMode=state.layers.blend==='color'?'color':'normal';
    optical.alt='Measured MRO CTX Jezero regional overview';
    const b=d.boundsMeters,x=(b.west-OVERVIEW.west)/(OVERVIEW.east-OVERVIEW.west)*1000,
      y=(OVERVIEW.north-b.north)/(OVERVIEW.north-OVERVIEW.south)*750,
      w=(b.east-b.west)/(OVERVIEW.east-OVERVIEW.west)*1000,
      h=(b.north-b.south)/(OVERVIEW.north-OVERVIEW.south)*750;
    $('#mapSvg').innerHTML=`<rect class="overview-crop" x="${x}" y="${y}" width="${w}" height="${h}"/><text class="overview-label" x="${x+6}" y="${y-8}">${locale()==='tr'?'Doğrulanmış rota bölgesi':'Verified routing region'}</text>${landmarkLayer(OVERVIEW)}`;
    $('#mapLayerLabel').textContent=L('Measured CTX regional context · routing within outlined region','Ölçümlü CTX bölgesel görünümü · rota çizili bölgede');
    $('#elevationLegend').hidden=!state.layers.elevation;
    $('#scaleBar').hidden=false;$('#scaleBar').style.width=`${5000/(OVERVIEW.east-OVERVIEW.west)*stage.clientWidth*state.zoom}px`;$('#scaleText').textContent='5 km';
    $('#zoomPct').textContent=`${Math.round(state.zoom*100)}%`;
    return;
  }
  if(state.kind==='measured'){
    const presentation=layerPresentation(state.layers);
    const opticalSrc=`./public/${d.layers.optical.path}`,elevationSrc=`./public/${d.layers.elevation.path}`;
    if(optical.getAttribute('src')!==opticalSrc)optical.setAttribute('src',opticalSrc);
    if(elevation.getAttribute('src')!==elevationSrc)elevation.setAttribute('src',elevationSrc);
    optical.hidden=!presentation.opticalVisible;elevation.hidden=!presentation.elevationVisible;
    elevation.style.opacity=String(presentation.elevationOpacity);
    elevation.style.mixBlendMode=presentation.blendMode;
    optical.alt=L('MRO CTX optical imagery · registered Jezero crop','MRO CTX optik görüntüsü · kayıtlı Jezero alanı');
    $('#mapLayerLabel').textContent=state.layers.optical&&state.layers.elevation?L(`CTX optical + measured elevation · ${state.layers.opacity}%`,`CTX optik + ölçümlü yükseklik · %${state.layers.opacity}`):state.layers.optical?L('MRO CTX optical imagery','MRO CTX optik görüntüsü'):L('Measured CTX elevation colors','Ölçümlü CTX yükseklik renkleri');
    $('#elevationLegend').hidden=!state.layers.elevation;
  }else{
    const src=`./public/${demoFiles[state.layer]}`;
    if(optical.getAttribute('src')!==src)optical.setAttribute('src',src);
    optical.hidden=false;elevation.hidden=true;
    optical.alt=`Synthetic ${state.layer} illustration`;
    $('#mapLayerLabel').textContent=state.layer==='thermal'?L('Synthetic thermal illustration','Sentetik termal gösterim'):L(`Synthetic ${state.layer} illustration`,`Sentetik ${{optical:'optik',elevation:'yükseklik',thermal:'termal'}[state.layer]} gösterimi`);
    $('#elevationLegend').hidden=true;
  }
  const paths=visibleRouteModes(state.routes,state.routeVisible,state.showRoutes);
  let svg='<defs><pattern id="unknown" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#15242d"/><path d="M0 0V6" stroke="#bdbdbd" stroke-width="2"/></pattern></defs>';
  if(state.kind==='measured')for(let y=0;y<d.gridHeight;y++)for(let x=0;x<d.gridWidth;x++)if(d.heights[y*d.gridWidth+x]===null)svg+=`<rect x="${x/d.gridWidth*1000}" y="${y/d.gridHeight*750}" width="${1000/d.gridWidth}" height="${750/d.gridHeight}" fill="url(#unknown)"/>`;
  if(state.kind==='demo'&&state.hazards)for(const h of d.hazards)svg+=`<circle class="hazard-cell" cx="${(h.x+.5)/d.gridWidth*1000}" cy="${(h.y+.5)/d.gridHeight*750}" r="${h.radius/d.gridWidth*1000}"/>`;
  svg+=routePathsMarkup(state.routes,state.routeVisible,state.showRoutes,linePath);
  for(const mode of [...paths].reverse())for(const [index,segment] of state.segments[mode].entries()){
    const a=svgPoint(segment.from),b=svgPoint(segment.to);
    svg+=`<path class="route-hit" data-segment-mode="${mode}" data-segment-index="${index}" d="M${a.x.toFixed(2)},${a.y.toFixed(2)}L${b.x.toFixed(2)},${b.y.toFixed(2)}"/>`;
  }
  svg+='<path id="inspectedRoutePath" class="route-inspected" d=""/>';
  svg+=landmarkLayer(d.boundsMeters);
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
    svg+=marker(state.start,'S','start')+marker(state.destination,'D','destination');
  }
  if((state.pick||customActive()&&editor.mode==='add')&&state.keyboardCell)svg+=marker(state.keyboardCell,'+','keyboard-cursor');
  $('#mapSvg').innerHTML=svg;
  updateInspectedHighlight();
  $('#zoomPct').textContent=`${Math.round(state.zoom*100)}%`;
  if(state.kind==='measured'){$('#scaleBar').hidden=false;$('#scaleBar').style.width=`${400/(d.gridWidth*d.cellMeters)*stage.clientWidth*state.zoom}px`;$('#scaleText').textContent='400 m';}else{$('#scaleBar').hidden=true;$('#scaleText').textContent=L('Illustrative grid','Örnek grid');}
}
function renderComparison(){
  $('#recommendedDemo').hidden=state.kind!=='measured';
  for(const mode of ['distance','terrain']){const r=state.routes[mode];$(`#${mode}Distance`).textContent=r?fmtDistance(r.meters):L('No route','Rota yok');$(`#${mode}Slope`).textContent=r?fmtSlope(r.maxSlope):'—';$(`#${mode}Ascent`).textContent=r?`${new Intl.NumberFormat(locale(),{maximumFractionDigits:0}).format(r.ascending)} m`:'—';}
  document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode)));
  const a=state.routes.distance,b=state.routes.terrain,selected=state.routes[state.mode];
  $('#routeContext').textContent=state.activeMission?state.activeMission.id+' · '+state.missionLegs.length+L(' fixed-order A* legs · ',' sabit sıralı A* ayağı · ')+coordinates(state.destination):`${state.presetId?L('Illustrative example destination','Örnek hedef'):L('Custom map destination','Özel harita hedefi')} · ${coordinates(state.destination)}`;
  $('#routeExplainer').textContent=!selected?L('No route exists through the available cells. Choose two valid points.','Kullanılabilir hücrelerden rota bulunamadı. İki geçerli nokta seçin.'):state.kind==='measured'?L('Both routes use sampled CTX DEM elevations. Terrain preferred adds an illustrative slope cost; shortest minimizes grid distance. Neither assesses safety.','İki rota da örneklenmiş CTX yüksekliklerini kullanır. Arazi önceliği örnek eğim maliyeti ekler; en kısa rota grid mesafesini azaltır. Hiçbiri güvenliği değerlendirmez.'):L('Both routes use synthetic height values. Terrain preferred adds an illustrative slope cost.','İki rota da sentetik yükseklikleri kullanır. Arazi önceliği örnek eğim maliyeti ekler.');
  const facts=comparisonFacts(a,b,state.data,state.missionLegs);
  const slopeValue=facts?new Intl.NumberFormat(locale(),{maximumFractionDigits:1}).format(Math.abs(facts.slopeReduction)):'0';
  const distancePhrase=facts?Math.abs(facts.distanceDelta)<.5?L('the same length','aynı uzunlukta'):L(`${Math.round(facts.distanceDelta)} m longer`,`${Math.round(facts.distanceDelta)} m daha uzun`):'';
  $('#routeDifference').textContent=!facts?L('No comparison is available for these points.','Bu noktalar için karşılaştırma yok.'):facts.identical?L('Both planning objectives selected the same grid route for these endpoints.','İki planlama amacı da bu uç noktalar için aynı grid rotasını seçti.'):facts.meaningful?L(`Terrain-preferred is ${distancePhrase}, ${facts.slopeReduction>=0?'reduces':'increases'} maximum sampled step slope by ${slopeValue}°, and ${facts.ascentReduction>=0?'reduces':'increases'} ascent by ${Math.abs(Math.round(facts.ascentReduction))} m.`,`Arazi öncelikli rota ${distancePhrase}; maksimum örneklenmiş adım eğimini ${slopeValue}° ${facts.slopeReduction>=0?'azaltıyor':'artırıyor'} ve toplam yükselişi ${Math.abs(Math.round(facts.ascentReduction))} m ${facts.ascentReduction>=0?'azaltıyor':'artırıyor'}.`):L(`The routes follow different grid cells, but their distance and sampled metrics are similar: ${Math.round(facts.distanceDelta)} m distance difference, ${new Intl.NumberFormat(locale(),{maximumFractionDigits:1}).format(facts.slopeReduction)}° step-slope difference.`,`Rotalar farklı grid hücrelerini izliyor, ancak mesafe ve örneklenmiş ölçüleri benzer: ${Math.round(facts.distanceDelta)} m mesafe, ${new Intl.NumberFormat(locale(),{maximumFractionDigits:1}).format(facts.slopeReduction)}° adım eğimi farkı.`);
  $('#routeOverlap').textContent=facts?L(`${facts.shared} shared segments (${facts.sharedPercent}%). ${facts.identical?'Both routes were calculated and overlap completely.':'Shared sections retain identical coordinates.'}`,`${facts.shared} ortak bölüm (%${facts.sharedPercent}). ${facts.identical?'İki rota da hesaplandı ve tamamen çakışıyor.':'Ortak bölümler aynı koordinatları koruyor.'}`):'';
  $('#segmentSelect').innerHTML=`<option value="">${t('segment.choose')}</option>`+['distance','terrain'].flatMap(mode=>state.segments[mode].map((s,index)=>`<option value="${mode}:${index}">${t(mode==='distance'?'compare.shortest':'compare.terrain')} · ${s.number}${s.leg?` · ${t('segment.leg')} ${s.leg}`:''}</option>`)).join('');
  if(state.inspected)inspectSegment(state.inspected.mode,state.inspected.index,state.inspectionPinned);else $('#segmentInspection').hidden=true;
  $('#startCoordinates').textContent=coordinates(state.start);$('#destinationCoordinates').textContent=coordinates(state.destination);
  $('#evaTarget').textContent=state.presetId?locale()==='tr'?state.destination.nameTr||state.destination.name:state.destination.name:L('Custom destination','Özel hedef');$('#evaDistance').textContent=selected?fmtDistance(selected.meters):'—';$('#evaSlope').textContent=selected?fmtSlope(selected.maxSlope):'—';$('#evaHeading').textContent=state.activeMission&&state.missionLegs.length>1?'—':`${Math.round((Math.atan2(state.destination.x-state.start.x,state.start.y-state.destination.y)*180/Math.PI+360)%360)}°`;
  $('#waypoints').innerHTML=state.waypoints.map(p=>`<div class="preset-row"><button type="button" class="waypoint ${state.presetId===p.id?'active':''}" data-waypoint="${escapeHtml(p.id)}" aria-pressed="${state.presetId===p.id}"><strong>${escapeHtml(locale()==='tr'?p.nameTr||p.name:p.name)}</strong><small>${escapeHtml(locale()==='tr'?p.typeTr||p.type:p.type)} · ${escapeHtml(p.code)}</small></button>${state.kind==='measured'?`<button type="button" class="preset-add" data-preset-add="${escapeHtml(p.id)}" title="${locale()==='tr'?'Görev durağı olarak ekle':'Add as mission stop'}">${t('segment.stop')}</button>`:''}</div>`).join('');
  const preset=state.waypoints.find(p=>p.id===state.presetId);
  $('#presetDetail').textContent=preset?`${locale()==='tr'?preset.descTr||preset.desc:preset.desc} · ${coordinates(preset)}`:state.kind==='measured'?locale()==='tr'?'Tüm noktalar ölçümlü CTX arazisindeki örnek planlama senaryolarıdır.':'All points are illustrative planning scenarios on measured CTX terrain.':locale()==='tr'?'Sentetik örnek noktalar.':'Synthetic example points.';
  renderMissionSummary();
}
function renderDataset(){const d=state.data,measured=state.kind==='measured';
  $('.region-picker').hidden=!measured;$('#regionSelect').value=state.region;
  $('#regionSelect option[value="expanded"]').disabled=!state.regionPacks.expanded;
  const headerContext=$('.header-context');if(headerContext?.firstChild)headerContext.firstChild.textContent=measured?state.region==='expanded'?L('Jezero CTX expanded sector ','Jezero CTX genişletilmiş bölge '):L('Jezero CTX study crop ','Jezero CTX çalışma alanı '):L('Synthetic demo ','Sentetik gösterim ');
  $('#overviewToggle').hidden=!measured;
  $('#overviewToggle').textContent=state.overview?t('map.back'):t('map.overview');
  $('#datasetName').textContent=measured?L(d.site,'Jezero CTX ölçümlü çalışma alanı'):L('Synthetic Jezero demonstration','Sentetik Jezero gösterimi');$('#datasetSummary').textContent=measured?L(`USGS CTX optical mosaic and DEM · ${state.region==='expanded'?'6.4 × 4.8 km route sector':'3.2 × 2.4 km study crop'}. Routes use a sampled 40 m grid.`,`USGS CTX optik mozaik ve DEM · ${state.region==='expanded'?'6,4 × 4,8 km rota bölgesi':'3,2 × 2,4 km çalışma alanı'}. Rotalar örneklenmiş 40 m grid kullanır.`):L('Illustrative map and height grid; not geographically registered.','Örnek harita ve yükseklik gridi; coğrafi kayıtlı değildir.');
  $('#dataTag').textContent=measured?L('Measured CTX','Ölçümlü CTX'):L('Synthetic demo','Sentetik demo');$('#dataStatus').textContent=$('#dataTag').textContent;$('#mapHeading').textContent=measured?t(state.overview?'map.overviewTitle':state.region==='expanded'?'map.expandedTitle':'map.cropTitle'):L('Synthetic Jezero terrain','Sentetik Jezero arazisi');$('#mapSubheading').textContent=measured?t(state.overview?'map.overviewSubtitle':state.region==='expanded'?'map.expandedSubtitle':'map.cropSubtitle'):L('Illustrative map · Select a point tool to explore','Örnek harita · Keşfetmek için nokta aracı seçin');
  $('#datasetSwitch').hidden=false;$('#datasetSwitch').textContent=measured?L('Switch to synthetic demo','Sentetik demoya geç'):L('Switch to measured CTX','Ölçümlü CTX’e geç');
  if(measured){
    $('#layerIcons').innerHTML=`<label class="layer-check"><input type="checkbox" data-layer-visibility="optical" aria-label="${L('Optical imagery','Optik görüntü')}"><span>${L('Optical imagery','Optik görüntü')}<small>${L('Registered MRO CTX crop','Kayıtlı MRO CTX alanı')}</small></span></label><label class="layer-check"><input type="checkbox" data-layer-visibility="elevation" aria-label="${L('Elevation colors','Yükseklik renkleri')}"><span>${L('Elevation colors','Yükseklik renkleri')}<small>${L('Sampled CTX DEM','Örneklenmiş CTX DEM')}</small></span></label><label class="layer-opacity-label" for="layerOpacity">${L('Elevation opacity','Yükseklik opaklığı')} <output id="layerOpacityValue" for="layerOpacity">45%</output></label><input id="layerOpacity" type="range" min="0" max="100" step="1" value="45" aria-label="${L('Elevation opacity','Yükseklik opaklığı')}"><label class="layer-opacity-label" for="layerBlend">${L('Presentation','Sunum')}</label><select id="layerBlend" aria-label="${L('Elevation blend presentation','Yükseklik karışım sunumu')}"><option value="color">${L('Preserve optical detail','Optik ayrıntıyı koru')}</option><option value="alpha">${L('Standard overlay','Standart bindirme')}</option></select><p class="layer-unavailable">${L('Thermal','Termal')} <small>${L('Unavailable: no registered CTX thermal raster','Kullanılamaz: kayıtlı CTX termal raster yok')}</small></p>`;
    syncMeasuredLayerControls();
    const scale=elevationScale(d.heights);
    $('#elevationRamp').style.background=elevationGradient();
    $('#legendMin').textContent=`${new Intl.NumberFormat(locale(),{minimumFractionDigits:1,maximumFractionDigits:1}).format(scale.min)} m`;
    $('#legendMax').textContent=`${new Intl.NumberFormat(locale(),{minimumFractionDigits:1,maximumFractionDigits:1}).format(scale.max)} m`;
    $('#legendReference').textContent=d.verticalReference.replace(/radius (\d+) m/,(_,radius)=>`R ${Number(radius).toLocaleString(locale())} m`).replace(' (source DEM XML)',' (DEM XML)').replace(', R ',' · R ');
    const format=n=>new Intl.NumberFormat(locale(),{minimumFractionDigits:1,maximumFractionDigits:1}).format(n);
    $('#legendMethod').textContent=L(`40 m sampled DEM grid. Colors clip at ${format(scale.low)}–${format(scale.high)} m (2nd–98th percentile). Display pixels interpolate grid samples; they are not independent measurements.`,`40 m örneklenmiş DEM gridi. Renkler ${format(scale.low)}–${format(scale.high)} m aralığında (%2–%98 yüzdelikleri) kırpılır. Görüntü pikselleri grid örneklerinden türetilir; bağımsız ölçümler değildir.`);
  }else $('#layerIcons').innerHTML=['optical','elevation','thermal'].map(name=>`<button type="button" data-layer="${name}" class="layer-option ${state.layer===name?'active':''}" aria-pressed="${state.layer===name}"><span><strong>${L(name[0].toUpperCase()+name.slice(1),{optical:'Optik',elevation:'Yükseklik',thermal:'Termal'}[name])}</strong><small>${L('Synthetic illustration','Sentetik gösterim')}</small></span></button>`).join('');
  $('#hazardToggle').checked=state.hazards;$('#hazardToggle').disabled=measured;$('#hazardToggleLabel').textContent=measured?L('No verified hazard layer','Doğrulanmış tehlike katmanı yok'):L('Synthetic hazard zones','Sentetik tehlike bölgeleri');$('#hazardRow').hidden=measured;
  $('#sourceOrg').textContent=measured?'USGS Astrogeology · MRO CTX':L('Synthetic illustration','Sentetik gösterim');$('#opticalResolution').textContent=measured?L('6 m source pixels','6 m kaynak pikseli'):L('Illustrative','Örnek');$('#demResolution').textContent=measured?L('20 m source pixels','20 m kaynak pikseli'):L('Synthetic','Sentetik');$('#gridResolution').textContent=measured?`${d.cellMeters} m ${L('route cells','rota hücreleri')}`:L('Illustrative','Örnek');$('#coverage').textContent=measured?`${new Intl.NumberFormat(locale(),{maximumFractionDigits:1}).format((d.boundsMeters.east-d.boundsMeters.west)/1000)} × ${new Intl.NumberFormat(locale(),{maximumFractionDigits:1}).format((d.boundsMeters.north-d.boundsMeters.south)/1000)} km · ${d.quality.validCells}/${d.quality.totalCells} DEM ${L('cells','hücre')}`:L('Not geographically registered','Coğrafi kayıtlı değil');
  $('#scientificNote').textContent=measured?L('40 m grid slopes are endpoint differences from sampled DEM heights; no terrain safety validation.','40 m grid eğimleri örneklenmiş DEM uç noktalarının farkıdır; arazi güvenliği doğrulanmamıştır.'):L('Synthetic demonstration; no measured thermal or hazard assessment.','Sentetik gösterim; ölçümlü termal veya tehlike değerlendirmesi yok.');
  $('#dataDialogText').textContent=measured?JSON.stringify({dataset:d.site,sourceOrganization:'USGS Astrogeology / MRO CTX',crs:d.crsWkt,boundsMeters:d.boundsMeters,verticalUnits:d.verticalUnits,verticalReference:d.verticalReference,sourceResolution:d.quality.sourceResolution,routingGridMeters:d.cellMeters,validCells:d.quality.validCells,totalCells:d.quality.totalCells,sources:Object.fromEntries(Object.entries(d.layers).map(([k,v])=>[k,v.source])),limitations:d.notice},null,2):L('Synthetic procedural demo. Terrain, heights, thermal color, hazards and waypoints are illustrative. No measured elevations or registered Mars coordinates.','Sentetik yöntemsel gösterim. Arazi, yükseklik, termal renk, tehlike ve duraklar örnektir. Ölçümlü yükseklik veya kayıtlı Mars koordinatları yoktur.');
}
function syncMeasuredLayerControls(){
  if(state.kind!=='measured')return;
  for(const name of ['optical','elevation']){
    const input=$(`[data-layer-visibility="${name}"]`);
    input.checked=state.layers[name];
    input.disabled=state.layers[name]&&!state.layers[name==='optical'?'elevation':'optical'];
  }
  $('#layerOpacity').value=String(state.layers.opacity);
  $('#layerOpacity').disabled=!state.layers.optical||!state.layers.elevation;
  $('#layerOpacityValue').textContent=state.layers.optical?`${state.layers.opacity}%`:L('100% (elevation only)','%100 (yalnızca yükseklik)');
  $('#layerBlend').value=state.layers.blend;
  $('#layerBlend').disabled=!state.layers.optical||!state.layers.elevation;
}
function setMeasuredLayers(change){
  try{state.layers=updateMeasuredLayers(state.layers,change);$('#layerFeedback').textContent='';}
  catch(error){$('#layerFeedback').textContent=error.message;}
  syncMeasuredLayerControls();renderMap();
}
function setLayer(name){if(state.kind!=='demo')return;state.layer=name;document.querySelectorAll('[data-layer]').forEach(b=>{b.classList.toggle('active',b.dataset.layer===name);b.setAttribute('aria-pressed',String(b.dataset.layer===name));});renderMap();}
function setPick(which){state.pick=state.pick===which?null:which;state.keyboardCell=state.pick?{...(state.pick==='start'?state.start:state.destination)}:null;for(const [id,mode] of [['pickStart','start'],['pickDestination','destination']]){const b=$(`#${id}`);b.classList.toggle('active',state.pick===mode);b.setAttribute('aria-pressed',String(state.pick===mode));}if(state.pick){const blocked=isBlocked(state.data,state.keyboardCell.x,state.keyboardCell.y,state.kind==='demo'&&state.hazards);announce(L(`Choose ${state.pick} at ${coordinates(state.keyboardCell)}. Use arrow keys and Enter on the map, or click a valid cell.${blocked?' This cell is unavailable.':''}`,`${state.pick==='start'?'Başlangıcı':'Hedefi'} ${coordinates(state.keyboardCell)} konumunda seçin. Haritada oklar ve Enter kullanın veya geçerli hücreye tıklayın.${blocked?' Bu hücre kullanılamıyor.':''}`),blocked);$('#mapStage').focus();}else announce(state.activeMission?L('Mission ready. Drag markers to edit stops; compare both routes at right.','Görev hazır. Durakları düzenlemek için işaretçileri sürükleyin; sağda rotaları karşılaştırın.'):t('mission.begin'));renderMap();}
function setPoint(which,cell){if(!cell){announce(L('Click inside the mapped footprint.','Haritalanan alanın içine tıklayın.'),true);return;}if(isBlocked(state.data,cell.x,cell.y,state.kind==='demo'&&state.hazards)){announce(L('That grid cell has no usable DEM elevation or is inside an enabled demo hazard. Choose another cell.','Bu grid hücresinde kullanılabilir DEM yüksekliği yok veya etkin demo tehlikesi içinde. Başka hücre seçin.'),true);return;}if(state.activeMission){state.activeMission=null;state.missionLegs=[];editor.mode='navigate';editor.undo=[];editor.redo=[];renderMissionLibrary();}if(which==='start')state.start=cell;else{state.destination={...cell,id:'custom',name:'Custom destination',nameTr:'Özel hedef',type:'Map-selected point',code:'CUSTOM',desc:'Selected on the current map grid.'};state.presetId=null;}setPick(null);calculateRoutes();announce(L(`${which==='start'?'Start':'Destination'} set to ${coordinates(cell)}. Routes recalculated.`,`${which==='start'?'Başlangıç':'Hedef'} ${coordinates(cell)} olarak ayarlandı. Rotalar yeniden hesaplandı.`));}
function setZoom(next){const stage=$('#mapStage');state.zoom=Math.max(1,Math.min(3,Math.round(next*10)/10));state.panX=clampPan(state.panX,state.zoom,stage.clientWidth);state.panY=clampPan(state.panY,state.zoom,stage.clientHeight);renderMap();}
function downloadJson(payload,filename){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
function exportBriefing(){if(state.activeMission&&state.missionLegs.length){downloadJson(buildMissionReport({mission:state.activeMission,legs:state.missionLegs,routes:state.routes},state.data,state.mode),'ARES-mission-'+state.activeMission.id+'.json');toast(L('Mission briefing exported','Görev brifingi dışa aktarıldı'));return;}downloadJson(buildBriefing(state),'ARES-route-briefing.json');toast(L('Route briefing exported','Rota brifingi dışa aktarıldı'));}

function renderMissionBuilder(){
  const measured=state.kind==='measured',active=customActive(),mission=state.activeMission;
  $('#missionBuilder').hidden=!measured;
  $('#missionDuplicate').disabled=!measured||!mission||active;
  $('#missionDuplicate').hidden=active;
  $('#missionEditor').hidden=!active;
  $('#mapStage').classList.toggle('mission-adding',active&&editor.mode==='add');
  $('#mapStage').classList.toggle('mission-editing',active&&editor.mode!=='add');
  $('#mapHint').textContent=active&&editor.mode==='add'?L('Click a valid map cell, or use arrow keys and Enter to append a stop · Escape cancels','Geçerli harita hücresine tıklayın veya durak eklemek için oklar ve Enter kullanın · Escape iptal eder'):active?L('Drag a marker to move a stop · Drag background to pan · Scroll to zoom','Durağı taşımak için işaretçiyi, kaydırmak için arka planı sürükleyin · Yakınlaştırmak için tekerlek kullanın'):t('map.dragHint');
  if(!active)return;
  if($('#missionTitle').value!==mission.title)$('#missionTitle').value=mission.title;
  document.querySelectorAll('[data-edit-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.editMode===editor.mode)));
  $('#missionUndo').disabled=editor.undo.length===0;
  $('#missionRedo').disabled=editor.redo.length===0;
  $('#missionAdd').disabled=mission.stops.length>=MAX_CUSTOM_STOPS;
  $('#missionEditorStops').innerHTML=mission.stops.map((p,index)=>{
    const n=mission.stops.length,number=index+1;
    const label=index===0?L('Start','Başlangıç'):index===n-1?L('Destination','Hedef'):L('Stop ','Durak ')+number;
    const location=escapeHtml(coordinates(p));
    return '<div class="mission-editor-row'+(editor.selectedStop===index?' selected':'')+'" data-stop-row="'+index+'">'+
      '<button type="button" class="mission-stop-grip" data-stop-grip="'+index+'" aria-label="'+L('Drag to reorder stop ','Durağı yeniden sıralamak için sürükle ')+number+'">⠿</button>'+
      '<div class="mission-stop-info"><strong>'+escapeHtml(label)+'</strong><small>'+location+'</small></div>'+
      '<div class="mission-stop-controls">'+
        '<button type="button" data-stop-up="'+index+'" aria-label="'+L('Move stop ','Durağı ')+number+L(' earlier',' öne taşı')+'" '+(index===0?'disabled':'')+'>↑</button>'+
        '<button type="button" data-stop-down="'+index+'" aria-label="'+L('Move stop ','Durağı ')+number+L(' later',' arkaya taşı')+'" '+(index===n-1?'disabled':'')+'>↓</button>'+
        '<button type="button" data-stop-remove="'+index+'" aria-label="'+L('Remove stop ','Durağı kaldır ')+number+'" '+(n<=2?'disabled':'')+'>×</button>'+
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
    $('#missionEditorStatus').textContent=L(`Mission updated · ${next.stops.length} ordered stops · both route modes recalculated.`,`Görev güncellendi · ${next.stops.length} sıralı durak · iki rota modu yeniden hesaplandı.`);
  }catch(error){
    $('#missionEditorStatus').textContent=userError(error);
    announce(userError(error),true);
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
  $('#missionEditorStatus').textContent=L('Restored prior mission state and recalculated routes.','Önceki görev durumu geri yüklendi ve rotalar yeniden hesaplandı.');
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
  $('#missionStatus').textContent=state.kind!=='measured'?L('Mission editing requires measured CTX. Switch datasets in Advanced.','Görev düzenlemek için ölçümlü CTX gerekir. Gelişmiş bölümünden veri kümesini değiştirin.'):library.error?L('Catalog unavailable: ','Katalog kullanılamıyor: ')+library.error:library.loaded?t('mission.ready'):L('Loading measured mission catalog…','Ölçümlü görev kataloğu yükleniyor…');
  if(!active){$('#missionList').replaceChildren();$('#missionDetail').textContent=L('These exercises cannot be loaded in synthetic mode.','Bu alıştırmalar sentetik modda yüklenemez.');return;}
  const query=library.search.trim().toLocaleLowerCase(locale());
  const filtered=library.missions.filter(m=>(library.phase==='All'||m.phase===library.phase)&&
    (!query||[m.id,m.title,m.objective,m.researchQuestion,m.title_tr,m.objective_tr,m.researchQuestion_tr].filter(Boolean).some(s=>s.toLocaleLowerCase(locale()).includes(query))));
  $('#missionList').innerHTML=filtered.map(m=>'<button type="button" class="mission-item" data-mission="'+escapeHtml(m.id)+'" aria-pressed="'+(state.activeMission?.id===m.id)+'"><strong><span class="mission-id">'+escapeHtml(m.id)+'</span>'+escapeHtml(locale()==='tr'?m.title_tr||m.title:m.title)+'</strong><small>'+escapeHtml(phaseLabel(m.phase))+' · '+(m.stops.length-1)+L(' fixed-order ',' sabit sıralı ')+L(m.stops.length===2?'leg':'legs','ayak')+'</small></button>').join('')||`<p class="mission-empty">${L('No missions match this filter.','Bu filtreye uyan görev yok.')}</p>`;
  const m=state.activeMission;
  $('#missionDetail').innerHTML=m?'<strong>'+escapeHtml(m.id+' · '+(locale()==='tr'?m.title_tr||m.title:m.title))+'</strong><p>'+escapeHtml(locale()==='tr'?m.objective_tr||m.objective:m.objective)+'</p><p><b>'+L('Research question:','Araştırma sorusu:')+'</b> '+escapeHtml(locale()==='tr'?m.researchQuestion_tr||m.researchQuestion:m.researchQuestion)+'</p><ol>'+m.stops.map((p,i)=>'<li>'+L('Stop ','Durak ')+(i+1)+': '+escapeHtml(coordinates(p))+'</li>').join('')+'</ol><p>'+L('Grid stops are illustrative CTX exercises, not source-verified Jezero science targets.','Grid durakları örnek CTX alıştırmalarıdır; kaynaktan doğrulanmış Jezero bilim hedefleri değildir.')+'</p>':L('Select a mission to load its fixed-order grid stops, compute both route modes and compare leg totals.','Sabit sıralı grid duraklarını yüklemek, iki rota modunu hesaplamak ve ayak toplamlarını karşılaştırmak için görev seçin.');
}
function renderMissionSummary(){
  const m=state.activeMission;
  $('#missionSummary').hidden=!m;
  if(!m)return;
  $('#missionSummaryTitle').textContent=m.id+' · '+(locale()==='tr'?m.title_tr||m.title:m.title);
  $('#missionSummaryNote').textContent=(locale()==='tr'?m.objective_tr||m.objective:m.objective)+' · '+m.stops.length+L(' ordered stops · ',' sıralı durak · ')+state.missionLegs.length+L(' independently planned legs.',' bağımsız planlanmış ayak.');
  $('#missionLegs').innerHTML=state.missionLegs.map(leg=>'<div class="mission-leg"><span>'+L('LEG ','AYAK ')+leg.index+' · '+escapeHtml(leg.from.x+','+leg.from.y)+' → '+escapeHtml(leg.to.x+','+leg.to.y)+'</span><strong>'+fmtDistance(leg[state.mode].meters)+' · '+fmtSlope(leg[state.mode].maxSlope)+'</strong></div>').join('');
}
function selectLibraryMission(id){
  if(state.kind!=='measured'||!library.loaded)return;
  if(state.region!=='crop')setRegion('crop',true);
  const mission=library.missions.find(m=>m.id===id);
  if(!mission)return;
  const plan=planMission(state.data,mission);
  if(!plan){announce(L('This mission cannot be routed on the current measured crop.','Bu görev mevcut ölçümlü alanda yönlendirilemiyor.'),true);return;}
  editor.mode='navigate';editor.undo=[];editor.redo=[];
  state.activeMission=mission;state.missionLegs=plan.legs;
  state.start={...mission.stops[0]};
  state.destination={...mission.stops[mission.stops.length-1],id:mission.id,name:mission.title,type:'Illustrative measured-grid mission',code:mission.id};
  state.presetId=null;
  setPick(null);calculateRoutes();renderMissionLibrary();
  $('#missionDrawer').open=false;$('#missionLibraryOpen').setAttribute('aria-expanded','false');
  announce(L(`Loaded ${mission.id}: ${plan.legs.length} independently routed legs.`,`${mission.id} yüklendi: ${plan.legs.length} bağımsız yönlendirilmiş ayak.`));
}
function clearLibraryMission(){
  if(!state.activeMission||state.kind!=='measured')return;
  editor.mode='navigate';editor.undo=[];editor.redo=[];
  state.activeMission=null;state.missionLegs=[];state.start={...(state.waypoints.find(p=>p.id==='base')??state.data.start)};
  state.destination=state.waypoints[0];state.presetId=state.destination.id;
  calculateRoutes();renderMissionLibrary();announce(L('Returned to default CTX route comparison.','Varsayılan CTX rota karşılaştırmasına dönüldü.'));
}
async function loadLibrary(){
  try{
    const response=await fetch('./data/scenarios/measured-missions.json',{cache:'no-store'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    library.missions=validateMissionLibrary(await response.json(),state.regionPacks.crop);
    library.loaded=true;library.error=null;
    const requested=new URLSearchParams(location.search).get('mission');
    if(requested)selectLibraryMission(requested);
  }catch(error){library.error=error.message;library.loaded=false;console.warn('Mission library unavailable',error);}
  renderMissionLibrary();
}
function renderScience(){
  const catalog=research.catalogs[research.scope],list=$('#scienceList'),detail=$('#scienceDetail');
  if(!catalog){list.textContent=L('Catalog unavailable or still loading.','Katalog kullanılamıyor veya yükleniyor.');detail.textContent='';return;}
  list.innerHTML=catalog.points.map(p=>`<button type="button" data-science="${escapeHtml(p.id)}" class="science-item" aria-pressed="${research.selected===p.id}">${escapeHtml(p.name[locale()])} <small>${escapeHtml(locale()==='tr'?p.geological_category_tr||p.geological_category:p.geological_category)}</small></button>`).join('');
  const p=catalog.points.find(x=>x.id===research.selected);
  if(!p){detail.textContent=L('Select a target to inspect its source and location status.','Kaynağını ve konum durumunu incelemek için hedef seçin.');return;}
  const coverage=research.scope==='global'?{label:L('Global Mars research context. Not eligible for this local map.','Küresel Mars araştırma bağlamı. Bu yerel harita için uygun değil.'),eligible:false}:state.kind!=='measured'?{label:L('Measured CTX map required for coverage check.','Kapsam denetimi için ölçümlü CTX haritası gerekli.'),eligible:false}:scienceCoverage(p,state.data,false);
  const c=p.coordinates,geo=c&&c.latitude!=null?`${c.latitude}° N, ${c.longitude_east}° E ${L('(submitted)','(sunulan)')}`:L('No single coordinate','Tekil koordinat yok');
  const projected=coverage.projected?`E ${coverage.projected.east.toFixed(1)} m · N ${coverage.projected.north.toFixed(1)} m`:'';
  const evidence=coordinateEvidence[p.id];
  const coverageLabel=locale()==='tr'?({outside:'Mevcut harita kapsamı dışında.',nodata:'Bu konumda kullanılabilir DEM yüksekliği yok.',unverified:'Harita içinde; koordinat kaynağı doğrulanmayı bekliyor.','no-point':'Doğrulanmış tek nokta konumu mevcut değil.',eligible:'Ölçümlü harita içinde geçerli DEM hücresi.'}[coverage.status]||coverage.label):coverage.label;
  detail.innerHTML=`<h3>${escapeHtml(p.name[locale()])}</h3><p>${escapeHtml(p.scientific_description[locale()])}</p><dl><dt>${L('Scientific objective','Bilimsel amaç')}</dt><dd>${escapeHtml(locale()==='tr'?p.scientific_target_tr||p.scientific_target:p.scientific_target)}</dd><dt>${L('Coordinate meaning','Koordinat anlamı')}</dt><dd>${escapeHtml(locale()==='tr'?c?.represents_tr||c?.represents||'Bölgesel referans veya kullanılamıyor':c?.represents||'Regional reference or unavailable')}</dd><dt>${L('Submitted coordinate','Sunulan koordinat')}</dt><dd>${escapeHtml(geo)}</dd><dt>${L('Projected position','Projeksiyonlu konum')}</dt><dd>${escapeHtml(projected||L('Unavailable','Kullanılamıyor'))}</dd><dt>${L('Source verification','Kaynak doğrulaması')}</dt><dd>${evidence?`${escapeHtml(L(evidence.status,'NASA gezgin konumu karşılaştırılarak doğrulandı; yüzlek merkezi değil'))} · <a href="${escapeHtml(evidence.url)}" target="_blank" rel="noopener noreferrer">${L('Coordinate evidence ↗','Koordinat kanıtı ↗')}</a>`:L('Candidate claim; original coordinate source not independently authenticated.','Aday iddia; özgün koordinat kaynağı bağımsız doğrulanmadı.')}</dd><dt>${L('Coordinate uncertainty','Koordinat belirsizliği')}</dt><dd>${L('Not quantified in the submitted catalog; point meaning limits interpretation.','Sunulan katalogda nicelenmedi; noktanın anlamı yorumu sınırlar.')}</dd><dt>${L('Map coverage / route eligibility','Harita kapsamı / rota uygunluğu')}</dt><dd><strong>${escapeHtml(coverageLabel)}</strong> ${L('No ARES route generated.','ARES rotası oluşturulmadı.')}</dd><dt>${L('Image attribution','Görüntü atfı')}</dt><dd>${escapeHtml(p.image.credit)} · <a href="${escapeHtml(p.image.url)}" target="_blank" rel="noopener noreferrer">${L('Image source ↗','Görüntü kaynağı ↗')}</a></dd></dl><a href="${escapeHtml(p.nasa_source_url)}" target="_blank" rel="noopener noreferrer">${L('Research source ↗','Araştırma kaynağı ↗')}</a>`;
}
async function loadScience(){
  for(const [scope,file] of [['jezero','jezero-science-points.json'],['global','science-points.json']]){
    try{const response=await fetch(`./${file}`,{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);research.catalogs[scope]=validateScienceCatalog(await response.json(),scope);}catch(error){console.warn(`${scope} catalog unavailable`,error);}
  }
  renderScience();
}
function renderWeather(){
  const result=research.weatherResult;if(!result)return;
  const container=$('#weatherEvents');container.replaceChildren();
  $('#weatherStatus').textContent=formatDonkiStatus(result,locale());
  for(const event of result.events.slice(0,12)){const row=document.createElement('div');row.className='weather-event';const title=document.createElement('strong');title.textContent=`${event.type} · ${new Date(event.time).toLocaleString(locale()==='tr'?'tr-TR':'en-GB',{timeZone:'UTC',dateStyle:'medium',timeStyle:'short'})} UTC`;const sub=document.createElement('small');sub.textContent=`${event.catalog} · ${event.source}`;row.append(title,sub);if(event.link){const a=document.createElement('a');a.href=event.link;a.target='_blank';a.rel='noopener noreferrer';a.textContent=L('Source record ↗','Kaynak kaydı ↗');row.append(a);}container.append(row);}
}
async function loadWeather(){
  const button=$('#weatherRefresh'),status=$('#weatherStatus');button.disabled=true;status.textContent=L('Retrieving FLR, CME and SEP events from NASA DONKI…','NASA DONKI FLR, CME ve SEP olayları getiriliyor…');$('#weatherEvents').replaceChildren();
  try{research.weatherResult=await fetchDonki();renderWeather();}
  catch(error){status.textContent=L('DONKI unavailable. No events are being substituted.','DONKI kullanılamıyor. Yerine olay üretilmiyor.');console.warn('DONKI request failed',error);}finally{button.disabled=false;}
}
function attach(){
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>{setLanguage(button.dataset.language);renderDataset();renderMap();renderComparison();renderMissionLibrary();renderScience();renderWeather();}));
  $('#layerIcons').addEventListener('click',e=>{const b=e.target.closest('[data-layer]');if(b&&!b.disabled)setLayer(b.dataset.layer);});
  $('#layerIcons').addEventListener('change',e=>{if(state.kind!=='measured')return;const name=e.target.dataset.layerVisibility;if(name)setMeasuredLayers({[name]:e.target.checked});else if(e.target.id==='layerBlend')setMeasuredLayers({blend:e.target.value});});
  $('#layerIcons').addEventListener('input',e=>{if(state.kind==='measured'&&e.target.id==='layerOpacity')setMeasuredLayers({opacity:Number(e.target.value)});});
  $('#waypoints').addEventListener('click',e=>{const add=e.target.closest('[data-preset-add]');if(add){const p=state.waypoints.find(x=>x.id===add.dataset.presetAdd);if(!p||state.kind!=='measured')return;try{if(!customActive())installCustomMission(createCustomMission(state.data,state.activeMission,locale()));const last=state.activeMission.stops.at(-1);if(last.x!==p.x||last.y!==p.y)applyCustomEdit({type:'add',point:{x:p.x,y:p.y}});$('#missionEditorStatus').textContent=`${locale()==='tr'?p.nameTr:p.name} · ${coordinates(p)} · ${L('illustrative mission stop.','örnek görev durağı.')}`;}catch(error){announce(userError(error),true);}return;}const b=e.target.closest('[data-waypoint]');if(!b)return;const p=state.waypoints.find(x=>x.id===b.dataset.waypoint);if(p){editor.mode='navigate';editor.undo=[];editor.redo=[];state.activeMission=null;state.missionLegs=[];state.destination=p;state.presetId=p.id;calculateRoutes();renderMissionLibrary();announce(L(`Example destination selected: ${p.name}.`,`Örnek hedef seçildi: ${p.nameTr||p.name}.`));}});
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;renderMap();renderComparison();}));
  $('#segmentSelect').addEventListener('change',e=>{const [mode,index]=e.target.value.split(':');inspectSegment(mode,Number(index),true);});
  $('#pickStart').addEventListener('click',()=>setPick('start'));$('#pickDestination').addEventListener('click',()=>setPick('destination'));
  $('#routeToggle').addEventListener('change',e=>{state.showRoutes=e.target.checked;renderMap();});$('#hazardToggle').addEventListener('change',e=>{state.hazards=e.target.checked;calculateRoutes();});
  $('#landmarkToggle').checked=state.showLandmarks;$('#landmarkToggle').addEventListener('change',e=>{state.showLandmarks=e.target.checked;try{localStorage.setItem('ares.showLandmarks',String(state.showLandmarks));}catch{}if(!state.showLandmarks)$('#landmarkPopup').hidden=true;renderMap();});
  for(const mode of ['distance','terrain']){const input=$(`#${mode}RouteToggle`);input.checked=true;input.addEventListener('change',e=>{state.routeVisible[mode]=e.target.checked;renderMap();});}
  $('#regionSelect').addEventListener('change',e=>setRegion(e.target.value));
  $('#recommendedDemo').addEventListener('click',()=>selectLibraryMission('SC-01'));
  $('#landmarkClose').addEventListener('click',()=>{$('#landmarkPopup').hidden=true;state.selectedLandmark=null;});
  $('#landmarkAdd').addEventListener('click',()=>{const id=state.selectedLandmark;if(!id)return;const button=$(`#waypoints [data-${state.kind==='measured'?'preset-add':'waypoint'}="${id}"]`);button?.click();$('#landmarkPopup').hidden=true;});
  $('#zoomIn').addEventListener('click',()=>setZoom(state.zoom+.2));$('#zoomOut').addEventListener('click',()=>setZoom(state.zoom-.2));$('#panReset').addEventListener('click',()=>{state.zoom=1;state.panX=0;state.panY=0;renderMap();});
  $('#routeButton').addEventListener('click',()=>{calculateRoutes();toast(L('Routes recalculated','Rotalar yeniden hesaplandı'));});$('#briefingExport').addEventListener('click',exportBriefing);
  $('#datasetSwitch').addEventListener('click',()=>{const url=new URL(location.href);if(state.kind==='measured')url.searchParams.set('mode','demo');else url.searchParams.delete('mode');location.href=url.href;});
  $('#overviewToggle').addEventListener('click',()=>{state.overview=!state.overview;state.zoom=1;state.panX=0;state.panY=0;const active=state.overview;$('#overviewToggle').setAttribute('aria-pressed',String(active));$('#segmentInspection').hidden=active;renderDataset();renderMap();});
  $('#missionPhase').addEventListener('change',e=>{library.phase=e.target.value;renderMissionLibrary();});
  $('#missionSearch').addEventListener('input',e=>{library.search=e.target.value;renderMissionLibrary();});
  $('#missionLibraryOpen').addEventListener('click',()=>{$('#missionDrawer').open=!$('#missionDrawer').open;$('#missionLibraryOpen').setAttribute('aria-expanded',String($('#missionDrawer').open));if($('#missionDrawer').open)$('#missionSearch').focus();});
  $('#missionDrawer').addEventListener('toggle',()=>$('#missionLibraryOpen').setAttribute('aria-expanded',String($('#missionDrawer').open)));
  $('#missionList').addEventListener('click',e=>{const b=e.target.closest('[data-mission]');if(b)selectLibraryMission(b.dataset.mission);});
  $('#missionClear').addEventListener('click',clearLibraryMission);
  $('#missionNew').addEventListener('click',()=>{
    if(state.kind==='measured'){
      installCustomMission(createCustomMission(state.data,null,locale()));
      $('#missionEditorStatus').textContent=L('New custom mission created. Drag stops or select Add stop on map.','Yeni özel görev oluşturuldu. Durakları sürükleyin veya haritadan Durak Ekle seçin.');
    }
  });
  $('#missionDuplicate').addEventListener('click',()=>{
    if(state.kind==='measured'&&state.activeMission&&!customActive()){
      const base=state.activeMission;
      installCustomMission(createCustomMission(state.data,base,locale()));
      $('#missionEditorStatus').textContent=L(`Duplicated ${base.id} into an editable custom mission. The original catalog is unchanged.`,`${base.id} düzenlenebilir özel görev olarak kopyalandı. Özgün katalog değişmedi.`);
    }
  });
  $('#missionTitle').addEventListener('change',e=>applyCustomEdit({type:'rename',title:e.target.value}));
  document.querySelectorAll('[data-edit-mode]').forEach(button=>button.addEventListener('click',()=>{
    if(!customActive())return;
    if(button.dataset.editMode==='add'&&state.activeMission.stops.length>=MAX_CUSTOM_STOPS)return;
    editor.mode=button.dataset.editMode;
    if(editor.mode==='add'){state.keyboardCell={...state.activeMission.stops.at(-1)};$('#mapStage').focus();}
    renderMissionBuilder();renderMap();
    $('#missionEditorStatus').textContent=editor.mode==='add'?L('Click a valid measured CTX cell to append a stop.','Durak eklemek için geçerli ölçümlü CTX hücresine tıklayın.'):editor.mode==='edit'?L('Drag a numbered map stop to move it. Background drag still pans.','Numaralı harita durağını taşımak için sürükleyin. Arka plan sürüklenince harita kayar.'):L('Drag the map background to pan without moving stops.','Durakları taşımadan kaydırmak için harita arka planını sürükleyin.');
  }));
  $('#missionUndo').addEventListener('click',()=>restoreCustomHistory(editor.undo,editor.redo));
  $('#missionRedo').addEventListener('click',()=>restoreCustomHistory(editor.redo,editor.undo));
  $('#missionSave').addEventListener('click',()=>{
    if(!customActive())return;
    downloadJson(serializeCustomMission(state.activeMission,state.data),'ARES-custom-mission.json');
    $('#missionEditorStatus').textContent=L('Saved editable mission blueprint as JSON.','Düzenlenebilir görev taslağı JSON olarak kaydedildi.');
  });
  $('#missionImport').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      if(file.size>100000)throw Object.assign(new Error('Mission JSON exceeds 100 KB limit.'),{code:'fileSize'});
      if(state.kind!=='measured')throw Object.assign(new Error('Switch to measured CTX mode before importing.'),{code:'importMeasured'});
      const mission=parseCustomMission(JSON.parse(await file.text()),state.data);
      installCustomMission(mission);
      $('#missionEditorStatus').textContent=L(`Imported editable mission with ${mission.stops.length} stops.`,`${mission.stops.length} duraklı düzenlenebilir görev içe aktarıldı.`);
    }catch(error){$('#missionEditorStatus').textContent=userError(error);announce(userError(error),true);}
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
  $('#fullscreenButton').addEventListener('click',()=>{const el=$('#mapStage');if(!document.fullscreenElement)el.requestFullscreen?.().catch(()=>toast(L('Fullscreen unavailable','Tam ekran kullanılamıyor')));else document.exitFullscreen?.();});
  $('#evaButton').addEventListener('click',()=>{state.eva=!state.eva;document.body.classList.toggle('eva-active',state.eva);$('#evaButton').setAttribute('aria-pressed',String(state.eva));});$('#evaExit').addEventListener('click',()=>{state.eva=false;document.body.classList.remove('eva-active');$('#evaButton').setAttribute('aria-pressed','false');});
  const stage=$('#mapStage');let drag=null;
  stage.addEventListener('wheel',e=>{e.preventDefault();setZoom(state.zoom+(e.deltaY<0?.2:-.2));},{passive:false});
  stage.addEventListener('keydown',e=>{
    const landmark=e.target.closest?.('[data-landmark-id]');
    if(landmark&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openLandmark(landmark.dataset.landmarkId);return;}
    const adding=customActive()&&editor.mode==='add';
    if(e.target!==stage||!state.pick&&!adding)return;
    if(e.key.startsWith('Arrow')){
      e.preventDefault();state.keyboardCell=stepKeyboardCell(state.keyboardCell,e.key,state.data.gridWidth,state.data.gridHeight);
      const blocked=isBlocked(state.data,state.keyboardCell.x,state.keyboardCell.y,state.kind==='demo'&&state.hazards);
      $('#cursorCoordinates').textContent=coordinates(state.keyboardCell);
      announce(`${coordinates(state.keyboardCell)}. ${blocked?L('Unavailable cell; choose another.','Hücre kullanılamıyor; başka seçin.'):adding?L('Press Enter or Space to add this stop.','Bu durağı eklemek için Enter veya Boşluk tuşuna basın.'):L('Press Enter or Space to set '+state.pick+'.',`${state.pick==='start'?'başlangıcı':'hedefi'} ayarlamak için Enter veya Boşluk tuşuna basın.`)}`,blocked);renderMap();
    }else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(adding)applyCustomEdit({type:'add',point:state.keyboardCell});else setPoint(state.pick,state.keyboardCell);}
    else if(e.key==='Escape'){e.preventDefault();if(adding){editor.mode='edit';renderMissionBuilder();renderMap();$('#missionEditorStatus').textContent=L('Add stop canceled.','Durak ekleme iptal edildi.');}else setPick(null);}
  });
  stage.addEventListener('pointerdown',e=>{
    if(e.target.closest('button,.map-scale,.map-layer-label'))return;
    const hit=e.target.closest('[data-segment-mode]');const landmark=e.target.closest('[data-landmark-id]');
    const index=!state.overview&&customActive()&&editor.mode!=='add'?nearestCustomStop(e,stage.getBoundingClientRect()):-1;
    const kind=landmark?'landmark':index>=0?'stop':!state.overview&&customActive()&&editor.mode==='add'?'add':state.pick||state.overview?'pan':hit?'segment':'pan';
    drag={kind,index,landmarkId:landmark?.dataset.landmarkId,pointerId:e.pointerId,x:e.clientX,y:e.clientY,panX:state.panX,panY:state.panY,moved:false,preview:null,segmentMode:hit?.dataset.segmentMode,segmentIndex:Number(hit?.dataset.segmentIndex)};
    editor.drag=kind==='stop'?drag:null;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove',e=>{
    const rect=stage.getBoundingClientRect();
    const cell=state.overview?clientPointToCell(e.clientX,e.clientY,rect,OVERVIEW.width,OVERVIEW.height,state.zoom,state.panX,state.panY):cellUnderPointer(e,stage);
    $('#cursorCoordinates').textContent=cell?state.overview?`${L('E','D')} ${Math.round(OVERVIEW.west+(cell.x+.5)/OVERVIEW.width*(OVERVIEW.east-OVERVIEW.west))} m · ${L('N','K')} ${Math.round(OVERVIEW.north-(cell.y+.5)/OVERVIEW.height*(OVERVIEW.north-OVERVIEW.south))} m · ${L('context only','yalnızca bağlam')}`:coordinates(cell):L('Outside mapped footprint','Haritalanan alanın dışında');
    if(!drag&&e.pointerType==='mouse'&&!state.pick&&!state.inspectionPinned){const hit=e.target.closest('[data-segment-mode]');if(hit&&(!state.inspected||state.inspected.mode!==hit.dataset.segmentMode||state.inspected.index!==Number(hit.dataset.segmentIndex)))inspectSegment(hit.dataset.segmentMode,Number(hit.dataset.segmentIndex));else if(!hit&&state.inspected)inspectSegment('',0);}
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
    if(last.kind==='landmark'&&!last.moved){openLandmark(last.landmarkId);}
    else if(last.kind==='stop'){
      if(last.moved){
        const point=cellUnderPointer(e,stage);
        if(point)applyCustomEdit({type:'move',index:last.index,point});
        else $('#missionEditorStatus').textContent=L('Drag ended outside mapped terrain; stop not moved.','Sürükleme haritalanan alan dışında bitti; durak taşınmadı.');
      }
      else {editor.selectedStop=last.index;renderMissionBuilder();$('#missionEditorStatus').textContent=L(`Stop ${last.index+1} selected. Drag its marker to move it, or use the stop list to reorder or remove it.`,`Durak ${last.index+1} seçildi. Taşımak için işaretçiyi sürükleyin; yeniden sıralamak veya kaldırmak için durak listesini kullanın.`);}
      renderMap();
    }else if(last.kind==='add'&&!last.moved){
      const point=cellUnderPointer(e,stage);
      if(point)applyCustomEdit({type:'add',point});
      else $('#missionEditorStatus').textContent=L('Choose a valid point inside the CTX map.','CTX haritasında geçerli bir nokta seçin.');
    }else if(last.kind==='segment'&&!last.moved){
      inspectSegment(last.segmentMode,last.segmentIndex,true);
      state.mode=last.segmentMode;renderComparison();
    }else if(last.kind==='pan'&&!last.moved&&state.pick){
      setPoint(state.pick,cellUnderPointer(e,stage));
    }
  });
  stage.addEventListener('pointercancel',()=>{drag=null;editor.drag=null;stage.classList.remove('panning','mission-dragging');renderMap();});
  stage.addEventListener('pointerleave',()=>{if(!state.inspectionPinned&&state.inspected)inspectSegment('',0);});
  window.addEventListener('resize',()=>{state.panX=clampPan(state.panX,state.zoom,stage.clientWidth);state.panY=clampPan(state.panY,state.zoom,stage.clientHeight);renderMap();});
}
async function loadMeasured(){
  try{
    const response=await fetch('./public/data/mission-pack.json',{cache:'no-store'});
    if(!response.ok)throw new Error(`CTX pack HTTP ${response.status}`);
    const measured=validateMissionPack(await response.json());
    let expanded=null;
    try{
      const extra=await fetch('./public/data/ctx-expanded-pack.json',{cache:'no-store'});
      if(!extra.ok)throw new Error(`Expanded pack HTTP ${extra.status}`);
      expanded=validateCompatibleRegion(measured,validateMissionPack(await extra.json()),OVERVIEW);
    }catch(error){console.warn('Expanded CTX sector unavailable; original crop retained',error);}
    state.regionPacks={crop:measured,expanded};
    const selected=selectMissionData(demo,measured,location.search);
    if(selected.kind==='measured'){
      state.region=expanded&&new URLSearchParams(location.search).get('region')==='expanded'?'expanded':'crop';
      state.data=state.regionPacks[state.region];state.kind='measured';
      state.waypoints=eligibleLandmarks(state.data);
      state.start={...(state.waypoints.find(p=>p.id==='base')??state.data.start)};
      state.destination=state.waypoints[1];state.presetId=state.destination.id;
      state.hazards=false;state.layer='optical';
      $('#presetDrawer').open=!matchMedia('(max-width:720px)').matches;
    }
    renderDataset();calculateRoutes();renderScience();
    if(state.kind==='measured')await loadLibrary();else renderMissionLibrary();
  }catch(error){
    console.warn('Measured pack unavailable; synthetic demo retained',error);
    renderDataset();calculateRoutes();renderScience();renderMissionLibrary();
    toast(L('Measured pack unavailable; synthetic demo active','Ölçümlü paket kullanılamıyor; sentetik demo etkin'));
  }
}
attach();
applyStaticTranslations();
// The default measured page never paints synthetic terrain while its pack loads.
if(new URLSearchParams(location.search).get('mode')==='demo'){
  renderDataset();
  calculateRoutes();
}
loadMeasured();
loadScience();
fetch('./build-info.json',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(info=>{if(info?.id)$('#buildId').textContent=`Build: ${info.id}`;}).catch(()=>{});
