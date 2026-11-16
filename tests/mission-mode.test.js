import test from "node:test";
import assert from "node:assert/strict";
import demo from "../src/data/demo-terrain.json" with { type: "json" };
import measured from "../public/data/mission-pack.json" with { type: "json" };
import { selectMissionData, layerForMode } from "../src/data/mission-mode.js";

test("demo mode retains synthetic terrain and measured mode selects CTX assets", () => {
  const synthetic = selectMissionData(demo, measured, "?mode=demo");
  assert.equal(synthetic.kind, "demo");
  assert.strictEqual(synthetic.terrain, demo);
  assert.equal(
    layerForMode(synthetic.kind, synthetic.terrain, "optical"),
    null,
  );
  const ctx = selectMissionData(demo, measured, "");
  assert.equal(ctx.kind, "measured");
  assert.strictEqual(ctx.terrain, measured);
  assert.equal(
    layerForMode(ctx.kind, ctx.terrain, "optical").path,
    "data/mars-optical.webp",
  );
  assert.equal(
    layerForMode(ctx.kind, ctx.terrain, "elevation").path,
    "data/mars-elevation.webp",
  );
  assert.equal(layerForMode(ctx.kind, ctx.terrain, "thermal"), null);
});
