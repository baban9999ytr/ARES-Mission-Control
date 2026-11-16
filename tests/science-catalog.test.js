import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validateScienceCatalog,
  marsProject,
  scienceCoverage,
} from "../src/data/science-catalog.js";
import { planRoute } from "../src/engine/routing.js";
const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const pack = read("../public/data/mission-pack.json");
const jezero = read("../jezero-science-points.json");
const global = read("../science-points.json");

test("candidate catalogs retain separate geographic scopes and reject malformed records", () => {
  assert.equal(validateScienceCatalog(jezero, "jezero").points.length, 8);
  assert.equal(validateScienceCatalog(global, "global").points.length, 8);
  assert.throws(
    () =>
      validateScienceCatalog(
        { ...jezero, coordinate_convention: "Earth WGS84" },
        "jezero",
      ),
    /Invalid Mars science catalog/,
  );
  assert.throws(
    () =>
      validateScienceCatalog({ ...jezero, points: [{ id: "bad" }] }, "jezero"),
    /Invalid science point/,
  );
  const invalid = structuredClone(jezero);
  invalid.points[2].coordinates.longitude_east = 999;
  assert.throws(
    () => validateScienceCatalog(invalid, "jezero"),
    /Invalid Mars coordinate/,
  );
});

test("Mars WKT transform agrees with independently checked projected Three Forks reference", () => {
  const p = marsProject(77.41359752, 18.45369687, pack.crsWkt);
  assert.ok(Math.abs(p.east - 4588667.577188969) < 0.001);
  assert.ok(Math.abs(p.north - 1093837.300156033) < 0.001);
  assert.throws(() => marsProject(77, 18, "EPSG:4326"), /Unsupported Mars CRS/);
});

test("all submitted Jezero points fail current crop eligibility for explicit reasons", () => {
  const outcomes = jezero.points.map((p) => scienceCoverage(p, pack));
  assert.deepEqual(
    outcomes.map((o) => o.status),
    [
      "no-point",
      "no-point",
      "outside",
      "outside",
      "outside",
      "no-point",
      "outside",
      "outside",
    ],
  );
  assert.ok(outcomes.every((o) => !o.eligible));
  assert.equal(outcomes[4].projected.north > pack.boundsMeters.north, true);
});

test("inside, null and nodata science cells require validity and source evidence", () => {
  const p = {
    coordinates: {
      latitude: ((1092200 / 3396190) * 180) / Math.PI,
      longitude_east: ((4587600 / 3396190) * 180) / Math.PI,
    },
  };
  assert.equal(scienceCoverage(p, pack).status, "unverified");
  const eligible = scienceCoverage(p, pack, true);
  assert.equal(eligible.status, "eligible");
  assert.ok(planRoute(pack, pack.start, eligible.cell, "distance", false));
  const blocked = structuredClone(pack);
  blocked.heights[eligible.cell.y * pack.gridWidth + eligible.cell.x] = null;
  assert.equal(scienceCoverage(p, blocked, true).status, "nodata");
  assert.equal(scienceCoverage({ coordinates: null }, pack).status, "no-point");
});
