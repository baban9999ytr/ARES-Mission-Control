import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseDonki,
  weatherState,
  fetchDonki,
  formatDonkiStatus,
  DONKI_BASE,
} from "../src/data/donki.js";
const fixture = (name) =>
  JSON.parse(
    readFileSync(new URL(`fixtures/donki-${name}.json`, import.meta.url)),
  );
test("parses sanitized live FLR, CME and historical SEP schemas", () => {
  for (const type of ["FLR", "CME", "SEP"]) {
    const event = parseDonki(type, fixture(type.toLowerCase()))[0];
    assert.equal(event.type, type);
    assert.match(event.time, /Z$/);
    assert.match(event.link, /ccmc.gsfc.nasa.gov/);
  }
  assert.deepEqual(parseDonki("SEP", []), []);
  assert.throws(() => parseDonki("FLR", {}), /Malformed/);
  assert.throws(
    () => parseDonki("CME", [{ activityID: "x", startTime: "invalid" }]),
    /Malformed/,
  );
});
test("empty, partial, failed and stale responses remain explicit", () => {
  const now = new Date("2026-11-14T18:00:00Z");
  const at = now.toISOString();
  assert.equal(
    weatherState([{ status: "fulfilled", value: [] }], at, now).status,
    "empty",
  );
  assert.equal(
    weatherState(
      [{ status: "rejected", reason: new Error("network") }],
      at,
      now,
    ).status,
    "unavailable",
  );
  assert.equal(
    weatherState(
      [
        { status: "fulfilled", value: [] },
        { status: "rejected", reason: new Error("network") },
      ],
      at,
      now,
    ).status,
    "partial",
  );
  assert.equal(
    weatherState(
      [{ status: "fulfilled", value: [] }],
      "2026-11-14T17:00:00Z",
      now,
    ).status,
    "stale",
  );
});
test("fetch uses new CCMC API and reports per-type failure without synthetic events", async () => {
  const requests = [];
  const fetchImpl = async (url) => {
    requests.push(url);
    if (url.includes("/CME?")) return { ok: false, status: 503 };
    return {
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [],
    };
  };
  const result = await fetchDonki({
    fetchImpl,
    now: new Date("2026-11-14T12:00:00Z"),
  });
  assert.equal(result.status, "partial");
  assert.deepEqual(result.events, []);
  assert.equal(result.types[1].ok, false);
  assert.ok(
    requests.every(
      (u) => u.startsWith(DONKI_BASE) && u.includes("startDate=2026-11-07"),
    ),
  );
});
test("all failed or malformed live responses produce unavailable state", async () => {
  const failed = await fetchDonki({
    fetchImpl: async () => {
      throw new Error("offline");
    },
    now: new Date("2026-11-14T12:00:00Z"),
  });
  assert.equal(failed.status, "unavailable");
  assert.deepEqual(failed.events, []);
  const malformed = await fetchDonki({
    fetchImpl: async () => ({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ bad: "schema" }),
    }),
    now: new Date("2026-11-14T12:00:00Z"),
  });
  assert.equal(malformed.status, "unavailable");
  assert.deepEqual(malformed.events, []);
  const label = formatDonkiStatus(failed);
  assert.match(label, /Attempted/);
  assert.doesNotMatch(label, /Retrieved/);
  assert.match(label, /FLR: unavailable, CME: unavailable, SEP: unavailable/);
});
