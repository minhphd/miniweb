import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
const source = await readFile(new URL('../src/data/showcase.json', import.meta.url), 'utf8');
const showcase = JSON.parse(source);
const index = JSON.parse(await readFile(new URL('../src/data/task-index.json', import.meta.url), 'utf8'));
const taskFiles = await Promise.all(index.map(async t => [t, JSON.parse(await readFile(new URL(`../public/tasks/${t.id}.json`, import.meta.url), 'utf8'))]));
const families = new Set(['drag', 'select', 'text', 'form', 'nav', 'io', 'reason']);

test('the exported examples and tasks carry no hosts, paths, or annotator names', () => {
  for (const text of [source, JSON.stringify(index), ...taskFiles.map(([, d]) => JSON.stringify(d))]) {
    // localhost:8080 is the benchmark's own address for its sites, part of some tasks' answers; our evaluation ran
    // elsewhere. Omar Haddad is a synthetic Meridian Chat user, not the annotator.
    assert.doesNotMatch(text, /localhost(?!:8080\/sites\/)|railway\.app|\/scratch|\/home\/|u1653932/i);
    assert.doesNotMatch(text, /\b(Minh|Farhan|Hern[aá]n|Reaz|Kenny|Kenneth)\b|\bOmar\b(?! Haddad)/);
  }
});

test('the task explorer holds all 369 tasks, 43 of them cross-site, with a few per grid cell showing screenshots', () => {
  assert.equal(index.length, 369);
  assert.equal(new Set(index.map(t => t.id)).size, 369);
  assert.equal(index.filter(t => t.sites.length > 1).length, 43, 'cross-site tasks, as the paper counts them');
  assert.equal(index.filter(t => t.split === 'test').length, 62);
  const cells = new Map();
  for (const t of index) {
    const key = `${t.sites.length > 1}:${Math.min(t.primitives.length, 6)}`;
    cells.set(key, (cells.get(key) || 0) + (t.shown ? 1 : 0));
  }
  for (const [key, shown] of cells) assert.ok(shown >= 1, `grid cell ${key} has a task with screenshots`);
  for (const [t, d] of taskFiles) {
    assert.equal(d.primitives.length, t.primitives.length, t.id);
    assert.equal(d.steps.length, t.steps, t.id);
    assert.equal(d.steps.some(s => s.image), t.shown, `${t.id}: screenshots only for the tasks shown`);
  }
});

test('every generated trajectory carries its sampled configuration, check, and a kept attempt', () => {
  for (const t of showcase.generated) {
    const p = t.pipeline;
    assert.ok(p.control && p.argument && p.start && p.check, `${t.id}: sample and check`);
    assert.equal(p.attempts.filter(a => a.ok).length, 1, `${t.id}: exactly one kept attempt`);
    assert.ok(p.attempts.at(-1).ok && p.attempts.every(a => a.script.length > 20), `${t.id}: the kept attempt is the last, with scripts`);
  }
  for (const trace of showcase.agent) {
    assert.equal(trace.turns.filter(t => t.action === 'delegate').length, trace.delegations.length, `${trace.id}: one turn per delegation`);
    assert.equal(trace.turns.at(-1).action, 'done', `${trace.id}: the planner answers last`);
  }
});

test('every primitive span fits its task and every family is known', () => {
  for (const task of [...taskFiles.map(([t, d]) => ({ id: t.id, ...d })), ...showcase.agent]) {
    for (const p of task.primitives) {
      assert.ok(families.has(p.family), `${task.id}: ${p.name} has family ${p.family}`);
      if (task.steps && p.span) assert.ok(p.span[0] >= 1 && p.span[1] <= task.steps.length && p.span[0] <= p.span[1], `${task.id}: ${p.name} span ${p.span}`);
    }
  }
  for (const trace of showcase.agent) {
    assert.deepEqual(Object.keys(trace.verdicts).sort(), [...new Set(trace.primitives.map(p => p.name))].sort(), trace.id);
    for (const d of trace.delegations) assert.ok(families.has(d.family), `${trace.id}: ${d.family}`);
  }
});

test('every referenced screenshot exists and decodes with its recorded size', async () => {
  const steps = [...taskFiles.map(([, d]) => d), ...showcase.generated, ...showcase.agent.map(trace => trace.single).filter(Boolean)].flatMap(example => example.steps).filter(step => step.image);
  assert.ok(steps.length > 100);
  for (const step of steps) {
    const metadata = await sharp(await readFile(new URL(`../public/${step.image}`, import.meta.url))).metadata();
    assert.equal(metadata.format, 'webp', step.image);
    assert.deepEqual([metadata.width, metadata.height], [step.w, step.h], step.image);
  }
});
