/** Explainable A* route planning on a grid. No NASA-certified hazard thresholds. */
const NEIGHBORS = [
  [-1, -1, Math.SQRT2],
  [0, -1, 1],
  [1, -1, Math.SQRT2],
  [-1, 0, 1],
  [1, 0, 1],
  [-1, 1, Math.SQRT2],
  [0, 1, 1],
  [1, 1, Math.SQRT2],
];
export const cellIndex = (x, y, width) => y * width + x;
export const DEFAULT_SLOPE_WEIGHT = 4;
export const SUPPORTED_SLOPE_WEIGHTS = [0, 1, 2, 4, 8];
export function inHazard(x, y, hazards = [], enabled = true) {
  return (
    enabled && hazards.some((h) => Math.hypot(x - h.x, y - h.y) < h.radius)
  );
}
export function isBlocked(data, x, y, hazardEnabled = true) {
  if (x < 0 || y < 0 || x >= data.gridWidth || y >= data.gridHeight)
    return true;
  const height = data.heights[cellIndex(x, y, data.gridWidth)];
  return (
    height === null ||
    !Number.isFinite(height) ||
    inHazard(x, y, data.hazards || [], hazardEnabled)
  );
}
export function slopeDegrees(a, b, runMeters) {
  return (Math.atan2(Math.abs(b - a), runMeters) * 180) / Math.PI;
}
export function routeCost(
  data,
  from,
  to,
  stepLength,
  mode = "terrain",
  hazardEnabled = true,
  slopeWeight = DEFAULT_SLOPE_WEIGHT,
) {
  if (!SUPPORTED_SLOPE_WEIGHTS.includes(slopeWeight))
    throw new RangeError("Unsupported illustrative slope coefficient");
  const h1 = data.heights[cellIndex(from.x, from.y, data.gridWidth)];
  const h2 = data.heights[cellIndex(to.x, to.y, data.gridWidth)];
  const slope = slopeDegrees(
    h1,
    h2,
    (data.cellMeters ?? data.demoCellMeters) * stepLength,
  );
  const meters = stepLength * (data.cellMeters ?? data.demoCellMeters);
  // These illustrative weights are engineering design choices, not EVA safety guidance.
  const penalty =
    mode === "terrain" ? 1 + slopeWeight * Math.pow(slope / 20, 2) : 1;
  return { cost: meters * penalty, meters, slope };
}
function heuristic(a, b, meters) {
  return Math.hypot(a.x - b.x, a.y - b.y) * meters;
}
// Duplicate entries are allowed; stale priorities are discarded on removal.
// The sequence number preserves deterministic ties from the former insertion-ordered Set.
class MinHeap {
  constructor() {
    this.items = [];
    this.sequence = 0;
  }
  get size() {
    return this.items.length;
  }
  push(index, priority) {
    const item = { index, priority, sequence: this.sequence++ },
      a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i) {
      const p = (i - 1) >> 1;
      if (!this.before(item, a[p])) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = item;
  }
  before(a, b) {
    return (
      a.priority < b.priority ||
      (a.priority === b.priority && a.sequence < b.sequence)
    );
  }
  pop() {
    const a = this.items,
      first = a[0],
      last = a.pop();
    if (a.length) {
      let i = 0;
      while (i * 2 + 1 < a.length) {
        let c = i * 2 + 1;
        if (c + 1 < a.length && this.before(a[c + 1], a[c])) c++;
        if (!this.before(a[c], last)) break;
        a[i] = a[c];
        i = c;
      }
      a[i] = last;
    }
    return first;
  }
}
export function planRoute(
  data,
  start,
  goal,
  mode = "terrain",
  hazardEnabled = true,
  slopeWeight = DEFAULT_SLOPE_WEIGHT,
) {
  if (!SUPPORTED_SLOPE_WEIGHTS.includes(slopeWeight))
    throw new RangeError("Unsupported illustrative slope coefficient");
  const { gridWidth: w, gridHeight: h } = data;
  const validate = (p) =>
    Number.isInteger(p.x) &&
    Number.isInteger(p.y) &&
    p.x >= 0 &&
    p.y >= 0 &&
    p.x < w &&
    p.y < h;
  if (!validate(start) || !validate(goal)) return null;
  if (
    isBlocked(data, start.x, start.y, hazardEnabled) ||
    isBlocked(data, goal.x, goal.y, hazardEnabled)
  )
    return null;
  const key = (x, y) => cellIndex(x, y, w);
  const cellMeters = data.cellMeters ?? data.demoCellMeters;
  const startIdx = key(start.x, start.y),
    goalIdx = key(goal.x, goal.y);
  const open = new MinHeap();
  const g = new Float64Array(w * h).fill(Infinity);
  const f = new Float64Array(w * h).fill(Infinity);
  const came = new Int32Array(w * h).fill(-1);
  g[startIdx] = 0;
  f[startIdx] = heuristic(start, goal, cellMeters);
  open.push(startIdx, f[startIdx]);
  let iterations = 0;
  while (open.size && iterations++ < w * h * 16) {
    const next = open.pop();
    if (next.priority !== f[next.index]) continue;
    const cur = next.index;
    if (cur === goalIdx) {
      const cells = [];
      let at = cur;
      while (at !== -1) {
        cells.push({ x: at % w, y: Math.floor(at / w) });
        at = came[at];
      }
      cells.reverse();
      let meters = 0,
        maxSlope = 0,
        ascending = 0;
      for (let i = 1; i < cells.length; i++) {
        const a = cells[i - 1],
          b = cells[i];
        const segment = routeCost(
          data,
          a,
          b,
          Math.hypot(a.x - b.x, a.y - b.y),
          mode,
          hazardEnabled,
          slopeWeight,
        );
        meters += segment.meters;
        maxSlope = Math.max(maxSlope, segment.slope);
        ascending += Math.max(
          0,
          data.heights[key(b.x, b.y)] - data.heights[key(a.x, a.y)],
        );
      }
      return {
        cells,
        meters,
        maxSlope,
        ascending,
        totalCost: g[goalIdx],
        mode,
        iterations,
        slopeWeight: mode === "terrain" ? slopeWeight : 0,
      };
    }
    const cx = cur % w,
      cy = Math.floor(cur / w);
    for (const [dx, dy, len] of NEIGHBORS) {
      const nx = cx + dx,
        ny = cy + dy;
      if (isBlocked(data, nx, ny, hazardEnabled)) continue;
      // Prevent diagonal traversal through the corner of a blocked cell.
      if (
        dx &&
        dy &&
        (isBlocked(data, cx + dx, cy, hazardEnabled) ||
          isBlocked(data, cx, cy + dy, hazardEnabled))
      )
        continue;
      const ni = key(nx, ny);
      const { cost } = routeCost(
        data,
        { x: cx, y: cy },
        { x: nx, y: ny },
        len,
        mode,
        hazardEnabled,
        slopeWeight,
      );
      const tentative = g[cur] + cost;
      if (tentative < g[ni]) {
        came[ni] = cur;
        g[ni] = tentative;
        f[ni] = tentative + heuristic({ x: nx, y: ny }, goal, cellMeters);
        open.push(ni, f[ni]);
      }
    }
  }
  return null;
}
export function summarizeComparison(a, b) {
  if (!a || !b) return null;
  return {
    deltaMeters: Math.round(a.meters - b.meters),
    deltaMaxSlope: +(a.maxSlope - b.maxSlope).toFixed(1),
  };
}
