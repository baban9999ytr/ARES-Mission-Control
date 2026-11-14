/** Keep the measured pack and the synthetic fallback as distinct data modes. */
export function selectMissionData(demo, measured, search=''){
  return new URLSearchParams(search).get('mode')==='demo'
    ? {kind:'demo',terrain:demo}
    : {kind:'measured',terrain:measured};
}

export function layerForMode(kind, terrain, name){
  return kind==='measured' ? terrain.layers?.[name]??null : null;
}
