import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pack from "../public/data/mission-pack.json" with { type: "json" };
import catalog from "../data/scenarios/measured-missions.json" with { type: "json" };
import { planMission } from "../src/data/mission-library.js";
import {
  createCustomMission,
  validateCustomMission,
  editCustomMission,
  serializeCustomMission,
  parseCustomMission,
  MAX_CUSTOM_STOPS,
} from "../src/data/mission-builder.js";

test("create and edit a user-defined measured-CTX multi-stop mission without mutating source pack", () => {
  const mission = createCustomMission(pack);
  assert.equal(mission.phase, "Custom");
  assert.equal(mission.stops.length, 2);
  assert.notStrictEqual(mission.stops[0], pack.start);
  const original = structuredClone(mission);
  const withStop = editCustomMission(
    mission,
    { type: "add", point: { x: 30, y: 30 } },
    pack,
  );
  assert.equal(withStop.stops.length, 3);
  assert.deepEqual(mission, original);
  const moved = editCustomMission(
    withStop,
    { type: "move", index: 1, point: { x: 35, y: 36 } },
    pack,
  );
  assert.deepEqual(moved.stops[1], { x: 35, y: 36 });
  const reordered = editCustomMission(
    moved,
    { type: "reorder", index: 2, to: 0 },
    pack,
  );
  assert.deepEqual(reordered.stops[0], { x: 30, y: 30 });
  const removed = editCustomMission(
    reordered,
    { type: "remove", index: 1 },
    pack,
  );
  assert.equal(removed.stops.length, 2);
  const renamed = editCustomMission(
    removed,
    { type: "rename", title: "Mars grid survey" },
    pack,
  );
  assert.equal(renamed.title, "Mars grid survey");
  const plan = planMission(pack, moved);
  assert.equal(plan.legs.length, 2);
  assert.equal(plan.routes.terrain.cells.at(-1).x, 30);
  assert.ok(Number.isFinite(plan.routes.terrain.meters));
});

test("duplicate fixed-order Commander catalog without editing its original", () => {
  const base = catalog.missions.find((m) => m.id === "CM-04");
  const snapshot = structuredClone(base);
  const custom = createCustomMission(pack, base);
  assert.equal(custom.stops.length, 5);
  assert.equal(custom.phase, "Custom");
  assert.equal(planMission(pack, custom).legs.length, 4);
  const edited = editCustomMission(
    custom,
    { type: "move", index: 2, point: { x: 53, y: 41 } },
    pack,
  );
  assert.deepEqual(base, snapshot);
  assert.notDeepEqual(edited.stops, base.stops);
  assert.equal(planMission(pack, edited).legs.length, 4);
});

test("reject invalid stops, consecutive duplicates, source mismatch and overly long missions", () => {
  const mission = createCustomMission(pack);
  assert.throws(
    () => editCustomMission(mission, { type: "remove", index: 0 }, pack),
    /at least 2/,
  );
  assert.throws(
    () =>
      editCustomMission(
        mission,
        { type: "move", index: 1, point: { x: -1, y: 2 } },
        pack,
      ),
    /outside/,
  );
  assert.throws(
    () =>
      editCustomMission(
        mission,
        { type: "add", point: mission.stops.at(-1) },
        pack,
      ),
    /Consecutive/,
  );
  assert.throws(
    () =>
      editCustomMission(mission, { type: "reorder", index: 99, to: 1 }, pack),
    /invalid/,
  );
  assert.throws(
    () => editCustomMission(mission, { type: "noop" }, pack),
    /Unsupported/,
  );
  const invalidPack = { ...pack, gridWidth: 10 };
  assert.throws(() => validateCustomMission(mission, invalidPack), /measured/);
  let many = mission;
  for (let i = 0; i < MAX_CUSTOM_STOPS - 2; i++)
    many = editCustomMission(
      many,
      { type: "add", point: { x: 32 + i, y: 31 } },
      pack,
    );
  assert.equal(many.stops.length, MAX_CUSTOM_STOPS);
  assert.throws(
    () =>
      editCustomMission(many, { type: "add", point: { x: 50, y: 50 } }, pack),
    /at most 8/,
  );
});

test("save/load uses explicit versioned format and rejects unsuitable JSON", () => {
  const mission = editCustomMission(
    createCustomMission(pack),
    { type: "add", point: { x: 24, y: 23 } },
    pack,
  );
  const saved = serializeCustomMission(mission, pack);
  assert.equal(saved.schemaVersion, 1);
  assert.equal(saved.kind, "ares-custom-mission");
  assert.equal(saved.stops.length, 3);
  assert.deepEqual(parseCustomMission(saved, pack), mission);
  assert.throws(() =>
    parseCustomMission({ ...saved, sourcePack: "invalid" }, pack),
  );
  assert.throws(() => parseCustomMission({ ...saved, cellMeters: 90 }, pack));
  assert.throws(() =>
    parseCustomMission({ ...saved, stops: [{ x: 2, y: 2 }] }, pack),
  );
});

test("custom builder controls and map interactions are wired in the source", async () => {
  const root = new URL("../", import.meta.url);
  const [html, main, css] = await Promise.all(
    ["index.html", "src/main.js", "planner.css"].map((p) =>
      readFile(new URL(p, root), "utf8"),
    ),
  );
  for (const id of [
    "missionNew",
    "missionDuplicate",
    "missionPan",
    "missionMove",
    "missionAdd",
    "missionUndo",
    "missionRedo",
    "missionSave",
    "missionImport",
    "missionEditorStops",
  ])
    assert.match(html, new RegExp('id="' + id + '"'));
  assert.match(html, /<div id="missionDetail"/);
  assert.match(main, /nearestCustomStop\(e,stage\.getBoundingClientRect\(\)\)/);
  assert.match(
    main,
    /applyCustomEdit\(\{type:'move',index:last.index,point\}\)/,
  );
  assert.match(main, /data-stop-grip/);
  assert.match(main, /parseCustomMission/);
  assert.match(css, /touch-action:none/);
});
