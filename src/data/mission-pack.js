/** Validate external mission packs before any UI or routing code reads them. */
const okPosition=(p,w,h)=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<w&&p.y>=0&&p.y<h;
const imagePath=p=>typeof p==='string' && /^data\/[a-z0-9_-]+\.webp$/.test(p);
const safeSource=p=>typeof p==='string'&&/^https:\/\/[^\s/?#]+/.test(p);
export function validateMissionPack(pack){
  if(!pack||pack.version!==1||pack.kind!=='measured')throw new Error('Unsupported mission pack version or data kind');
  const w=pack.gridWidth,h=pack.gridHeight;
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<8||h<8||w>240||h>240)throw new Error('Invalid mission grid dimensions');
  if(!Number.isFinite(pack.cellMeters)||pack.cellMeters<=0)throw new Error('Invalid horizontal cell spacing');
  if(!Array.isArray(pack.heights)||pack.heights.length!==w*h||!pack.heights.every(n=>n===null||(typeof n==='number'&&Number.isFinite(n))))throw new Error('Invalid DEM heights or no-data mask');
  if(!pack.waypoints?.every(p=>['id','name','type','code','desc'].every(k=>typeof p[k]==='string' && p[k].length>0 && p[k].length<=180)))throw new Error('Invalid waypoint descriptions');
  if(!pack.crsWkt||typeof pack.crsWkt!=='string'||pack.crsWkt.length<30)throw new Error('Missing projected CRS metadata');
  if(!pack.boundsMeters||!['west','south','east','north'].every(k=>Number.isFinite(pack.boundsMeters[k])))throw new Error('Missing projected crop bounds');
  if(!(pack.boundsMeters.west<pack.boundsMeters.east&&pack.boundsMeters.south<pack.boundsMeters.north))throw new Error('Invalid crop bounds');
  const spacingX=(pack.boundsMeters.east-pack.boundsMeters.west)/w;
  const spacingY=(pack.boundsMeters.north-pack.boundsMeters.south)/h;
  if(Math.abs(spacingX-pack.cellMeters)/pack.cellMeters>0.03||Math.abs(spacingY-pack.cellMeters)/pack.cellMeters>0.03)throw new Error('Raster grid spacing does not match projected bounds');
  if(!pack.layers||!pack.layers.optical||!pack.layers.elevation)throw new Error('Required NASA data layers unavailable');
  for(const layer of Object.values(pack.layers)){
    if(!imagePath(layer.path)||!safeSource(layer.source)||typeof layer.label!=='string')throw new Error('Invalid layer file or provenance');
  }
  if(!okPosition(pack.start,w,h)||!Array.isArray(pack.waypoints)||pack.waypoints.length<1||pack.waypoints.length>10||!pack.waypoints.every(p=>okPosition(p,w,h)))throw new Error('Invalid expedition waypoints');
  const positions=[pack.start,...pack.waypoints];
  if(positions.some(p=>pack.heights[p.y*w+p.x]===null))throw new Error('Waypoints cannot be placed on missing DEM cells');
  if(!Array.isArray(pack.hazards)||!pack.hazards.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.radius)&&p.radius>0))throw new Error('Invalid hazard geometry');
  return pack;
}
export function mapDisplayCoordinates(pack,p){
  if(pack.kind!=='measured')return null;
  const {west,east,north,south}=pack.boundsMeters;
  return {east: west+(p.x+.5)*(east-west)/pack.gridWidth,
          north: north-(p.y+.5)*(north-south)/pack.gridHeight};
}
