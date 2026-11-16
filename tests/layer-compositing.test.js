import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import pack from "../public/data/mission-pack.json" with { type: "json" };
import {
  DEFAULT_MEASURED_LAYERS,
  ELEVATION_COLORS,
  updateMeasuredLayers,
  layerPresentation,
  elevationScale,
  elevationGradient,
} from "../src/data/layer-compositing.js";

test("measured CTX starts with optical texture and 45% elevation color", () => {
  assert.deepEqual(DEFAULT_MEASURED_LAYERS, {
    optical: true,
    elevation: true,
    opacity: 45,
    blend: "color",
  });
  assert.deepEqual(layerPresentation(DEFAULT_MEASURED_LAYERS), {
    opticalVisible: true,
    elevationVisible: true,
    elevationOpacity: 0.45,
    blendMode: "color",
  });
});

test("visibility never removes both backgrounds and elevation-only stays opaque", () => {
  const opticalOnly = updateMeasuredLayers(DEFAULT_MEASURED_LAYERS, {
    elevation: false,
  });
  const elevationOnly = updateMeasuredLayers(DEFAULT_MEASURED_LAYERS, {
    optical: false,
  });
  assert.equal(layerPresentation(opticalOnly).elevationVisible, false);
  assert.deepEqual(layerPresentation(elevationOnly), {
    opticalVisible: false,
    elevationVisible: true,
    elevationOpacity: 1,
    blendMode: "normal",
  });
  assert.throws(
    () => updateMeasuredLayers(opticalOnly, { optical: false }),
    /at least one/,
  );
  assert.throws(
    () => updateMeasuredLayers(elevationOnly, { elevation: false }),
    /at least one/,
  );
});

test("opacity endpoints and alpha/color presentation are deterministic", () => {
  assert.equal(
    layerPresentation(
      updateMeasuredLayers(DEFAULT_MEASURED_LAYERS, { opacity: 0 }),
    ).elevationOpacity,
    0,
  );
  assert.equal(
    layerPresentation(
      updateMeasuredLayers(DEFAULT_MEASURED_LAYERS, { opacity: 100 }),
    ).elevationOpacity,
    1,
  );
  assert.equal(
    layerPresentation(
      updateMeasuredLayers(DEFAULT_MEASURED_LAYERS, { blend: "alpha" }),
    ).blendMode,
    "normal",
  );
  assert.throws(
    () => updateMeasuredLayers(DEFAULT_MEASURED_LAYERS, { opacity: 101 }),
    /0–100/,
  );
  assert.throws(
    () => updateMeasuredLayers(DEFAULT_MEASURED_LAYERS, { blend: "multiply" }),
    /blend mode/,
  );
});

test("legend range and colors follow the sampled measured DEM importer", () => {
  const scale = elevationScale(pack.heights);
  assert.equal(scale.min, -2574.081);
  assert.equal(scale.max, -2453.705);
  assert.equal(scale.low, -2562.5062);
  assert.equal(scale.high, -2465.93898);
  assert.deepEqual(ELEVATION_COLORS, [
    "#172633",
    "#3d6f7e",
    "#9f916d",
    "#e5b375",
  ]);
  assert.match(elevationGradient(), /linear-gradient\(to right/);
  const importer = readFileSync(
    new URL("../tools/import_mars_rasters.py", import.meta.url),
    "utf8",
  );
  for (const rgb of [
    "[23, 38, 51]",
    "[61, 111, 126]",
    "[159, 145, 109]",
    "[229, 179, 117]",
  ])
    assert.ok(importer.includes(rgb));
});

test("both registered rasters share a map transform and routes render above them", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const rasters = html.indexOf('id="mapRasters"'),
    optical = html.indexOf('id="terrainImage"'),
    elevation = html.indexOf('id="elevationImage"'),
    routes = html.indexOf('id="mapSvg"');
  assert.ok(rasters < optical && optical < elevation && elevation < routes);
  assert.match(html, /id="layersPopover"/);
  assert.match(html, /id="elevationLegend"/);
  assert.equal(pack.layers.thermal, undefined);
  assert.equal(pack.boundsMeters.east - pack.boundsMeters.west, 3200);
  assert.equal(pack.boundsMeters.north - pack.boundsMeters.south, 2400);
});
