export const HUB_IDS = new Set([
  'email', 'banking', 'instant-messaging', 'calendar-todo',
  'cloud-storage-file-transfer', 'password-manager',
]);

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Rotate normalized world coordinates around the vertical and horizontal axes. */
export function rotatePoint(point, yaw = 0, pitch = 0) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const x = point.x * cy + point.z * sy;
  const z = point.z * cy - point.x * sy;
  return { x, y: point.y * cp - z * sp, z: point.y * sp + z * cp };
}

/** An aspect-aware perspective projection; positive z faces the viewer. */
export function projectPoint(point, width, height, zoom = 1, hub = false) {
  const depth = clamp((point.z + 1) / 2, 0, 1);
  const perspective = 2.9 / (2.9 - point.z * 0.6);
  const radiusX = Math.max(55, width / 2 - (width < 600 ? 46 : 76));
  const radiusY = Math.max(45, height / 2 - 62);
  return {
    x: width / 2 + point.x * radiusX * perspective * zoom,
    y: height / 2 + point.y * radiusY * perspective * zoom,
    depth,
    scale: (0.43 + depth * 0.39 + (hub ? 0.09 : 0)) * Math.sqrt(zoom),
  };
}

const HUB_POSITIONS = {
  email: { x: -0.29, y: -0.56, z: 0.83 },
  banking: { x: -0.66, y: 0.09, z: 0.78 },
  'instant-messaging': { x: 0.2, y: 0.08, z: 0.97 },
  'calendar-todo': { x: 0.42, y: -0.51, z: 0.8 },
  'cloud-storage-file-transfer': { x: -0.22, y: 0.59, z: 0.78 },
  'password-manager': { x: 0.63, y: 0.43, z: 0.63 },
};

/** A deterministic spherical distribution keeps reset and filtering predictable. */
export function distributeSites(sites) {
  const count = sites.filter((site) => !HUB_IDS.has(site.id)).length;
  let index = 0;
  return sites.map((site) => {
    if (HUB_POSITIONS[site.id]) return { ...HUB_POSITIONS[site.id] };
    const y = 1 - (2 * (index + 0.5)) / Math.max(1, count);
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = index++ * Math.PI * (3 - Math.sqrt(5)) + 0.8;
    return { x: Math.cos(angle) * ringRadius, y, z: Math.sin(angle) * ringRadius };
  });
}

/** Illustrative connections reflect shared categories and spatial neighbors. */
export function buildEdges(sites, positions) {
  const edges = [];
  const seen = new Set();
  const add = (a, b) => {
    if (a === b) return;
    const key = `${Math.min(a, b)}:${Math.max(a, b)}`;
    if (!seen.has(key)) {
      seen.add(key);
      edges.push([a, b]);
    }
  };
  const categories = new Map();
  sites.forEach((site, index) => {
    const key = site.category || 'Other';
    if (!categories.has(key)) categories.set(key, []);
    categories.get(key).push(index);
  });
  for (const members of categories.values()) {
    for (let i = 1; i < members.length; i++) add(members[i - 1], members[i]);
    if (members.length > 3) add(members[0], members.at(-1));
  }
  positions.forEach((point, index) => {
    let nearest = -1;
    let nearestDistance = Infinity;
    positions.forEach((other, candidate) => {
      if (candidate === index) return;
      const distance = (point.x - other.x) ** 2 + (point.y - other.y) ** 2 + (point.z - other.z) ** 2;
      if (distance < nearestDistance) {
        nearest = candidate;
        nearestDistance = distance;
      }
    });
    if (nearest !== -1) add(index, nearest);
  });
  const hubs = sites.flatMap((site, index) => HUB_IDS.has(site.id) ? [index] : []);
  hubs.forEach((index, i) => { if (i > 0) add(hubs[i - 1], index); });
  return edges;
}
