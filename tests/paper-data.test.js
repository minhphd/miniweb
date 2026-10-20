import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
const read = async path => JSON.parse(await readFile(new URL(`../src/data/${path}`, import.meta.url), 'utf8'));
const profiles = await read('skill-profiles.json');
const catalog = await read('primitives.json');

test('Table 2 parses into ten agents whose weakest family is drag & gesture', () => {
  assert.equal(profiles.agents.length, 10);
  assert.deepEqual(profiles.axes.map(a => a.id), ['nav', 'text', 'select', 'form', 'io', 'drag', 'reason']);
  for (const agent of profiles.agents) {
    const values = Object.values(agent.skills);
    assert.equal(values.length, 7, agent.name);
    assert.ok(values.every(v => v >= 0 && v <= 100), agent.name);
    assert.equal(agent.skills.drag, Math.min(...values), `${agent.name}: drag is the weakest family`);
  }
  assert.equal(Math.max(...profiles.agents.map(a => a.skills.drag)), 24, 'no agent passes more than 24% of drag instances');
});

test('the catalog holds the 37 primitives by family, each with its guide', () => {
  assert.equal(catalog.primitives.length, 37);
  const perFamily = Object.fromEntries(catalog.families.map(f => [f.id, catalog.primitives.filter(p => p.family === f.id).length]));
  assert.deepEqual(perFamily, { drag: 2, select: 9, text: 8, form: 10, nav: 3, io: 4, reason: 1 });
  for (const p of catalog.primitives) {
    assert.ok(p.description && p.span[0] && p.span[1], `${p.name}: description and span`);
    assert.ok(p.tasks >= 3, `${p.name}: kept primitives have at least 3 task instances`);
    assert.ok(p.guide?.sections.some(s => s.title === 'Steps' && s.items.length), `${p.name}: guide with steps`);
  }
});

test('the PDF figure ships with its SVG fallback', async () => {
  for (const file of ['method.pdf', 'method.svg']) assert.ok((await stat(new URL(`../public/research/${file}`, import.meta.url))).size > 10_000, file);
  assert.match(await readFile(new URL('../public/research/method.pdf', import.meta.url), 'latin1').then(s => s.slice(0, 5)), /^%PDF-/);
});

test('skill improvement reproduces the numbers the paper states', async () => {
  const s = await read('skill-improvement.json');
  const rate = ([passed, total]) => Math.round(1000 * passed / total) / 10;
  assert.equal(s.single.tasks, 103);
  assert.equal(s.inside.tasks, 62);
  assert.deepEqual([rate(s.single.all.base), rate(s.single.all.pooled)], [55.3, 80.3], 'single-primitive success, Sec. 4.2');
  assert.deepEqual(['base', 'pooled', 'planner', 'planner_pooled'].map(a => rate(s.inside.all[a])), [44.1, 45.1, 49.8, 63.7], 'primitive success inside the held-out tasks');
  assert.deepEqual([s.length.arms.base[2], s.length.arms.planner_pooled[2]], [14.5, 33.3], 'tasks of three or more primitives, Fig. 6');
  for (const [family, arms] of Object.entries(s.single.families)) {
    if (family !== 'reason') assert.ok(rate(arms.pooled) > rate(arms.base), `${family}: practice lifts every trained family (Fig. 7)`);
  }
  for (const [family, arms] of Object.entries(s.inside.families)) {
    assert.ok(rate(arms.planner_pooled) > rate(arms.planner), `${family}: the trained executor lifts every family under the planner`);
  }
});

test('the annotation tool screenshots ship at full resolution', async () => {
  const sharp = (await import('sharp')).default;
  for (const name of ['dashboard', 'task_editor', 'verify', 'macro_browser']) {
    const metadata = await sharp(await readFile(new URL(`../public/research/annotation/${name}.webp`, import.meta.url))).metadata();
    assert.deepEqual([metadata.format, metadata.width, metadata.height], ['webp', 2160, 1350], name);
  }
});
