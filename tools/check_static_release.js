import { readdir, lstat } from 'node:fs/promises';

export const PAGES_MAX_ASSET_BYTES = 25 * 1024 * 1024;
export const PAGES_MAX_FILES_FREE = 20_000;

// Cloudflare Pages cannot host a single object larger than 25 MiB.
// Fail the release build before deploying accidentally bundled raw science data.
export async function checkStaticRelease(directory, { maxBytes = PAGES_MAX_ASSET_BYTES, maxFiles = PAGES_MAX_FILES_FREE } = {}) {
  let count = 0;
  let totalBytes = 0;
  const inspect = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
      if (entry.isSymbolicLink()) throw new Error(`Release contains symlink: ${file.pathname}`);
      if (entry.isDirectory()) { await inspect(file); continue; }
      if (!entry.isFile()) throw new Error(`Unexpected release asset: ${file.pathname}`);
      const size = (await lstat(file)).size;
      if (size > maxBytes) throw new Error(`Cloudflare Pages 25 MiB asset limit exceeded: ${file.pathname} (${size} bytes)`);
      if (/\.(?:tif|tiff|vrt|part|crdownload)$/i.test(entry.name)) throw new Error(`Raw raster or incomplete download in Pages output: ${file.pathname}`);
      if (/^(?:\.env(?:\..*)?|\.git|id_rsa|id_ed25519)$/i.test(entry.name)) throw new Error(`Sensitive file in Pages output: ${file.pathname}`);
      count++;
      totalBytes += size;
      if (count > maxFiles) throw new Error(`Cloudflare Pages Free file limit exceeded: ${count} files`);
    }
  };
  await inspect(directory instanceof URL ? directory : new URL(directory, import.meta.url));
  return { files: count, bytes: totalBytes };
}
