import { isBlocked } from '../engine/routing.js';
import { planMission } from './mission-library.js';

export const CUSTOM_MISSION_KIND = 'ares-custom-mission';
export const MAX_CUSTOM_STOPS = 8;
export const MIN_CUSTOM_STOPS = 2;
const SOURCE_PACK = 'public/data/mission-pack.json';
const LIMIT = 80;
const copyStops = stops => stops.map(p => ({x:p.x,y:p.y}));
const cellEqual = (a,b) => a.x === b.x && a.y === b.y;
const text = (value, fallback) => typeof value === 'string' && value.trim()
  ? value.trim().slice(0,LIMIT) : fallback;

export function createCustomMission(pack, base = null) {
  const stops = base ? copyStops(base.stops) : [
    {...pack.start},
    {...pack.waypoints[0]},
  ];
  return validateCustomMission({
    id: 'CUSTOM', phase: 'Custom',
    title: base ? text(base.title, 'Custom mission') + ' — editable' : 'Custom mission',
    objective: 'Illustrative multi-stop route comparison on a measured CTX grid.',
    researchQuestion: 'How do distance and sampled slope weighting affect these ordered routes?',
    scienceClaim: 'User-selected grid cells, not authenticated Mars science targets.',
    stops,
  },pack);
}

export function validateCustomMission(input, pack) {
  if (!pack || pack.site !== 'Jezero CTX measured study crop' ||
      pack.gridWidth !== 80 || pack.gridHeight !== 60 || pack.cellMeters !== 40 ||
      !Array.isArray(pack.heights) || pack.heights.length !== 4800) {
    throw new Error('Custom missions require the measured Jezero CTX pack.');
  }
  if (!input || !Array.isArray(input.stops) ||
      input.stops.length < MIN_CUSTOM_STOPS || input.stops.length > MAX_CUSTOM_STOPS) {
    throw new Error('Custom mission requires 2–8 ordered stops.');
  }
  const stops = copyStops(input.stops);
  for (let i = 0; i < stops.length; i++) {
    const p = stops[i];
    if (!Number.isInteger(p.x) || !Number.isInteger(p.y) ||
        isBlocked(pack,p.x,p.y,false)) throw new Error('Stop is outside the valid measured CTX grid.');
    if (i && cellEqual(stops[i-1],p)) throw new Error('Consecutive stops must occupy different cells.');
  }
  const mission = {
    id:'CUSTOM',phase:'Custom',title:text(input.title,'Custom mission'),
    objective:text(input.objective,'Illustrative measured CTX route exercise.'),
    researchQuestion:text(input.researchQuestion,'Compare route alternatives.'),
    scienceClaim:'User-selected grid cells, not authenticated Mars science targets.',
    stops,
  };
  if (!planMission(pack,mission)) throw new Error('No valid route through one or more stops.');
  return mission;
}

export function editCustomMission(current, operation, pack) {
  const input = {...current, stops:copyStops(current.stops)};
  const stops = input.stops;
  const {type,index,to,point} = operation || {};
  if(type === 'rename'){
    input.title = text(operation.title,current.title);
  }else if(type === 'add'){
    if(stops.length >= MAX_CUSTOM_STOPS) throw new Error('A mission can have at most 8 stops.');
    stops.push(point);
  }else if(type === 'move'){
    if(!Number.isInteger(index) || index<0 || index>=stops.length) throw new Error('Stop index is invalid.');
    stops[index] = point;
  }else if(type === 'remove'){
    if(stops.length<=MIN_CUSTOM_STOPS)throw new Error('Keep at least 2 stops.');
    if(!Number.isInteger(index)||index<0||index>=stops.length)throw new Error('Stop index is invalid.');
    stops.splice(index,1);
  }else if(type === 'reorder'){
    if(!Number.isInteger(index)||!Number.isInteger(to)||
       index<0||to<0||index>=stops.length||to>=stops.length) throw new Error('Stop order index is invalid.');
    stops.splice(to,0,stops.splice(index,1)[0]);
  }else throw new Error('Unsupported custom mission edit.');
  return validateCustomMission(input,pack);
}

export function serializeCustomMission(mission,pack) {
  const m = validateCustomMission(mission,pack);
  return {
    schemaVersion:1,kind:CUSTOM_MISSION_KIND,
    sourcePack:SOURCE_PACK,
    dataset:pack.site,
    gridWidth:pack.gridWidth,gridHeight:pack.gridHeight,cellMeters:pack.cellMeters,
    title:m.title,objective:m.objective,researchQuestion:m.researchQuestion,
    stops:copyStops(m.stops),
    warning:'Research exercise only. Not an operational EVA plan or source-verified science target.',
  };
}

export function parseCustomMission(input,pack) {
  if(!input||input.kind!==CUSTOM_MISSION_KIND||input.schemaVersion!==1||
     input.sourcePack!==SOURCE_PACK||input.dataset!==pack.site||
     input.gridWidth!==pack.gridWidth||input.gridHeight!==pack.gridHeight||
     input.cellMeters!==pack.cellMeters) throw new Error('Invalid or incompatible ARES custom mission file.');
  return validateCustomMission(input,pack);
}
