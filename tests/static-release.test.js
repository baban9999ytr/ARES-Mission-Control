import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { checkStaticRelease } from "../tools/check_static_release.js";

async function withDist(fn) {
  const dir = await mkdtemp(join(tmpdir(), "ares-release-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("Pages release gate accepts a compact static bundle", async () =>
  withDist(async (dir) => {
    await mkdir(join(dir, "public"));
    await writeFile(join(dir, "index.html"), "<h1>ARES</h1>");
    await writeFile(join(dir, "public", "mission-pack.json"), "{}");
    const result = await checkStaticRelease(pathToFileURL(dir + sep));
    assert.equal(result.files, 2);
    assert.ok(result.bytes > 0);
  }));

test("Pages release gate rejects assets over the configured size limit", async () =>
  withDist(async (dir) => {
    await writeFile(join(dir, "too-large.bin"), Buffer.alloc(11));
    await assert.rejects(
      checkStaticRelease(pathToFileURL(dir + sep), { maxBytes: 10 }),
      /asset limit exceeded/,
    );
  }));

test("Pages release gate rejects raw TIFFs even when small", async () =>
  withDist(async (dir) => {
    await writeFile(join(dir, "nf_DEM_1m.tif"), "II*");
    await assert.rejects(
      checkStaticRelease(pathToFileURL(dir + sep)),
      /Raw raster/,
    );
  }));

test("Pages release gate rejects accidentally copied environment files", async () =>
  withDist(async (dir) => {
    await writeFile(join(dir, ".env"), "DO_NOT_DEPLOY");
    await assert.rejects(
      checkStaticRelease(pathToFileURL(dir + sep)),
      /Sensitive file/,
    );
  }));

test("Pages release gate detects excessive asset count", async () =>
  withDist(async (dir) => {
    await writeFile(join(dir, "a.txt"), "a");
    await writeFile(join(dir, "b.txt"), "b");
    await assert.rejects(
      checkStaticRelease(pathToFileURL(dir + sep), { maxFiles: 1 }),
      /file limit exceeded/,
    );
  }));
