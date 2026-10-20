// The 369 human tasks: a grid of how many primitives a task chains against whether it stays on one site, the filters
// beside it, the matching tasks, and a viewer that steps through the chosen task's demonstration. Drawn like the paper's
// construction figure: primitive spans as colored bars over numbered steps. The index (src/data/task-index.json) loads
// when the explorer comes near the screen; a task's steps (public/tasks/<id>.json) load when it is chosen. About three
// tasks per cell carry their screenshots; the others point to the dataset for theirs.
import { paper, escapeHtml as escape } from './structure-content.js';
import { autoplay, chip, mapCredit, stepStrip, screenshot, preload, stepControls } from './showcase-parts.js';

const base = import.meta.env.BASE_URL;
const lengths = [1, 2, 3, 4, 5, 6];                          // primitives per task; the last column is 6 or more
const families = [['drag', 'Drag & gesture'], ['select', 'Selection'], ['text', 'Text entry'], ['form', 'Forms'],
  ['nav', 'Navigation'], ['io', 'Out-of-page I/O'], ['reason', 'Reasoning']];
const statuses = {
  valid: ['ok', 'Demonstration passes its verifier'],
  stale: ['stale', 'Recorded before a later change to its site, data, or task'],
  verifier_rejected: ['bad', 'Demonstration fails the task’s current verifier'],
};
const splits = { train: 'training site', test: 'held-out site', excluded: 'crosses the site split' };
const inPaper = { 'map-services_345e3d': 'Fig. 1', 'url-shorteners-qr_74e00a': 'Fig. 2', 'url-shorteners-qr_1a792b': 'Fig. 4' };
const first = 'map-services_345e3d';
const lengthOf = t => Math.min(t.primitives.length, 6);
const multiOf = t => t.sites.length > 1;
const label = p => p.op ? `${p.name} · ${p.op}` : p.name;
const datasetLink = (split, text) => `<a href="${escape(paper.data)}/viewer/demonstrations/${split}" target="_blank" rel="noopener noreferrer">${text}</a>`;

/** Bars over the step strip, one per primitive span, stacked in lanes where spans overlap. */
function spanBars(primitives, count) {
  const lanes = [];
  const bars = primitives.filter(p => p.span && p.span[1] <= count).map(p => {
    const [b, e] = p.span;
    let lane = lanes.findIndex(end => end < b);
    if (lane < 0) { lane = lanes.length; lanes.push(0); }
    lanes[lane] = e;
    return `<span class="span-bar fam-${p.family}" style="grid-column:${b} / ${e + 1};grid-row:${lane + 1}" title="${escape(label(p))}: steps ${b}–${e}">${escape(label(p))}</span>`;
  });
  return `<div class="span-bars" style="--steps:${count}" aria-hidden="true">${bars.join('')}</div>`;
}

/** The primitive a step belongs to: the interaction's span first, then a reasoning span. */
function primitiveOf(primitives, step) {
  const inside = primitives.filter(p => p.span && p.span[0] <= step && step <= p.span[1]);
  return inside.find(p => p.family !== 'reason') || inside[0];
}

function matches(task, state, { cell = true } = {}) {
  if (cell && state.multi !== null && multiOf(task) !== state.multi) return false;
  if (cell && state.length !== null && lengthOf(task) !== state.length) return false;
  if (state.split !== 'all' && task.split !== state.split) return false;
  if (state.family && !task.primitives.some(p => p.family === state.family)) return false;
  if (state.valid && task.status !== 'valid') return false;
  if (state.shown && !task.shown) return false;
  if (state.query) {
    const text = `${task.instruction} ${task.sites.join(' ')} ${task.primitives.map(p => p.name).join(' ')}`.toLowerCase();
    if (!state.query.toLowerCase().split(/\s+/).every(word => text.includes(word))) return false;
  }
  return true;
}

function renderGrid(tasks, state) {
  const pool = tasks.filter(t => matches(t, state, { cell: false }));
  const count = (multi, length) => pool.filter(t => (multi === null || multiOf(t) === multi) && (length === null || lengthOf(t) === length)).length;
  const most = Math.max(1, ...[false, true].flatMap(m => lengths.map(n => count(m, n))));
  const on = (multi, length) => state.multi === multi && state.length === length;
  const cell = (multi, n) => {
    const c = count(multi, n);
    const shade = Math.round(8 + 62 * c / most);
    return `<td><button class="tx-cell ${on(multi, n) ? 'is-on' : ''} ${shade > 45 ? 'is-dark' : ''}" style="--shade:${c ? shade : 0}%" data-multi="${multi}" data-length="${n}" aria-pressed="${on(multi, n)}" aria-label="${multi ? 'Multi-site' : 'Single-site'} tasks with ${n === 6 ? '6 or more primitives' : `${n} primitive${n > 1 ? 's' : ''}`}: ${c}" ${c ? '' : 'disabled'}>${c || '·'}</button></td>`;
  };
  return `<div class="tx-grid-scroll"><table class="tx-grid">
    <caption>Primitives per task</caption>
    <thead><tr><th scope="col"><button class="tx-head ${on(null, null) ? 'is-on' : ''}" data-multi="null" data-length="null" aria-pressed="${on(null, null)}">All</button></th>${lengths.map(n => `<th scope="col"><button class="tx-head ${on(null, n) ? 'is-on' : ''}" data-multi="null" data-length="${n}" aria-pressed="${on(null, n)}">${n === 6 ? '6+' : n}</button></th>`).join('')}<th scope="col" class="tx-total">tasks</th></tr></thead>
    <tbody>${[false, true].map(multi => `<tr><th scope="row"><button class="tx-head ${on(multi, null) ? 'is-on' : ''}" data-multi="${multi}" data-length="null" aria-pressed="${on(multi, null)}">${multi ? 'Multi-site' : 'Single site'}</button></th>${lengths.map(n => cell(multi, n)).join('')}<td class="tx-total">${count(multi, null)}</td></tr>`).join('')}
      <tr class="tx-sum"><th scope="row">tasks</th>${lengths.map(n => `<td class="tx-total">${count(null, n)}</td>`).join('')}<td class="tx-total"><b>${pool.length}</b></td></tr></tbody>
  </table></div>`;
}

function renderFilters(tasks, state) {
  const n = key => tasks.filter(t => matches(t, { ...state, ...key }, { cell: false })).length;
  return `<div class="tx-filters">
    <label class="tx-search"><span class="sr-only">Search the tasks</span><input type="search" data-query placeholder="Search instructions, sites, primitives…" value="${escape(state.query)}" /></label>
    <div class="view-toggle" role="group" aria-label="Sites">${[['all', 'All sites'], ['train', 'Training'], ['test', 'Held-out']].map(([id, name]) => `<button data-split="${id}" aria-pressed="${state.split === id}">${name}</button>`).join('')}</div>
    <div class="tx-families" role="group" aria-label="Skill family">${families.map(([id, name]) => `<button class="tx-family fam-${id}" data-family="${id}" aria-pressed="${state.family === id}">${name}</button>`).join('')}</div>
    <label class="tx-check"><input type="checkbox" data-valid ${state.valid ? 'checked' : ''} /> Demonstration passes its verifier <small>${n({ valid: true })}</small></label>
    <label class="tx-check"><input type="checkbox" data-shown ${state.shown ? 'checked' : ''} /> Screenshots on this page <small>${n({ shown: true })}</small></label>
  </div>`;
}

function renderList(visible, state) {
  if (!visible.length) return '<p class="tx-empty">No task matches these filters.</p>';
  return `<ol class="tx-list" aria-label="Tasks">${visible.map(t => `<li><button data-task="${t.id}" aria-pressed="${t.id === state.selected}">
    <span class="tx-chain" aria-hidden="true">${t.primitives.map(p => `<i class="fam-${p.family}"></i>`).join('')}</span>
    <span class="tx-instruction">${escape(t.instruction)}</span>
    <small>${escape(t.sites.join(' → '))} · ${t.primitives.length} primitive${t.primitives.length > 1 ? 's' : ''}${t.shown ? ' · <span class="tx-shots">screenshots</span>' : ''}${inPaper[t.id] ? ` · ${inPaper[t.id]}` : ''}</small>
  </button></li>`).join('')}</ol>`;
}

function renderViewer(task, detail, state) {
  const [statusClass, statusText] = statuses[task.status] || ['', ''];
  const head = `<div class="tx-viewer-head"><p class="showcase-title">Task</p>${inPaper[task.id] ? `<span class="tx-badge">${inPaper[task.id]}</span>` : ''}
      <span class="showcase-meta">${task.sites.map(escape).join(' → ')} · ${splits[task.split]}</span></div>
    <p class="showcase-instruction">“${escape(task.instruction)}”</p>
    <div class="showcase-chain">${task.primitives.map(p => chip(label(p), p.family)).join('<span class="chain-arrow" aria-hidden="true">→</span>')}</div>
    <p class="tx-status ${statusClass}">${statusText}</p>`;
  if (!detail) return `${head}<p class="gen-muted">Loading the demonstration…</p>`;
  const steps = detail.steps;
  if (!steps.length) return `${head}<p class="gen-muted">No demonstration was recorded for this task.</p>`;
  const selected = Math.min(state.step, steps.length - 1);
  const step = steps[selected];
  const families = steps.map((_, i) => primitiveOf(detail.primitives, i + 1)?.family);
  const current = primitiveOf(detail.primitives, selected + 1);
  const dense = steps.length > 48;
  const picture = task.shown
    ? `<div class="tx-screen ${step.h > step.w * 0.9 ? 'is-tall' : ''}">${screenshot(step, `Step ${selected + 1}: ${step.action}`)}</div>`
    : `<div class="tx-no-shots"><p><b>${task.recorded ? `${task.recorded} screenshots` : 'The recording'} of this demonstration are in the dataset</b>, with the page’s HTML and accessibility tree at every step: ${datasetLink(task.split, 'demonstrations table')}, task <code>${escape(task.id)}</code>.</p>
        <ol class="tx-actions" start="${Math.max(0, selected - 3) + 1}">${steps.slice(Math.max(0, selected - 3), selected + 4).map((s, k) => { const i = Math.max(0, selected - 3) + k; return `<li class="${i === selected ? 'is-current' : ''}"><button data-step="${i}">${escape(s.action)}</button></li>`; }).join('')}</ol></div>`;
  return `${head}
    <div class="step-track ${dense ? 'is-dense' : ''}"><p class="showcase-title">Human demonstration <span>${steps.length} actions</span></p>${spanBars(detail.primitives, steps.length)}${stepStrip(steps, families, selected, 'Demonstration steps')}</div>
    <div class="tx-body">${picture}
      <div class="step-detail" aria-live="polite">
        ${stepControls(selected, steps.length, 'Step', state.playing)}
        <p class="step-action">${escape(step.action)}</p>
        ${current ? `<p class="step-primitive">${chip(label(current), current.family)} <span class="step-subtask">${escape(current.subtask)}</span></p>` : '<p class="step-subtask">Between primitives</p>'}
        ${detail.answer ? `<p class="step-answer"><span>Expected answer</span>${escape(detail.answer)}</p>` : ''}
        ${mapCredit(task.siteIds)}
      </div>
    </div>`;
}

export function initializeTaskExplorer() {
  const container = document.querySelector('[data-figure="tasks"]');
  if (!container) return;
  const frame = document.createElement('div');
  frame.className = 'showcase-frame task-explorer';
  frame.innerHTML = '<p class="showcase-title">Loading the 369 tasks…</p>';
  container.prepend(frame);
  const state = { multi: null, length: null, split: 'all', family: null, valid: false, shown: false, query: '', selected: first, step: 0, playing: false };
  const details = new Map();
  let tasks = [];
  let stop = () => {};
  const halt = () => { stop(); state.playing = false; };
  const visible = () => tasks.filter(t => matches(t, state));
  const task = () => tasks.find(t => t.id === state.selected);

  const load = id => {
    if (details.has(id)) return Promise.resolve(details.get(id));
    return fetch(`${base}tasks/${id}.json`).then(r => r.json()).then(d => { details.set(id, d); return d; });
  };
  const drawViewer = focus => {
    const viewer = frame.querySelector('.tx-viewer');
    const current = task();
    viewer.innerHTML = current ? renderViewer(current, details.get(current.id), state) : '';
    const steps = details.get(current?.id)?.steps;
    if (steps && current.shown) preload(steps, state.step);
    if (focus) viewer.querySelector(focus)?.focus({ preventScroll: true });
  };
  const select = (id, focus) => {
    halt();
    state.selected = id;
    state.step = 0;
    frame.querySelectorAll('[data-task]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.task === id)));
    drawViewer();
    load(id).then(() => { if (state.selected === id) drawViewer(focus); });
  };
  const keepInView = () => {
    const list = frame.querySelector('.tx-list');
    const item = list?.querySelector('[aria-pressed="true"]');
    if (item) list.scrollTop = Math.max(0, item.offsetTop - list.offsetTop - 8);
  };
  // A filter redraws the grid, the filters' counts and the list; the chosen task stays if it still matches.
  const drawSelection = focus => {
    frame.querySelector('.tx-grid-wrap').innerHTML = renderGrid(tasks, state);
    frame.querySelector('.tx-filter-wrap').innerHTML = renderFilters(tasks, state);
    const shown = visible();
    frame.querySelector('.tx-list-wrap').innerHTML = renderList(shown, state);
    frame.querySelector('.tx-count').textContent = `${shown.length} of ${tasks.length} tasks`;
    if (shown.length && !shown.some(t => t.id === state.selected)) select(shown[0].id);
    keepInView();
    if (focus) {
      const target = frame.querySelector(focus);
      target?.focus({ preventScroll: true });
      if (target?.matches('input[type=search]')) target.setSelectionRange(target.value.length, target.value.length);
    }
  };
  const play = () => {
    const steps = details.get(state.selected)?.steps || [];
    if (!steps.length) return;
    if (state.step >= steps.length - 1) state.step = 0;
    state.playing = true;
    drawViewer('[data-play]');
    stop = autoplay(() => {
      state.step += 1;
      const more = state.step < steps.length - 1;
      if (!more) state.playing = false;
      drawViewer();
      return more;
    }, 1400);
  };

  const start = async () => {
    tasks = (await import('./data/task-index.json')).default;
    frame.innerHTML = `<div class="showcase-head"><p class="showcase-title">The ${tasks.length} human tasks</p><span class="showcase-meta tx-count"></span></div>
      <div class="tx-top"><div class="tx-grid-wrap"></div><div class="tx-filter-wrap"></div></div>
      <div class="tx-main"><div class="tx-list-wrap"></div><div class="tx-viewer" tabindex="-1"></div></div>`;
    drawSelection();
    select(state.selected);
  };

  frame.addEventListener('click', event => {
    const target = event.target.closest('[data-multi],[data-split],[data-family],[data-task],[data-step],[data-step-move],[data-play]');
    if (!target) return;
    const d = target.dataset;
    if ('multi' in d) {
      const multi = d.multi === 'null' ? null : d.multi === 'true';
      const length = d.length === 'null' ? null : Number(d.length);
      const same = state.multi === multi && state.length === length;
      Object.assign(state, same ? { multi: null, length: null } : { multi, length });
      return drawSelection(`[data-multi="${d.multi}"][data-length="${d.length}"]`);
    }
    if (d.split) { state.split = d.split; return drawSelection(`[data-split="${d.split}"]`); }
    if (d.family) { state.family = state.family === d.family ? null : d.family; return drawSelection(`[data-family="${d.family}"]`); }
    if (d.task) return select(d.task);
    const steps = details.get(state.selected)?.steps || [];
    if ('play' in d) { if (state.playing) { halt(); drawViewer('[data-play]'); } else play(); return; }
    halt();
    if (d.step) { state.step = Number(d.step); return drawViewer(`[data-step="${state.step}"]`); }
    if (d.stepMove) {
      state.step = Math.min(steps.length - 1, Math.max(0, state.step + Number(d.stepMove)));
      drawViewer(`[data-step-move="${d.stepMove}"]:not(:disabled)`);
    }
  });
  frame.addEventListener('input', event => {
    if (event.target.matches('[data-query]')) { state.query = event.target.value.trim(); drawSelection('[data-query]'); }
  });
  frame.addEventListener('change', event => {
    if (event.target.matches('[data-valid]')) { state.valid = event.target.checked; drawSelection('[data-valid]'); }
    if (event.target.matches('[data-shown]')) { state.shown = event.target.checked; drawSelection('[data-shown]'); }
  });
  frame.addEventListener('keydown', event => {
    // In the list, the up and down arrows move through the tasks; in the viewer, left and right through the steps.
    if (event.target.closest('.tx-list') && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      const shown = visible();
      const i = shown.findIndex(t => t.id === state.selected) + (event.key === 'ArrowDown' ? 1 : -1);
      if (i < 0 || i >= shown.length) return;
      event.preventDefault();
      select(shown[i].id);
      keepInView();
      frame.querySelector(`[data-task="${shown[i].id}"]`)?.focus({ preventScroll: true });
    } else if (event.target.closest('.tx-viewer') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      const steps = details.get(state.selected)?.steps || [];
      if (!steps.length) return;
      halt();
      event.preventDefault();
      state.step = Math.min(steps.length - 1, Math.max(0, state.step + (event.key === 'ArrowRight' ? 1 : -1)));
      drawViewer(`[data-step="${state.step}"]`);
    }
  });
  new IntersectionObserver((entries, observer) => {
    if (entries.some(e => e.isIntersecting)) { observer.disconnect(); start(); }
  }, { rootMargin: '800px 0px' }).observe(container);
}
