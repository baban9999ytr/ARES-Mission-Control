const NS='http://www.w3.org/2000/svg';
const COLORS={terrain:'#16c7c8',shortest:'#f28c28'};

export function buildElevationProfileSeries(route,segments=[]){
  if(!route||!route.cells?.length||!segments.length)return [];
  return [
    {distanceMeters:0,elevationMeters:segments[0].startElevation,cellIndex:0,segmentIndex:0},
    ...segments.map((segment,index)=>({
      distanceMeters:segment.cumulativeMeters,
      elevationMeters:segment.endElevation,
      cellIndex:index+1,
      segmentIndex:index,
    })),
  ];
}

const el=(name,attrs={})=>{
  const node=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
  return node;
};

const fmt=(value,locale,digits=1)=>new Intl.NumberFormat(locale==='tr'?'tr-TR':'en-US',{
  minimumFractionDigits:digits,maximumFractionDigits:digits
}).format(value);

export function renderElevationProfile(container,{routes,segments,locale='en',selected=null,onSelect=()=>{},measured=true}){
  if(!container)return;
  container.replaceChildren();
  if(!measured){
    const empty=document.createElement('p');
    empty.className='elevation-profile-empty';
    empty.textContent=locale==='tr'?'Yükseklik profili yalnızca ölçümlü CTX DEM verisinde gösterilir.':'The elevation profile is available only for measured CTX DEM data.';
    container.append(empty);
    return;
  }
  const hasData=routes?.distance&&routes?.terrain&&segments?.distance?.length&&segments?.terrain?.length;
  if(!hasData){
    const empty=document.createElement('p');
    empty.className='elevation-profile-empty';
    empty.textContent=locale==='tr'?'Ölçümlü rota profili için iki geçerli rota gerekli.':'Two valid measured routes are required for the elevation profile.';
    container.append(empty);
    return;
  }

  const title=document.createElement('div');
  title.className='elevation-profile-title';
  title.innerHTML=locale==='tr'
    ? '<strong>Yükseklik profili</strong><span>Gerçek DEM örnekleri · birikimli rota mesafesi</span>'
    : '<strong>Elevation profile</strong><span>Actual DEM samples · cumulative route distance</span>';
  container.append(title);

  const wrap=document.createElement('div');
  wrap.className='elevation-profile-chart';
  const svg=el('svg',{viewBox:'0 0 760 360',role:'img',tabindex:'0'});
  svg.setAttribute('aria-label',locale==='tr'?'İki rotanın mesafe-yükseklik profili':'Distance-elevation profile for both routes');

  const all=[...buildElevationProfileSeries(routes.distance,segments.distance),...buildElevationProfileSeries(routes.terrain,segments.terrain)];
  const maxDistance=Math.max(...all.map(p=>p.distanceMeters),1);
  const minElevation=Math.min(...all.map(p=>p.elevationMeters));
  const maxElevation=Math.max(...all.map(p=>p.elevationMeters));
  const range=Math.max(maxElevation-minElevation,1);
  const pad={left:58,right:18,top:22,bottom:44};
  const plotW=760-pad.left-pad.right,plotH=360-pad.top-pad.bottom;
  const x=d=>pad.left+(d/maxDistance)*plotW;
  const y=h=>pad.top+(1-(h-minElevation)/range)*plotH;

  const grid=el('g',{class:'elevation-profile-grid'});
  for(let i=0;i<=4;i++){
    const value=minElevation+range*i/4,yy=y(value);
    grid.append(el('line',{x1:pad.left,x2:760-pad.right,y1:yy,y2:yy}));
    const label=el('text',{x:pad.left-8,y:yy+4,'text-anchor':'end'});
    label.textContent=fmt(value,locale,1)+' m';
    grid.append(label);
  }
  for(let i=0;i<=4;i++){
    const value=maxDistance*i/4,xx=x(value);
    grid.append(el('line',{x1:xx,x2:xx,y1:pad.top,y2:360-pad.bottom}));
    const label=el('text',{x:xx,y:360-pad.bottom+22,'text-anchor':'middle'});
    label.textContent=fmt(value,locale,0)+' m';
    grid.append(label);
  }
  svg.append(grid);

  const yTitle=el('text',{x:15,y:pad.top+plotH/2,transform:'rotate(-90 15 '+(pad.top+plotH/2)+')','text-anchor':'middle',class:'axis-title'});
  yTitle.textContent=locale==='tr'?'Yükseklik (m)':'Elevation (m)';
  const xTitle=el('text',{x:pad.left+plotW/2,y:349,'text-anchor':'middle',class:'axis-title'});
  xTitle.textContent=locale==='tr'?'Birikimli mesafe (m)':'Cumulative distance (m)';
  svg.append(yTitle,xTitle);

  const drawRoute=(mode)=>{
    const series=buildElevationProfileSeries(routes[mode],segments[mode]);
    const polyline=el('polyline',{class:'elevation-profile-line '+(mode==='distance'?'shortest':mode),fill:'none',stroke:COLORS[mode],points:series.map(p=>x(p.distanceMeters).toFixed(2)+','+y(p.elevationMeters).toFixed(2)) .join(' ')});
    if(mode==='distance')polyline.setAttribute('stroke-dasharray','9 7');
    polyline.setAttribute('stroke-width','3');
    svg.append(polyline);

    series.forEach((point,index)=>{
      const group=el('g',{class:'elevation-profile-point '+(mode==='distance'?'shortest':mode),tabindex:'0','data-profile-mode':mode,'data-profile-index':point.segmentIndex});
      const circle=el('circle',{cx:x(point.distanceMeters),cy:y(point.elevationMeters),r:selected?.mode===mode&&selected.index===point.segmentIndex?'6':'4',fill:COLORS[mode],stroke:'white','stroke-width':'2'});
      const title=el('title');
      title.textContent=locale==='tr'
        ? `Mesafe: ${fmt(point.distanceMeters,locale,1)} m · Yükseklik: ${fmt(point.elevationMeters,locale,1)} m · Bölüm: ${point.segmentIndex+1}`
        : `Distance: ${fmt(point.distanceMeters,locale,1)} m · Elevation: ${fmt(point.elevationMeters,locale,1)} m · Segment: ${point.segmentIndex+1}`;
      group.append(circle,title);
      group.addEventListener('click',()=>onSelect(mode,Math.min(point.segmentIndex,segments[mode].length-1)));
      group.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(mode,Math.min(point.segmentIndex,segments[mode].length-1));}
      });
      svg.append(group);
    });
  };

  drawRoute('distance');
  drawRoute('terrain');
  wrap.append(svg);
  container.append(wrap);

  const legend=document.createElement('div');
  legend.className='elevation-profile-legend';
  legend.innerHTML=locale==='tr'
    ? '<span><i class="legend terrain"></i>Arazi öncelikli</span><span><i class="legend shortest"></i>En kısa</span><span>Her nokta bir DEM hücresi merkezinden alınan gerçek örnektir.</span>'
    : '<span><i class="legend terrain"></i>Terrain-preferred</span><span><i class="legend shortest"></i>Shortest</span><span>Each point is a real sample from a DEM cell centre.</span>';
  container.append(legend);
}
