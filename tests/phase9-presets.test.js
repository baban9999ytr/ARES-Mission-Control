import test from "node:test";
import assert from "node:assert/strict";
import pack from "../public/data/mission-pack.json" with { type: "json" };
import { measuredPresets } from "../src/data/mission-presets.js";
import { isBlocked, planRoute } from "../src/engine/routing.js";
import { createCustomMission } from "../src/data/mission-builder.js";

test("all five bilingual example points lie on routeable measured DEM cells", () => {
  const points = measuredPresets(pack);
  assert.equal(points.length, 5);
  assert.equal(new Set(points.map((p) => `${p.x},${p.y}`)).size, 5);
  for (const point of points) {
    assert.ok(point.name && point.nameTr && point.desc && point.descTr);
    assert.equal(isBlocked(pack, point.x, point.y, false), false, point.id);
    assert.ok(planRoute(pack, pack.start, point, "distance", false), point.id);
  }
  assert.match(points[0].desc, /no real base/i);
  assert.match(points[2].desc, /not evidence of a discovered mineral deposit/i);
});

test("Turkish mission creation starts with Turkish authored UI copy", () => {
  const mission = createCustomMission(pack, null, "tr");
  assert.equal(mission.title, "Özel görev");
  assert.match(mission.objective, /Ölçümlü CTX/);
});
