import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = async (path) => readFile(new URL(path, root), "utf8");

test("Cloudflare Worker serves dist and supports history deep links", async () => {
  const config = JSON.parse(await read("wrangler.json"));
  assert.equal(config.name, "ares-mission-control");
  assert.equal(config.assets.directory, "./dist");
  assert.equal(config.assets.not_found_handling, "single-page-application");
  assert.ok(/^2026-\d{2}-\d{2}$/.test(config.compatibility_date));
  assert.equal(
    config.main,
    undefined,
    "Pure static Worker must not require script deployment",
  );
});

test("Source page correctly distinguishes measured CTX and synthetic demo", async () => {
  const html = await read("sources.html");
  assert.match(
    html,
    /measured Jezero CTX optical mosaic and digital elevation model/i,
  );
  assert.match(html, /optional synthetic demo/i);
  assert.match(html, /NOT CERTIFIED EVA NAVIGATION/i);
  assert.match(html, /40 m cell spacing/i);
  assert.doesNotMatch(
    html,
    /We will integrate georeferenced science datasets next/i,
  );
  assert.doesNotMatch(html, /SIMULATED TERRAIN · NOT NASA DATA/i);
});

test("Build copies scientific documents and generates a commit identifier", async () => {
  const build = await read("tools/build.js");
  assert.match(build, /'IMPORT_REAL_DATA.md'/);
  assert.match(build, /'build-info.json'/);
  assert.match(build, /CF_PAGES_COMMIT_SHA\|\|git\(\['rev-parse','HEAD'\]\)/);
});

test("Planner uses an absolute base for deep-link asset resolution", async () => {
  const html = await read("index.html");
  assert.match(html, /<base href="\/"\s*\/>/);
  assert.match(html, /src="\.\/src\/main\.js"/);
});
