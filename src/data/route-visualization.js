/** Stable map presentation; route inspection is intentionally absent. */
export function visibleRouteModes(routes,visibility,enabled){
  return enabled?['distance','terrain'].filter(mode=>visibility[mode]&&routes[mode]):[];
}
export function routePathsMarkup(routes,visibility,enabled,pathForRoute){
  return visibleRouteModes(routes,visibility,enabled).map(mode=>
    `<path class="map-route ${mode==='distance'?'shortest':'terrain'}" d="${pathForRoute(routes[mode])}" stroke-width="${mode==='terrain'?5:8}"/>`
  ).join('');
}
