import test from "node:test";
import assert from "node:assert/strict";
import pack from "../public/data/mission-pack.json" with { type: "json" };
import {
  clientPointToCell,
  cellToSvg,
  clampPan,
  stepKeyboardCell,
} from "../src/engine/map-grid.js";
import { isBlocked, planRoute } from "../src/engine/routing.js";
import { mapDisplayCoordinates } from "../src/data/mission-pack.js";

test("map clicks invert the same zoom and pan transform used by raster and SVG", () => {
  const rect = { left: 100, top: 50, width: 800, height: 600 };
  assert.deepEqual(clientPointToCell(100, 50, rect, 80, 60), { x: 0, y: 0 });
  assert.deepEqual(clientPointToCell(500, 350, rect, 80, 60), { x: 40, y: 30 });
  assert.deepEqual(clientPointToCell(500, 350, rect, 80, 60, 2, 80, -50), {
    x: 36,
    y: 32,
  });
  assert.equal(clientPointToCell(99, 50, rect, 80, 60), null);
  assert.deepEqual(cellToSvg({ x: 0, y: 0 }, 80, 60), { x: 6.25, y: 6.25 });
  assert.deepEqual(mapDisplayCoordinates(pack, { x: 40, y: 30 }), {
    east: 4587620,
    north: 1092180,
  });
  assert.equal(clampPan(500, 2, 800), 400);
});

test("keyboard grid selection moves by one cell and stays inside the measured footprint", () => {
  assert.deepEqual(stepKeyboardCell({ x: 12, y: 28 }, "ArrowRight", 80, 60), {
    x: 13,
    y: 28,
  });
  assert.deepEqual(stepKeyboardCell({ x: 0, y: 0 }, "ArrowLeft", 80, 60), {
    x: 0,
    y: 0,
  });
  assert.deepEqual(stepKeyboardCell({ x: 79, y: 59 }, "ArrowDown", 80, 60), {
    x: 79,
    y: 59,
  });
  assert.deepEqual(stepKeyboardCell({ x: 12, y: 28 }, "Enter", 80, 60), {
    x: 12,
    y: 28,
  });
  const cell = stepKeyboardCell(
    { x: 12, y: 28 },
    "ArrowUp",
    pack.gridWidth,
    pack.gridHeight,
  );
  assert.equal(isBlocked(pack, cell.x, cell.y, false), false);
  assert.ok(planRoute(pack, cell, { x: 57, y: 12 }, "terrain", false));
});

test("arbitrary valid map-selected points route; nodata points and barriers reject", () => {
  const start = { x: 20, y: 20 },
    destination = { x: 65, y: 43 };
  const route = planRoute(pack, start, destination, "terrain", false);
  assert.ok(route);
  assert.deepEqual(route.cells[0], start);
  assert.deepEqual(route.cells.at(-1), destination);
  const masked = { ...pack, heights: [...pack.heights] };
  masked.heights[destination.y * pack.gridWidth + destination.x] = null;
  assert.equal(isBlocked(masked, destination.x, destination.y, false), true);
  assert.equal(planRoute(masked, start, destination, "terrain", false), null);
});
