// Skill improvement, per skill family, from src/data/skill-improvement.json (computed with the paper's own figure
// code): success on the generated single-primitive tasks (Fig. 7), primitive instances passed inside the held-out human
// tasks (Secs. 4.2-4.3), and task success by the number of primitives a task chains (Fig. 6, right).
import data from './data/skill-improvement.json';
import { escapeHtml as escape } from './structure-content.js';
import { animate, playDumbbells, stagger, whenVisible } from './motion.js';

const familyName = { drag: 'Drag & gesture', select: 'Selection', text: 'Text entry', form: 'Forms', nav: 'Navigation', io: 'Out-of-page I/O', reason: 'Reasoning' };
const comparisons = {
  practice: { arms: ['base', 'pooled'], name: 'Practice', detail: 'single agent: untrained → trained on our data' },
  composition: { arms: ['planner', 'planner_pooled'], name: 'Composition', detail: 'planner: untrained executor → trained executor (MiniWebAgent)' },
  overall: { arms: ['base', 'planner_pooled'], name: 'Both', detail: 'untrained single agent → MiniWebAgent' },
};
const views = {
  single: { name: 'Single primitives', detail: `${data.single.tasks} generated tasks` },
  inside: { name: 'Inside full tasks', detail: `${data.inside.tasks} held-out human tasks` },
  length: { name: 'By task length', detail: 'primitives per task' },
};
const rate = ([passed, total]) => 100 * passed / total;
const fmt = v => v.toFixed(1);

// What the paper says about each view and comparison; the figure states only these.
const notes = {
  'single:practice': `Success on the ${data.single.tasks} generated single-primitive tasks of the 13 held-out sites, over ${data.runs} runs; reasoning, which is not trained, is left out. <b>Practice lifts every skill family.</b>`,
  'single:composition': `Success on the ${data.single.tasks} generated single-primitive tasks of the 13 held-out sites, over ${data.runs} runs; reasoning, which is not trained, is left out.`,
  'single:overall': `Success on the ${data.single.tasks} generated single-primitive tasks of the 13 held-out sites, over ${data.runs} runs; reasoning, which is not trained, is left out.`,
  'inside:practice': `Primitive instances passed inside the ${data.inside.tasks} held-out human tasks, over ${data.runs} runs. <b>Trained alone, the agent’s primitives barely improve inside full tasks</b> (${fmt(rate(data.inside.all.base))}% to ${fmt(rate(data.inside.all.pooled))}%): it often stops after the first primitive.`,
  'inside:composition': `Primitive instances passed inside the ${data.inside.tasks} held-out human tasks, over ${data.runs} runs. <b>Under the planner, the trained executor lifts every skill family</b> (${fmt(rate(data.inside.all.planner))}% to ${fmt(rate(data.inside.all.planner_pooled))}% overall).`,
  'inside:overall': `Primitive instances passed inside the ${data.inside.tasks} held-out human tasks, over ${data.runs} runs.`,
  'length:practice': `Task success on the ${data.inside.tasks} held-out human tasks by the number of primitives they chain, over ${data.runs} runs.`,
  'length:composition': `Task success on the ${data.inside.tasks} held-out human tasks by the number of primitives they chain, over ${data.runs} runs.`,
  'length:overall': `Task success on the ${data.inside.tasks} held-out human tasks by the number of primitives they chain, over ${data.runs} runs. <b>On tasks of three or more primitives, MiniWebAgent more than doubles the untrained single agent</b> (${fmt(data.length.arms.base[2])}% to ${fmt(data.length.arms.planner_pooled[2])}%).`,
};

function dumbbells(set, [from, to]) {
  const view = data[set];
  const families = Object.keys(view.families).filter(f => set !== 'single' || f !== 'reason')
    .sort((a, b) => rate(view.families[a][from]) - rate(view.families[b][from]));
  const row = (name, counts, family, total = false) => {
    const a = rate(counts[from]);
    const b = rate(counts[to]);
    const gain = b - a;
    const perRun = Math.round(counts[from][1] / data.runs);
    return `<div class="gain-row skill-row ${total ? 'is-total' : ''}" role="listitem" aria-label="${escape(name)}: ${fmt(a)}% to ${fmt(b)}%">
      <span class="gain-label ${family ? `fam-${family} family-label` : ''}">${escape(name)}<small>${perRun} ${set === 'single' ? 'tasks' : 'instances'} per run</small></span>
      <span class="gain-track" title="${fmt(a)}% → ${fmt(b)}%"><i class="gain-link ${gain < 0 ? 'is-loss' : ''}" style="left:${Math.min(a, b)}%;width:${Math.abs(gain)}%"></i><i class="gain-dot base" style="left:${a}%"></i><i class="gain-dot ours" style="left:${b}%"></i></span>
      <b class="gain-value ${gain < 0 ? 'is-loss' : ''}">${gain >= 0 ? '+' : '−'}${Math.abs(gain).toFixed(1)}</b></div>`;
  };
  return `<div class="skill-rows" role="list">${row('All primitives', view.all, null, true)}${families.map(f => row(familyName[f], view.families[f], f)).join('')}</div>
    <div class="gain-axis" aria-hidden="true"><span></span><span class="gain-ticks"><i style="left:0">0</i><i style="left:25%">25</i><i style="left:50%">50</i><i style="left:75%">75</i><i style="left:100%">100%</i></span><span></span></div>
    <p class="gain-axis-label" aria-hidden="true">${set === 'single' ? 'task success on single primitives' : 'primitive instances passed inside the tasks'}</p>`;
}

function lengthChart([from, to]) {
  const W = 560, H = 300, L = 44, R = 150, T = 16, B = 44;
  const x = i => L + i * (W - L - R) / 2;
  const y = v => T + (100 - v) * (H - T - B) / 100;
  const styles = { base: ['#7D8798', 'solid', 'circle'], pooled: ['var(--design-accent)', 'solid', 'circle'], planner: ['#7D8798', 'dashed', 'square'], planner_pooled: ['var(--design-accent)', 'dashed', 'square'] };
  const lines = Object.entries(data.length.arms).map(([arm, values]) => {
    const [color, dash, marker] = styles[arm];
    const on = arm === from || arm === to;
    const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const marks = values.map((v, i) => marker === 'circle' ? `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" />` : `<rect x="${x(i) - 4.5}" y="${y(v) - 4.5}" width="9" height="9" />`).join('');
    const labels = on ? values.map((v, i) => `<text x="${x(i) + 8}" y="${y(v) - 7}" class="length-value">${fmt(v)}</text>`).join('') : '';
    const end = `<text x="${x(2) + 14}" y="${y(values[2]) + 4}" class="length-name">${escape(data.arms[arm])}</text>`;
    return `<g class="length-line ${on ? 'is-on' : ''}" style="--line:${color}" ${dash === 'dashed' ? 'data-dashed' : ''}><polyline points="${pts}" />${marks}${labels}${on ? end : ''}</g>`;
  }).join('');
  const grid = [0, 25, 50, 75, 100].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="length-grid" /><text x="${L - 8}" y="${y(v) + 4}" class="length-tick" text-anchor="end">${v}${v === 100 ? '%' : ''}</text>`).join('');
  const ticks = data.length.bins.map((b, i) => `<text x="${x(i)}" y="${H - B + 20}" class="length-tick" text-anchor="middle">${b}</text><text x="${x(i)}" y="${H - B + 35}" class="length-n" text-anchor="middle">${data.length.tasks[i]} tasks</text>`).join('');
  const summary = Object.entries(data.length.arms).map(([arm, v]) => `${data.arms[arm]}: ${v.map(fmt).join('%, ')}%`).join('; ');
  return `<svg class="length-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Task success by primitives per task (1, 2, 3 or more). ${escape(summary)}.">${grid}${ticks}${lines}</svg>
    <p class="gain-axis-label length-axis" aria-hidden="true">primitives per task</p>`;
}

function render(state) {
  const comparison = comparisons[state.compare];
  const [from, to] = comparison.arms;
  return `<div class="showcase-head"><p class="showcase-title">Skill improvement</p>
      <div class="view-toggle" role="group" aria-label="Evaluation">${Object.entries(views).map(([id, v]) => `<button data-view="${id}" aria-pressed="${state.view === id}" title="${v.detail}">${v.name}</button>`).join('')}</div>
      <div class="view-toggle" role="group" aria-label="Comparison">${Object.entries(comparisons).map(([id, c]) => `<button data-compare="${id}" aria-pressed="${state.compare === id}" title="${c.detail}">${c.name}</button>`).join('')}</div></div>
    <div class="gain-legend skill-legend"><span><i class="gain-dot base"></i>${escape(data.arms[from])}</span><span><i class="gain-dot ours"></i>${escape(data.arms[to])}</span>${state.view === 'length' ? '' : '<b>gain</b>'}</div>
    <div class="skill-body gain-chart">${state.view === 'length' ? lengthChart(comparison.arms) : dumbbells(state.view, comparison.arms)}</div>
    <p class="skill-note" aria-live="polite">${notes[`${state.view}:${state.compare}`]}</p>`;
}

export function initializeSkillImprovement() {
  document.querySelectorAll('[data-figure="skill-improvement"]').forEach(container => {
    const state = { view: container.dataset.view || 'single', compare: container.dataset.compare || 'practice' };
    const frame = document.createElement('div');
    frame.className = 'showcase-frame skill-frame';
    container.prepend(frame);
    // The lines draw from left to right; the dumbbells move from the first arm's value to the second's.
    const play = () => {
      if (state.view !== 'length') return playDumbbells(frame.querySelector('.skill-body'));
      frame.querySelectorAll('.length-line').forEach((line, i) => animate(line, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 1100, delay: i * 140, easing: 'ease-out' }));
      stagger(frame.querySelectorAll('.length-value, .length-name'), [{ opacity: 0 }, { opacity: 1 }], { delay: 900, gap: 40, duration: 300 });
    };
    let seen = false;
    const draw = focus => {
      frame.innerHTML = render(state);
      if (focus) frame.querySelector(focus)?.focus({ preventScroll: true });
      if (seen) play();
    };
    frame.addEventListener('click', event => {
      const button = event.target.closest('[data-view],[data-compare]');
      if (!button) return;
      if (button.dataset.view) state.view = button.dataset.view;
      if (button.dataset.compare) state.compare = button.dataset.compare;
      draw(button.dataset.view ? `[data-view="${state.view}"]` : `[data-compare="${state.compare}"]`);
    });
    draw();
    whenVisible(frame, () => { seen = true; play(); });
  });
}
