// MiniWebGen as an interactive figure: one generated trajectory per skill family, followed through the five stages of
// the paper's method figure with the records of its generation (data/datagen/runs in the MiniWeb repository): the
// guide, the sampled configuration, the instruction and its check, the coding LLM's script, and the gate.
import { escapeHtml as escape } from './structure-content.js';
import { autoplay, chip, mapCredit, screenshot, preload, stepControls, stepStrip } from './showcase-parts.js';
import { guideCard } from './primitive-catalog.js';
import { whenVisible } from './motion.js';

const math = {
  summarize: '<i>H<sub>m</sub></i> → <i>G<sub>m</sub></i>',
  sample: '(<i>w</i>, <i>c</i>, <i>z</i>, <i>s</i><sub>0</sub>)',
  suggest: '<i>g</i>, <i>κ</i>',
  execute: '<i>τ</i> = (<i>o<sub>t</sub></i>, <i>a<sub>t</sub></i>)',
  gate: '<i>κ</i>(<i>s</i><sub>0</sub>) = 0, <i>κ</i>(<i>s<sub>T</sub></i>) = 1',
};
const stages = [['summarize', 'Summarize'], ['sample', 'Sample'], ['suggest', 'Suggest'], ['execute', 'Execute'], ['gate', 'Gate']];
let catalog = null;                       // the guides (src/data/primitives.json), loaded when first needed
// The start state s0: the first screenshot, without the first action drawn on it.
const start = t => ({ ...t.steps[0], point: null, path: null });

function stageBar(current) {
  return `<ol class="gen-stages" aria-label="MiniWebGen stages">${stages.map(([id, name], i) => `<li><button data-stage="${i}" aria-pressed="${i === current}"><span class="gen-stage-number">${i + 1}</span><span class="gen-stage-name">${name}</span><span class="gen-stage-math">${math[id]}</span></button></li>`).join('<li class="gen-stage-arrow" aria-hidden="true">→</li>')}</ol>`;
}

function summarize(t) {
  const guide = catalog?.primitives.find(p => p.name === t.primitive)?.guide;
  return `<div class="gen-columns">
    <div class="gen-notes">
      <p class="gen-label">Input <i>H<sub>m</sub></i></p><p>The human demonstrations of ${chip(t.primitive, t.family)} on the training sites, each with the span of the primitive marked.</p>
      <p class="gen-label">Output <i>G<sub>m</sub></i></p><p>A site-agnostic guide: preconditions, steps, what to watch for, pitfalls, and when the primitive is done. It never names a site.</p>
      <p class="gen-muted">${guide ? escape(guide.note) : ''}</p>
    </div>
    <div>${catalog ? guideCard(guide) : '<p class="gen-muted">Loading the guide…</p>'}</div>
  </div>`;
}

function sample(t) {
  const p = t.pipeline;
  return `<div class="gen-columns">
    <dl class="gen-sample">
      <div style="--i:0"><dt><i>w</i></dt><dd>${escape(t.site)}<small>a training site, drawn evenly with the others</small></dd></div>
      <div style="--i:1"><dt><i>c</i></dt><dd>${escape(p.control)}<small>a control a crawler found for this primitive</small></dd></div>
      <div style="--i:2"><dt><i>z</i></dt><dd>${escape(p.argument)}<small>the argument it is set to</small></dd></div>
      <div style="--i:3"><dt><i>s</i><sub>0</sub></dt><dd>${escape(p.start)}<small>the start state</small></dd></div>
    </dl>
    <figure class="gen-shot">${screenshot(start(t), `Start page on ${t.site}`)}<figcaption><i>s</i><sub>0</sub>: the page the attempt starts from</figcaption></figure>
  </div>`;
}

function suggest(t) {
  const p = t.pipeline;
  return `<div class="gen-suggest">
    <p class="gen-label"><i>g</i> · instruction, phrased by an LLM</p>
    <p class="showcase-instruction">“${escape(t.instruction)}”</p>
    <p class="gen-label"><i>κ</i> · check, never written by the LLM</p>
    <p><code class="gen-check">${escape(p.check)}</code></p>
    <p class="gen-muted">${p.checkKind === 'request' ? 'The request this control sent when the crawler probed it with this argument: the attempt passes only if the site receives it.' : 'The change to the site’s data that two dry runs of this configuration agree on: the attempt passes only if the backend records it.'}</p>
  </div>`;
}

function execute(t, selected, playing) {
  const kept = t.pipeline.attempts.find(a => a.ok);
  const step = t.steps[selected];
  return `<div class="gen-execute">
    <div><p class="gen-label">Script by the coding LLM <span>given <i>g</i>, <i>G<sub>m</sub></i>, and the page; it acts only through mouse and keyboard events</span></p><pre class="gen-script"><code>${escape(kept?.script || '')}</code></pre></div>
    <div>
      <p class="gen-label">Recorded trajectory <i>τ</i></p>
      <div class="step-track">${stepStrip(t.steps, t.steps.map(s => s.final ? null : t.family), selected, 'Trajectory steps')}</div>
      ${screenshot(step, step.final ? 'Final page' : `Step ${selected + 1}: ${step.action}`)}
      <div class="gen-step-detail" aria-live="polite">${stepControls(selected, t.steps.length, 'Step', playing)}<span class="step-action">${step.final ? 'The final page' : escape(step.action)}</span></div>
      ${mapCredit([t.siteId])}
    </div>
  </div>`;
}

function gate(t, open) {
  const attempts = t.pipeline.attempts;
  return `<p class="gen-rule"><i>κ</i>(<i>s</i><sub>0</sub>) = 0 ∧ <i>κ</i>(<i>s<sub>T</sub></i>) = 1: an attempt is kept only if the check fails before it and passes after it, so no attempt passes without acting.</p>
    <div class="gen-columns gen-before-after">
      <figure class="gen-shot">${screenshot(start(t), 'Before the attempt')}<figcaption><b class="verdict bad">✗</b> before: <i>κ</i>(<i>s</i><sub>0</sub>) = 0</figcaption></figure>
      <figure class="gen-shot">${screenshot(t.steps.at(-1), 'After the attempt')}<figcaption><b class="verdict ok">✓</b> after: <i>κ</i>(<i>s<sub>T</sub></i>) = 1</figcaption></figure>
    </div>
    <p class="gen-label">${attempts.length === 1 ? 'The first attempt passed' : `${attempts.length} attempts; the gate rejected ${attempts.filter(a => !a.ok).length}`}</p>
    <ol class="gen-attempts">${attempts.map((a, i) => `<li class="${a.ok ? 'ok' : 'bad'}" style="--i:${i}"><button data-attempt="${i}" aria-expanded="${i === open}"><b class="verdict ${a.ok ? 'ok' : 'bad'}">${a.ok ? '✓' : '✗'}</b><span>Attempt ${i + 1}: ${a.ok ? 'kept' : 'rejected'}</span>${a.ok ? '' : `<small>${escape(a.error)}</small>`}</button>${i === open ? `<pre class="gen-script"><code>${escape(a.script)}</code></pre>` : ''}</li>`).join('')}</ol>`;
}

function render(examples, state) {
  const t = examples[state.example];
  const stage = stages[state.stage][0];
  const body = { summarize, sample, suggest, execute: x => execute(x, state.step, state.playing), gate: x => gate(x, state.attempt) }[stage](t);
  return `<div class="showcase-head"><p class="showcase-title">MiniWebGen</p>
      <div class="gen-examples" role="group" aria-label="Example trajectory">${examples.map((x, i) => `<button class="primitive-button fam-${x.family}" data-example="${i}" aria-pressed="${i === state.example}">${escape(x.primitive)}</button>`).join('')}</div>
      <span class="showcase-meta">${escape(t.site)} · training site</span></div>
    ${stageBar(state.stage)}
    <div class="gen-stage ${state.entering ? 'is-entering' : ''}" style="--dir:${state.dir}" aria-live="polite">${body}</div>
    <div class="gen-nav"><button data-stage-move="-1" ${state.stage === 0 ? 'disabled' : ''}>← ${state.stage > 0 ? stages[state.stage - 1][1] : ''}</button><button data-stage-move="1" ${state.stage === stages.length - 1 ? 'disabled' : ''}>${state.stage < stages.length - 1 ? stages[state.stage + 1][1] : ''} →</button></div>`;
}

export function initializeMiniWebGen(root, examples) {
  const state = { example: 0, stage: 0, step: 0, attempt: -1, playing: false, entering: false, dir: 1 };
  let stop = () => {};
  const halt = () => { stop(); state.playing = false; };
  const draw = focus => {
    root.innerHTML = render(examples, state);
    state.entering = false;                 // a stage slides in once, not again on every step within it
    if (stages[state.stage][0] === 'execute') preload(examples[state.example].steps, state.step);
    if (focus) root.querySelector(focus)?.focus({ preventScroll: true });
  };
  const loadGuides = () => {
    if (catalog) return;
    import('./data/primitives.json').then(data => {
      catalog = data.default;
      if (stages[state.stage][0] === 'summarize') draw();
    });
  };
  root.addEventListener('click', event => {
    const target = event.target.closest('[data-example],[data-stage],[data-stage-move],[data-step],[data-step-move],[data-attempt],[data-play]');
    if (!target) return;
    const d = target.dataset;
    const steps = examples[state.example].steps;
    if ('play' in d) {
      if (state.playing) { halt(); draw('[data-play]'); return; }
      if (state.step === steps.length - 1) state.step = 0;
      state.playing = true;
      draw('[data-play]');
      stop = autoplay(() => {
        state.step += 1;
        const more = state.step < steps.length - 1;
        if (!more) state.playing = false;
        draw();
        return more;
      }, 1500);
      return;
    }
    halt();
    const stage = state.stage;
    if (d.example) Object.assign(state, { example: Number(d.example), step: 0, attempt: -1, entering: true, dir: Number(d.example) >= state.example ? 1 : -1 });
    if (d.stage) state.stage = Number(d.stage);
    if (d.stageMove) state.stage = Math.min(stages.length - 1, Math.max(0, state.stage + Number(d.stageMove)));
    if (state.stage !== stage) Object.assign(state, { entering: true, dir: state.stage > stage ? 1 : -1 });
    if (d.step) state.step = Number(d.step);
    if (d.stepMove) state.step = Math.min(steps.length - 1, Math.max(0, state.step + Number(d.stepMove)));
    if (d.attempt) state.attempt = state.attempt === Number(d.attempt) ? -1 : Number(d.attempt);
    const key = Object.keys(d).find(k => ['example', 'stage', 'stageMove', 'step', 'stepMove', 'attempt'].includes(k));
    const attr = key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
    draw(`[data-${attr}="${d[key]}"]:not(:disabled)`);
  });
  root.addEventListener('keydown', event => {
    if (stages[state.stage][0] !== 'execute' || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    halt();
    const last = examples[state.example].steps.length - 1;
    state.step = Math.min(last, Math.max(0, state.step + (event.key === 'ArrowRight' ? 1 : -1)));
    event.preventDefault();
    draw(`[data-step="${state.step}"]`);
  });
  whenVisible(root, () => { state.entering = true; draw(); });         // the first stage slides in on arrival
  new IntersectionObserver((entries, observer) => {
    if (entries.some(e => e.isIntersecting)) { observer.disconnect(); loadGuides(); }
  }, { rootMargin: '600px 0px' }).observe(root);
  draw();
}
