import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
