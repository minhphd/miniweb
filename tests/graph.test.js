import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { HUB_IDS, buildEdges, distributeSites, projectPoint, rotatePoint } from '../src/graph-math.js';

const sites = JSON.parse(readFileSync(new URL('../src/data/sites.json', import.meta.url), 'utf8'));
const lengthSquared = point => point.x ** 2 + point.y ** 2 + point.z ** 2;
const almostEqual = (actual, expected, tolerance = 1e-10) => assert.ok(
  Math.abs(actual - expected) <= tolerance,
  `Expected ${actual} to be within ${tolerance} of ${expected}`,
);
const edgeKey = (a, b) => `${Math.min(a, b)}:${Math.max(a, b)}`;

test('orbit rotations preserve geometry without mutating world coordinates', () => {
  const original = { x: 0.34, y: -0.61, z: 0.74 };
  const point = Object.freeze({ ...original });
  for (const yaw of [-Math.PI, -0.7, 0, 1.2, Math.PI * 2]) {
    for (const pitch of [-1.2, 0, 1.2]) {
      almostEqual(lengthSquared(rotatePoint(point, yaw, pitch)), lengthSquared(point));
    }
  }
  assert.deepEqual(point, original);
  const quarterTurn = rotatePoint({ x: 1, y: 0, z: 0 }, Math.PI / 2, 0);
  almostEqual(quarterTurn.x, 0);
  almostEqual(quarterTurn.y, 0);
  almostEqual(quarterTurn.z, -1);
});

test('perspective distinguishes front and back while keeping the center fixed', () => {
  const back = projectPoint({ x: 0.4, y: 0.2, z: -1 }, 1100, 600);
  const front = projectPoint({ x: 0.4, y: 0.2, z: 1 }, 1100, 600);
  assert.ok(front.scale > back.scale);
  assert.ok(front.x > back.x);
  assert.ok(front.y > back.y);
  assert.ok(front.depth > back.depth);
  for (const z of [-1, 0, 1]) {
    const center = projectPoint({ x: 0, y: 0, z }, 1100, 600);
    assert.equal(center.x, 550);
    assert.equal(center.y, 300);
  }
});

test('zoom expands around the viewport center rather than translating the graph', () => {
  const point = { x: -0.4, y: 0.65, z: 0.7 };
  const normal = projectPoint(point, 800, 450, 1);
  const zoomed = projectPoint(point, 800, 450, 2);
  almostEqual(zoomed.x - 400, (normal.x - 400) * 2);
  almostEqual(zoomed.y - 225, (normal.y - 225) * 2);
  assert.ok(zoomed.scale > normal.scale);
  assert.equal(zoomed.depth, normal.depth);
});

test('every catalog site receives a stable finite position across responsive viewports and orbits', () => {
  const positions = distributeSites(sites);
  assert.equal(positions.length, sites.length);
  assert.deepEqual(positions, distributeSites(sites));
  assert.equal(new Set(positions.map(point => JSON.stringify(point))).size, sites.length);
  for (const [width, height] of [[320, 280], [768, 450], [1440, 700]]) {
    for (const yaw of [0, Math.PI / 2, Math.PI, 4.2]) {
      for (const zoom of [0.55, 1, 2.2]) {
        positions.forEach((point, index) => {
          const projected = projectPoint(rotatePoint(point, yaw, 0.4), width, height, zoom, HUB_IDS.has(sites[index].id));
          assert.ok(Object.values(projected).every(Number.isFinite));
          assert.ok(projected.scale > 0);
          assert.ok(projected.depth >= 0 && projected.depth <= 1);
        });
      }
    }
  }
});

test('connections are unique, valid, and give every catalog site a neighbor', () => {
  const edges = buildEdges(sites, distributeSites(sites));
  const seen = new Set();
  const connected = new Set();
  for (const [a, b] of edges) {
    assert.ok(Number.isInteger(a) && a >= 0 && a < sites.length);
    assert.ok(Number.isInteger(b) && b >= 0 && b < sites.length);
    assert.notEqual(a, b);
    const key = edgeKey(a, b);
    assert.ok(!seen.has(key), `Duplicate undirected connection ${key}`);
    seen.add(key);
    connected.add(a);
    connected.add(b);
  }
  assert.equal(connected.size, sites.length);
});

test('related sites remain connected even when they are far apart in the layout', () => {
  const sample = [
    { id: 'first', category: 'Communication' },
    { id: 'second', category: 'Finance' },
    { id: 'third', category: 'Communication' },
    { id: 'fourth', category: 'Finance' },
  ];
  const points = [{ x: -1, y: 0, z: 0 }, { x: -0.99, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0.99, y: 0, z: 0 }];
  const edges = new Set(buildEdges(sample, points).map(([a, b]) => edgeKey(a, b)));
  assert.ok(edges.has('0:2'), 'Communication sites should share a connection');
  assert.ok(edges.has('1:3'), 'Financial sites should share a connection');
  assert.ok(edges.has('0:1'), 'Nearby nodes should have an illustrative connection');
});

test('empty and single-site catalogs do not produce invalid connections', () => {
  assert.deepEqual(distributeSites([]), []);
  assert.deepEqual(buildEdges([], []), []);
  const single = [{ id: 'email', category: 'Communication' }];
  assert.deepEqual(buildEdges(single, distributeSites(single)), []);
});
