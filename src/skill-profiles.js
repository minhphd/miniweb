// Skill profiles of the ten untrained agents (paper Table 2), drawn as spider plots as in the paper's teaser: seven
// skill families on the axes, drag & gesture at the bottom, family colors on the labels and vertices.
import data from './data/skill-profiles.json';
import { escapeHtml as escape } from './structure-content.js';
import { reduced, whenVisible } from './motion.js';

const order = ['drag', 'io', 'nav', 'reason', 'select', 'form', 'text'];   // clockwise from the bottom, as in the paper
const label = Object.fromEntries(data.axes.map(axis => [axis.id, axis.label]));
const angle = i => (90 + i * 360 / order.length) * Math.PI / 180;
const at = (c, r, i, value = 100) => [c + r * value / 100 * Math.cos(angle(i)), c + r * value / 100 * Math.sin(angle(i))];
const points = (c, r, skills) => order.map((id, i) => at(c, r, i, skills[id]).map(n => n.toFixed(1)).join(',')).join(' ');
const mean = Object.fromEntries(order.map(id => [id, data.agents.reduce((sum, a) => sum + a.skills[id], 0) / data.agents.length]));
const groups = [...new Set(data.agents.map(a => a.group))];

/** One spider plot. `others` are drawn faintly behind; `values` labels each axis with the agent's score. */
function radar(agent, { size = 200, others = [], values = false, reference = null } = {}) {
  const c = size / 2;
  const r = size * (values ? 0.32 : 0.36);
  const rings = [25, 50, 75, 100].map(v => `<polygon class="radar-ring" points="${points(c, r, Object.fromEntries(order.map(id => [id, v])))}" />`).join('');
  const spokes = order.map((_, i) => { const [x, y] = at(c, r, i); return `<line class="radar-spoke" x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`; }).join('');
  const half = Math.PI / order.length;
  const [x1, y1] = [c + r * Math.cos(angle(0) - half), c + r * Math.sin(angle(0) - half)];
  const [x2, y2] = [c + r * Math.cos(angle(0) + half), c + r * Math.sin(angle(0) + half)];
  const wedge = `<path class="radar-wedge" d="M${c},${c} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" />`;
  const faint = others.map(o => `<polygon class="radar-other" points="${points(c, r, o.skills)}"><title>${escape(o.name)}</title></polygon>`).join('');
  const ref = reference ? `<polygon class="radar-mean" points="${points(c, r, reference)}" />` : '';
  const shape = agent ? `<polygon class="radar-agent" points="${points(c, r, agent.skills)}" />` + order.map((id, i) => {
    const [x, y] = at(c, r, i, agent.skills[id]);
    return `<circle class="radar-dot fam-${id}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${id === 'drag' ? size / 48 : size / 70}"><title>${label[id]} ${agent.skills[id]}%</title></circle>`;
  }).join('') : '';
  const labels = order.map((id, i) => {
    const [x, y] = at(c, r * 1.2, i);
    const anchor = Math.abs(x - c) < 4 ? 'middle' : x > c ? 'start' : 'end';
    const text = values && agent ? `${label[id]} ${agent.skills[id]}%` : label[id];
    return `<text class="radar-label fam-${id}" x="${x.toFixed(1)}" y="${(y + size / 70).toFixed(1)}" text-anchor="${anchor}">${text}</text>`;
  }).join('');
  const description = agent ? `${agent.name}: ${order.map(id => `${label[id]} ${agent.skills[id]}%`).join(', ')}` : '';
  const pad = size * 0.12;                                   // room beside the plot for the axis labels
  return `<svg class="radar" viewBox="${-pad} 0 ${size + 2 * pad} ${size}" data-c="${c}" data-r="${r}" role="img" aria-label="${escape(description)}">${wedge}${rings}${spokes}${faint}${ref}${shape}${labels}</svg>`;
}

const pct = v => `${v % 1 ? v.toFixed(1) : v}%`;

// Short tags for Table 2's two groups of agents.
const groupTag = group => group.startsWith('General') ? 'general VLM · browser-use' : 'web agent · own loop';

function eachAgent() {
  return `<div class="profile-grid">${data.agents.map(a => `
    <figure class="profile-card"><span class="profile-tag">${groupTag(a.group)}</span>${radar(a, { size: 210, reference: mean })}<figcaption><strong>${escape(a.name)}</strong><span>task success ${pct(a.task)}</span><span class="profile-drag">drag ${pct(a.skills.drag)}</span></figcaption></figure>`).join('')}</div>`;
}

function overlay(selected) {
  const agent = data.agents[selected];
  return `<div class="profile-overlay">${radar(agent, { size: 400, others: data.agents.filter((_, i) => i !== selected), values: true })}
    <div class="profile-list">${groups.map(group => `<p class="profile-group-title">${escape(group)}</p><ul>${data.agents.map((a, i) => a.group !== group ? '' : `<li><button data-agent="${i}" aria-pressed="${i === selected}"><span>${escape(a.name)}</span><span class="profile-bar"><i style="width:${a.task}%"></i></span><b>${pct(a.task)}</b></button></li>`).join('')}</ul>`).join('')}<p class="profile-note">Bars: task success on all 369 tasks.</p></div></div>`;
}

function valueTable() {
  const head = ['Agent', 'Size', 'Task success', ...data.axes.map(a => a.label)];
  return `<details class="profile-table"><summary>Values (Table 2)</summary><div class="paper-table-scroll" tabindex="0" role="region" aria-label="Skill profiles of the ten agents"><table class="paper-table">
    <thead><tr>${head.map((h, i) => `<th scope="col"${i > 2 ? ` class="fam-${data.axes[i - 3].id}"` : ''}>${h}</th>`).join('')}</tr></thead>
    <tbody>${groups.map(group => `<tr class="table-group"><th colspan="${head.length}" scope="colgroup">${escape(group)}</th></tr>${data.agents.filter(a => a.group === group).map(a => {
      const weakest = Math.min(...Object.values(a.skills));
      return `<tr><th scope="row">${escape(a.name)}</th><td>${a.size}</td><td>${a.task.toFixed(1)}</td>${data.axes.map(axis => `<td class="${a.skills[axis.id] === weakest ? 'weakest' : ''}">${a.skills[axis.id]}</td>`).join('')}</tr>`;
    }).join('')}`).join('')}</tbody></table></div></details>`;
}

/** Move a plot's agent polygon and dots from one profile to another (from the centre when `from` is empty). */
function morph(svg, from, to, { duration = 700, delay = 0 } = {}) {
  const polygon = svg?.querySelector('.radar-agent');
  if (!polygon || reduced()) return;
  const c = Number(svg.dataset.c), r = Number(svg.dataset.r);
  const dots = svg.querySelectorAll('.radar-dot');
  const set = skills => {
    polygon.setAttribute('points', points(c, r, skills));
    dots.forEach((dot, i) => { const [x, y] = at(c, r, i, skills[order[i]]); dot.setAttribute('cx', x.toFixed(1)); dot.setAttribute('cy', y.toFixed(1)); });
  };
  const start = performance.now() + delay;
  const frame = now => {
    const t = Math.min(1, Math.max(0, (now - start) / duration));
    const e = 1 - (1 - t) ** 3;
    set(Object.fromEntries(order.map(id => [id, (from?.[id] ?? 0) + (to[id] - (from?.[id] ?? 0)) * e])));
    if (t < 1) requestAnimationFrame(frame);
  };
  set(from || Object.fromEntries(order.map(id => [id, 0])));
  requestAnimationFrame(frame);
}

export function initializeSkillProfiles() {
  const container = document.querySelector('[data-figure="skill-profiles"]');
  if (!container) return;
  const state = { view: 'each', selected: data.agents.findIndex(a => a.name === 'Fara1.5-4B') };
  const frame = document.createElement('div');
  frame.className = 'showcase-frame profiles-frame';
  container.prepend(frame);
  const draw = focus => {
    frame.innerHTML = `<div class="showcase-head"><p class="showcase-title">Skill profiles <span>% of primitive instances passed</span></p>
      <div class="view-toggle" role="group" aria-label="View">${[['each', 'Each agent'], ['overlay', 'All on one plot']].map(([id, name]) => `<button data-view="${id}" aria-pressed="${state.view === id}">${name}</button>`).join('')}</div>
      <span class="showcase-meta"><span class="legend-line"></span>${state.view === 'each' ? 'agent · <span class="legend-line dashed"></span> mean of the ten' : 'selected agent · <span class="legend-line faint"></span> the other nine'}</span></div>
      ${state.view === 'each' ? eachAgent() : overlay(state.selected)}
      ${valueTable()}`;
    if (focus) frame.querySelector(focus)?.focus({ preventScroll: true });
  };
  // Each agent's profile grows from the centre in turn; on one plot, the highlighted profile moves to the next agent.
  let seen = false;
  const grow = () => frame.querySelectorAll('.profile-card .radar').forEach((svg, i) => morph(svg, null, data.agents[i].skills, { delay: i * 70 }));
  const show = (previous) => {
    if (!seen) return;
    if (state.view === 'each') grow();
    else morph(frame.querySelector('.profile-overlay .radar'), previous === undefined ? null : data.agents[previous].skills, data.agents[state.selected].skills, { duration: 550 });
  };
  frame.addEventListener('click', event => {
    const view = event.target.closest('[data-view]');
    const agent = event.target.closest('[data-agent]');
    if (view) { state.view = view.dataset.view; draw(`[data-view="${state.view}"]`); show(); }
    if (agent) { const previous = state.selected; state.selected = Number(agent.dataset.agent); draw(`[data-agent="${state.selected}"]`); show(previous); }
  });
  draw();
  whenVisible(frame, () => { seen = true; show(); });
}
