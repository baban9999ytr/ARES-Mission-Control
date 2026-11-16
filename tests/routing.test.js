import test from "node:test";
import assert from "node:assert/strict";
import data from "../src/data/demo-terrain.json" with { type: "json" };
import {
  planRoute,
  inHazard,
  slopeDegrees,
  summarizeComparison,
} from "../src/engine/routing.js";
const START = { x: 13, y: 29 },
  END = { x: 61, y: 14 };
test("A* builds route with endpoints and nonzero distance", () => {
  const route = planRoute(data, START, END, "terrain", true);
  assert.ok(route);
  assert.deepEqual(route.cells[0], START);
  assert.deepEqual(route.cells.at(-1), END);
  assert.ok(route.meters > 0);
});
test("A* never enters enabled synthetic hazard zones", () => {
  const route = planRoute(data, START, END, "terrain", true);
  assert.ok(route.cells.every((p) => !inHazard(p.x, p.y, data.hazards, true)));
});
test("shortest-mode path cannot be longer than slope-weighted one", () => {
  const a = planRoute(data, START, END, "distance", true);
  const b = planRoute(data, START, END, "terrain", true);
  assert.ok(a && b);
  assert.ok(a.meters <= b.meters + 0.0001);
});
test("invalid or blocked goals are rejected", () => {
  assert.equal(planRoute(data, START, { x: -1, y: 2 }), null);
  assert.equal(planRoute(data, START, { x: 43, y: 15 }, "terrain", true), null);
});
test("slope helper and comparison return meaningful values", () => {
  assert.equal(slopeDegrees(4, 4, 25), 0);
  assert.ok(slopeDegrees(0, 25, 25) > 40);
  assert.deepEqual(
    summarizeComparison(
      { meters: 100, maxSlope: 5 },
      { meters: 85, maxSlope: 8 },
    ),
    { deltaMeters: 15, deltaMaxSlope: -3 },
  );
});
