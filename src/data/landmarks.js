import {isBlocked} from '../engine/routing.js';

// Projected ESRI:103885 metre coordinates measured from the original CTX grid.
// These are illustrative planning locations, never verified installations or deposits.
export const JEZERO_LANDMARKS = Object.freeze([
  {id:'base',east:4586500,north:1092260,name:'Illustrative Base Camp',nameTr:'Örnek Ana Üs',code:'EX-BASE',desc:'Illustrative planning origin; no real base exists here.',descTr:'Örnek planlama başlangıcı; burada gerçek bir üs yok.'},
  {id:'sample',east:4588300,north:1092900,name:'Geological Sampling Site',nameTr:'Jeolojik Örnekleme Noktası',code:'EX-SAMPLE',desc:'Illustrative sampling stop; no source-verified outcrop identity.',descTr:'Örnek numune durağı; kaynakla doğrulanmış kayaç konumu değildir.'},
  {id:'mineral',east:4587260,north:1092660,name:'Mineral Survey Site',nameTr:'Mineral Araştırma Noktası',code:'EX-MIN',desc:'Illustrative survey; not evidence of a discovered mineral deposit.',descTr:'Örnek araştırma; keşfedilmiş mineral yatağına kanıt değildir.'},
  {id:'observe',east:4588540,north:1091820,name:'Observation Point',nameTr:'Gözlem Noktası',code:'EX-OBS',desc:'Illustrative terrain observation stop.',descTr:'Örnek arazi gözlem durağı.'},
  {id:'return',east:4586700,north:1091700,name:'Return Point',nameTr:'Dönüş Noktası',code:'EX-RETURN',desc:'Illustrative return stop; not an operational waypoint.',descTr:'Örnek dönüş durağı; operasyonel konum değildir.'},
].map(p=>Object.freeze({...p,crs:'ESRI:103885',status:'illustrative',eligibleRegions:Object.freeze(['crop','expanded'])})));

export function projectedToCell(pack,point){
  const b=pack.boundsMeters;
  if(!b||point.east<b.west||point.east>=b.east||point.north<=b.south||point.north>b.north)return null;
  return {x:Math.floor((point.east-b.west)/(b.east-b.west)*pack.gridWidth),y:Math.floor((b.north-point.north)/(b.north-b.south)*pack.gridHeight)};
}
export function eligibleLandmarks(pack){
  return JEZERO_LANDMARKS.flatMap(p=>{
    const cell=projectedToCell(pack,p);
    return cell&&!isBlocked(pack,cell.x,cell.y,false)?[{...p,...cell,type:'Illustrative study point',typeTr:'Örnek çalışma noktası'}]:[];
  });
}
export function projectedToSvg(bounds,point){
  if(point.east<bounds.west||point.east>=bounds.east||point.north<=bounds.south||point.north>bounds.north)return null;
  return {x:(point.east-bounds.west)/(bounds.east-bounds.west)*1000,y:(bounds.north-point.north)/(bounds.north-bounds.south)*750};
}
