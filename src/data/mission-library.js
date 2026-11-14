import { isBlocked, planRoute } from '../engine/routing.js';

const PHASES = ['Explorer', 'Scientist', 'Commander'];
const PREFIXES = { Explorer: 'EX', Scientist: 'SC', Commander: 'CM' };

/**
 * The catalog is an authored list of illustrative measured-grid exercises.
 * It is never evidence of verified named Jezero geological targets.
 */
export function validateMissionLibrary(catalog, pack) {
  if (!catalog || catalog.schemaVersion !== 1 || catalog.sourcePack !== 'public/data/mission-pack.json') {
    throw new Error('Unsupported mission library schema or source pack.');
  }
  if (!pack || pack.gridWidth !== 80 || pack.gridHeight !== 60 || pack.cellMeters !== 40 ||
      !Array.isArray(pack.heights) || pack.heights.length !== 4800 ||
      pack.site !== 'Jezero CTX measured study crop') {
    throw new Error('Mission library requires its measured Jezero CTX crop.');
  }
  if (!Array.isArray(catalog.missions) || catalog.missions.length !== 30) {
    throw new Error('Mission library must contain exactly 30 exercises.');
  }
  const seen = new Set();
  const counts = Object.fromEntries(PHASES.map(phase => [phase, 0]));
  for (const m of catalog.missions) {
    if (!m || !PHASES.includes(m.phase) || typeof m.title !== 'string' || !m.title.trim() ||
        typeof m.objective !== 'string' || typeof m.researchQuestion !== 'string' ||
        typeof m.scienceClaim !== 'string' || typeof m.id !== 'string' ||
        !new RegExp('^' + PREFIXES[m.phase] + '-[0-9]{2}$').test(m.id) || seen.has(m.id)) {
      throw new Error('Invalid or duplicate mission entry.');
    }
    seen.add(m.id);
    counts[m.phase]++;
    if (!Array.isArray(m.stops) || m.stops.length < 2 || m.stops.length > 8) {
      throw new Error('Mission needs between two and eight stops: ' + m.id);
    }
    for (const p of m.stops) {
      if (!p || !Number.isInteger(p.x) || !Number.isInteger(p.y) ||
          isBlocked(pack, p.x, p.y, false)) {
        throw new Error('Invalid or blocked CTX grid point in ' + m.id);
      }
    }
  }
  if (PHASES.some(phase => counts[phase] !== 10)) {
    throw new Error('Mission library requires ten exercises per phase.');
  }
  return catalog.missions;
}

function aggregate(routes, mode) {
  return {
    cells: routes.flatMap((route, index) => index ? route.cells.slice(1) : route.cells),
    meters: routes.reduce((sum, route) => sum + route.meters, 0),
    maxSlope: Math.max(...routes.map(route => route.maxSlope)),
    ascending: routes.reduce((sum, route) => sum + route.ascending, 0),
    totalCost: routes.reduce((sum, route) => sum + route.totalCost, 0),
    iterations: routes.reduce((sum, route) => sum + route.iterations, 0),
    mode,
  };
}

/** Each consecutive stop pair is an independent A* calculation, NOT an optimized tour. */
export function planMission(data, mission) {
  if (!mission || !Array.isArray(mission.stops) || mission.stops.length < 2 ||
      mission.stops.length > 8) return null;
  const legs = [];
  for (let i = 1; i < mission.stops.length; i++) {
    const from = mission.stops[i - 1], to = mission.stops[i];
    if (!from || !to) return null;
    const distance = planRoute(data, from, to, 'distance', false);
    const terrain = planRoute(data, from, to, 'terrain', false);
    if (!distance || !terrain) return null;
    legs.push({ index: i, from, to, distance, terrain });
  }
  return {
    mission,
    legs,
    routes: {
      distance: aggregate(legs.map(leg => leg.distance), 'distance'),
      terrain: aggregate(legs.map(leg => leg.terrain), 'terrain'),
    },
  };
}

const summarizeRoute = route => ({
  distanceMeters: route.meters,
  maximumAdjacentCellStepSlopeDegrees: route.maxSlope,
  totalAscentMeters: route.ascending,
  modelCost: route.totalCost,
  plannedCells: route.cells,
});

/** Offline reproducible briefing: no implied EVA safety, science-site identity, or global tour optimization. */
export function buildMissionReport(plan, pack, preference, generatedAt = new Date().toISOString()) {
  if (!plan || !plan.mission || !plan.legs.length) throw new Error('No selected mission plan.');
  return {
    schemaVersion: 1,
    title: 'ARES measured CTX mission exercise',
    generatedAt,
    warning: 'Research simulation only. Route safety, actual target identity, traversability and EVA duration are unverified.',
    methodology: 'Fixed-order, independent A* legs. No global multi-stop optimization.',
    dataset: {
      sourcePack: 'public/data/mission-pack.json',
      name: pack.site,
      cellMeters: pack.cellMeters,
      boundsMeters: pack.boundsMeters,
      verticalReference: pack.verticalReference,
    },
    mission: {
      id: plan.mission.id,
      phase: plan.mission.phase,
      title: plan.mission.title,
      objective: plan.mission.objective,
      researchQuestion: plan.mission.researchQuestion,
      scienceClaim: plan.mission.scienceClaim,
      gridStops: plan.mission.stops,
    },
    selectedPreference: preference,
    totals: {
      shortest: summarizeRoute(plan.routes.distance),
      terrainPreferred: summarizeRoute(plan.routes.terrain),
    },
    legs: plan.legs.map(leg => ({
      index: leg.index,
      from: leg.from,
      to: leg.to,
      shortest: summarizeRoute(leg.distance),
      terrainPreferred: summarizeRoute(leg.terrain),
    })),
  };
}
