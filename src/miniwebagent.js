// MiniWebAgent as an interactive figure: replay a held-out trace turn by turn (the planner's memory and decision, the
// executor's steps and report), or compare it with the same model and adapter acting alone on the same task.
import { escapeHtml as escape } from './structure-content.js';
import { chip, pager, screenshot, preload, stepControls } from './showcase-parts.js';
import { whenVisible } from './motion.js';

const verdictMark = ok => ok ? '<b class="verdict ok" aria-label="passed">✓</b>' : '<b class="verdict bad" aria-label="failed">✗</b>';
const label = p => p.op ? `${p.name} · ${p.op}` : p.name;
const playIcon = playing => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${playing ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>' : '<path d="M7 5v14l12-7z"/>'}</svg>`;

function verdicts(trace, outcome, title = 'Verifier, per primitive') {
  return `<div class="agent-verdicts"><p class="showcase-title">${title}</p>
    <ul>${trace.primitives.map((p, i) => `<li style="--i:${i}">${verdictMark(outcome.verdicts[p.name])}${chip(label(p), p.family)}</li>`).join('')}</ul>
    <p class="agent-outcome ${outcome.ok ? 'ok' : 'bad'}">${outcome.ok ? 'Task succeeds' : 'Task fails'}</p></div>`;
}

/** The delegations as a bar, one segment per planner turn, as wide as the executor's steps (cf. the method figure). */
function turnBar(trace, current, playing) {
  let k = 0;
  return `<div class="turn-bar" role="group" aria-label="Planner turns">${trace.turns.map((t, i) => {
    const steps = t.action === 'delegate' ? Math.max(1, trace.delegations[k++]?.steps.length || 1) : 1;
    const name = t.action === 'delegate' ? t.family : 'done';
    return `<button class="turn-segment ${t.action === 'delegate' ? `fam-${t.family}` : 'is-done'} ${i === current ? 'is-current' : ''}" style="flex-grow:${steps}" data-turn="${i}" aria-pressed="${i === current}" aria-label="Turn ${i + 1}: ${name}">${name}${i === current && playing ? '<i class="turn-progress" aria-hidden="true"></i>' : ''}</button>`;
  }).join('')}</div>`;
}

function replay(trace, state) {
  const turn = trace.turns[state.turn];
  const k = trace.turns.slice(0, state.turn).filter(t => t.action === 'delegate').length;
  const delegation = turn.action === 'delegate' ? trace.delegations[k] : null;
  const last = state.turn === trace.turns.length - 1;
  return `${turnBar(trace, state.turn, state.playing)}
    <div class="agent-trace ${state.entering ? 'is-entering' : ''}">
      <div class="turn-panel" aria-live="polite">
        <div class="turn-controls">${stepControls(state.turn, trace.turns.length, 'Turn')}<button class="play-button" data-play aria-pressed="${state.playing}" aria-label="${state.playing ? 'Pause' : 'Play'} the replay">${playIcon(state.playing)}${state.playing ? 'Pause' : 'Play'}</button></div>
        <div class="turn-box planner"><p class="turn-role">Planner <span><i>π</i><sub>0</sub>, untrained · sees the page, cannot act</span></p>
          <p class="turn-memory">${escape(turn.memory)}</p>
          ${delegation ? `<p class="turn-decision"><code class="family-tag fam-${turn.family}">${turn.family}</code><span>${escape(turn.instruction)}</span></p>` : `<p class="turn-decision"><code class="family-tag done">done</code><span>${escape(trace.answer)}</span></p>`}
        </div>
        ${delegation ? `<div class="turn-arrow" aria-hidden="true">↓</div>
        <div class="turn-box executor"><p class="turn-role">Executor <span><i>π</i><sub>pool</sub>, the same model with the trained adapter · at most 15 actions</span></p>
          <ol class="executor-steps">${(delegation.steps.length ? delegation.steps : [turn.family === 'reason' ? 'Reads the page and reports.' : 'No step recorded.']).map((s, i) => `<li style="--i:${i}">${escape(s)}</li>`).join('')}</ol>
          ${turn.report ? `<p class="turn-report" style="--n:${Math.max(1, delegation.steps.length)}"><span>Reports back</span>${escape(turn.report)}</p>` : ''}
        </div>` : ''}
      </div>
      <div>${last ? verdicts(trace, trace) : `<div class="agent-verdicts pending"><p class="showcase-title">Verifier, per primitive</p><p class="gen-muted">Graded after the planner answers (turn ${trace.turns.length}).</p></div>`}
        ${trace.expected && last ? `<p class="step-answer"><span>Expected answer</span>${escape(trace.expected)}</p>` : ''}</div>
    </div>`;
}

function compare(trace, state) {
  const single = trace.single;
  const step = single.steps[state.step];
  return `<p class="compare-note">The same task, with the same Qwen3.5-4B and the same trained adapter. On the left it acts alone; on the right the planner hands it one skill at a time.</p>
    <div class="compare ${state.entering ? 'is-entering' : ''}">
      <div class="compare-side">
        <p class="showcase-title">Single agent <span>trained on our data, acting alone</span></p>
        ${screenshot(step, `Single agent, step ${state.step + 1}: ${step.action}`)}
        <div class="gen-step-detail">${stepControls(state.step, single.steps.length)}<span class="step-action">${escape(step.action)}</span></div>
        ${step.memory ? `<p class="turn-memory">${escape(step.memory)}</p>` : ''}
        <ol class="compare-steps">${single.steps.map((s, i) => `<li><button data-step="${i}" aria-pressed="${i === state.step}">${escape(s.action)}</button></li>`).join('')}</ol>
        ${verdicts(trace, single)}
      </div>
      <div class="compare-side">
        <p class="showcase-title">MiniWebAgent <span>planner + the same executor</span></p>
        <ol class="delegations">${trace.delegations.map((d, i) => `<li><span class="delegation-number">${i + 1}</span><code class="family-tag fam-${d.family}">${d.family}</code><span class="delegation-text">${escape(d.instruction)}</span></li>`).join('')}</ol>
        <p class="agent-done"><code class="family-tag done">done</code><span>${escape(trace.answer)}</span></p>
        ${verdicts(trace, trace)}
        ${trace.expected ? `<p class="step-answer"><span>Expected answer</span>${escape(trace.expected)}</p>` : ''}
      </div>
    </div>`;
}

function render(traces, state) {
  const trace = traces[state.trace];
  return `<div class="showcase-head"><p class="showcase-title">MiniWebAgent</p>${pager('Task', state.trace, traces.length)}
      <div class="view-toggle" role="group" aria-label="View">${[['replay', 'Replay'], ['compare', 'Compare with the single agent']].map(([id, name]) => `<button data-mode="${id}" aria-pressed="${state.mode === id}" ${id === 'compare' && !trace.single ? 'disabled' : ''}>${name}</button>`).join('')}</div>
      <span class="showcase-meta">${trace.sites.map(escape).join(' → ')} · held-out site · one run</span></div>
    <p class="showcase-instruction">“${escape(trace.instruction)}”</p>
    ${state.mode === 'replay' ? replay(trace, state) : compare(trace, state)}`;
}

export function initializeMiniWebAgent(root, traces) {
  const state = { trace: 0, mode: 'replay', turn: 0, step: 0, playing: false, entering: false };
  let timer;
  const stop = () => { clearInterval(timer); state.playing = false; };
  const draw = focus => {
    root.innerHTML = render(traces, state);
    state.entering = false;                 // a turn plays out once, when it arrives
    if (state.mode === 'compare') {
      preload(traces[state.trace].single.steps, state.step);
      const list = root.querySelector('.compare-steps');
      const item = list?.querySelector('[aria-pressed="true"]');
      if (item) list.scrollTop = item.offsetTop - list.offsetTop - list.clientHeight / 2;   // keep the step in view
    }
    if (focus) root.querySelector(focus)?.focus({ preventScroll: true });
  };
  const play = () => {
    const turns = traces[state.trace].turns.length;
    if (state.turn === turns - 1) state.turn = 0;
    state.playing = true;
    draw('[data-play]');
    timer = setInterval(() => {
      state.turn += 1;
      state.entering = true;
      if (state.turn >= turns - 1) { state.turn = turns - 1; stop(); }
      draw();
    }, 2600);
  };
  root.addEventListener('click', event => {
    const target = event.target.closest('[data-move],[data-mode],[data-turn],[data-step],[data-step-move],[data-play]');
    if (!target) return;
    const d = target.dataset;
    if ('play' in d) { if (state.playing) { stop(); draw('[data-play]'); } else play(); return; }
    stop();
    const trace = traces[state.trace];
    state.entering = Boolean(d.move || d.mode || d.turn || (d.stepMove && state.mode === 'replay'));
    if (d.move) Object.assign(state, { trace: state.trace + Number(d.move), turn: 0, step: 0, mode: traces[state.trace + Number(d.move)].single ? state.mode : 'replay' });
    if (d.mode) state.mode = d.mode;
    if (d.turn) state.turn = Number(d.turn);
    if (d.step) state.step = Number(d.step);
    if (d.stepMove) {
      const count = state.mode === 'replay' ? trace.turns.length : trace.single.steps.length;
      const next = Math.min(count - 1, Math.max(0, (state.mode === 'replay' ? state.turn : state.step) + Number(d.stepMove)));
      if (state.mode === 'replay') state.turn = next; else state.step = next;
    }
    const key = Object.keys(d)[0];
    draw(`[data-${key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}="${d[key]}"]:not(:disabled)`);
  });
  draw();
  whenVisible(root, () => { state.entering = true; draw(); });     // the first turn plays out on arrival
}
