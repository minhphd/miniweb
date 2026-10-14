import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
const sites = JSON.parse(await readFile(new URL('../src/data/sites.json', import.meta.url)));

test('every catalog site has a local inert UI preview and a real MiniWeb URL', async () => {
  assert.equal(sites.length, 65);
  assert.equal(new Set(sites.map(s => s.id)).size, 65);
  assert.equal(new Set(sites.map(s => s.category)).size, 15);
  for (const site of sites) {
    assert.equal(new URL(site.url).origin, 'https://miniweb-production.up.railway.app');
    assert.equal(new URL(site.url).pathname, `/sites/${site.id}/`);
    assert.ok(site.description.length > 30, `${site.id} requires a description`);
    const html = await readFile(new URL(`../public/previews/${site.id}.html`, import.meta.url), 'utf8');
    assert.match(html, /<body\b[^>]*\binert\b/i);
    assert.match(html, /script-src 'none'/);
    assert.match(html, /form-action 'none'/);
    assert.doesNotMatch(html, /<(?:script|iframe|object|embed)\b/i, `${site.id} must be a passive snapshot`);
  }
});

test('all site thumbnails decode correctly and stay within the graph payload budget', async () => {
  let totalBytes = 0;
  for (const site of sites) {
    const image = await readFile(new URL(`../public/previews/thumbnails/${site.id}.webp`, import.meta.url));
    const metadata = await sharp(image).metadata();
    assert.equal(metadata.format, 'webp', site.id);
    assert.equal(metadata.width, 550, site.id);
    assert.equal(metadata.height, 350, site.id);
    await sharp(image).raw().toBuffer();
    totalBytes += image.length;
  }
  assert.ok(totalBytes < 1024 * 1024, `Preview images must total less than 1 MiB; got ${totalBytes} bytes`);
});
