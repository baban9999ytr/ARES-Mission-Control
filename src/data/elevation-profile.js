import {routeSegments} from './route-segments.js';

/** Straight lines join DEM samples at grid-cell centres; no interpolation claim. */
export function profileData(routes,data,legs=[]){
  const series=['distance','terrain'].map(mode=>({mode,segments:routeSegments(routes[mode],data,legs)})).filter(s=>routes[s.mode]);
  if(!series.length)return null;
  const heights=series.flatMap(s=>s.segments.flatMap(x=>[x.startElevation,x.endElevation]));
  for(const s of series)if(!s.segments.length){const c=routes[s.mode].cells[0];const h=data.heights[c.y*data.gridWidth+c.x];if(Number.isFinite(h))heights.push(h);}
  if(!heights.length||heights.some(h=>!Number.isFinite(h)))return null;
  const min=Math.min(...heights),max=Math.max(...heights),span=Math.max(max-min,1);
  const maxDistance=Math.max(...series.map(s=>s.segments.at(-1)?.cumulativeMeters??0),1);
  return {series,min,max,span,maxDistance,verticalReference:data.verticalReference??null};
}

export function profileSvg(profile,{interactive=true,language='en'}={}){
  if(!profile)return '';
  const tr=language==='tr',left=50,right=700,top=14,bottom=174;
  const x=d=>left+d/profile.maxDistance*(right-left);
  const y=h=>bottom-(h-profile.min)/profile.span*(bottom-top);
  const number=n=>new Intl.NumberFormat(tr?'tr-TR':'en-US',{maximumFractionDigits:1}).format(n);
  const label=mode=>mode==='distance'?(tr?'En kısa':'Shortest'):(tr?'Arazi öncelikli':'Terrain preferred');
  const axis=`<path d="M${left} ${top}V${bottom}H${right}" class="profile-axis"/><text x="4" y="${top+4}">${number(profile.max)} m</text><text x="4" y="${bottom}">${number(profile.min)} m</text><text x="${left}" y="194">0 m</text><text x="${right}" y="194" text-anchor="end">${number(profile.maxDistance)} m</text>`;
  const lines=profile.series.map(s=>{
    const points=s.segments.length?[[0,s.segments[0].startElevation],...s.segments.map(z=>[z.cumulativeMeters,z.endElevation])]:[[0,profile.min]];
    const polyline=`<polyline class="profile-line ${s.mode}" points="${points.map(([d,h])=>`${x(d).toFixed(2)},${y(h).toFixed(2)}`).join(' ')}"/>`;
    const hits=interactive?s.segments.map((z,index)=>`<path class="profile-hit" data-profile-mode="${s.mode}" data-profile-index="${index}" tabindex="0" role="button" aria-label="${label(s.mode)} · ${tr?'Bölüm':'Segment'} ${z.number} · ${number(z.cumulativeMeters)} m" d="M${x(z.cumulativeMeters-z.lengthMeters).toFixed(2)},${y(z.startElevation).toFixed(2)}L${x(z.cumulativeMeters).toFixed(2)},${y(z.endElevation).toFixed(2)}"/>`).join(''):'';
    return polyline+hits;
  }).join('');
  return `<svg class="elevation-profile" viewBox="0 0 720 204" role="${interactive?'group':'img'}" aria-label="${tr?'Örneklenmiş DEM yükseklik profili; yatay eksen rota mesafesi, düşey eksen yükseklik':'Sampled DEM elevation profile; horizontal axis route distance, vertical axis elevation'}">${axis}${lines}</svg>`;
}
