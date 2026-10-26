// Agent trajectories: every episode behind the paper's results (the Hugging Face dataset
// sparklabuofu/MiniWeb-trajectories, built by the paper repo's docs/figures/trajectories/build_trajectories.py), read
// straight from the Hub. Pick a benchmark, an agent and a seed, then step through an episode: its screens, actions,
// the agent's reasoning, the planner's subtasks, and each primitive's verdict. #<run>/<episode> links to one episode.
import './style.css';
import './paper-page.css';
import './trajectories.css';
import { applyDesign, designFromQuery } from './design-theme.js';
import primitivesData from './data/primitives.json';

const DATA = (new URLSearchParams(location.search).get('data') || 'https://huggingface.co/datasets/sparklabuofu/MiniWeb-trajectories/resolve/main/').replace(/\/?$/, '/');
const DATASET_PAGE = 'https://huggingface.co/datasets/sparklabuofu/MiniWeb-trajectories';
const familyOf = Object.fromEntries(primitivesData.primitives.map(p => [p.name, p.family]));
const familyName = Object.fromEntries(primitivesData.families.map(f => [f.id, f.name]));

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
const pct = x => `${Number(x).toFixed(1)}%`;
const outcome = s => s == null ? 'not graded' : s >= 1 ? 'passed' : s <= 0 ? 'failed' : `score ${s.toFixed(2)}`;
const outcomeClass = s => s == null ? 'is-none' : s >= 1 ? 'is-pass' : s <= 0 ? 'is-fail' : 'is-partial';

const state = { index: null, bench: null, arm: null, seed: null, filter: 'all', query: '', run: null, episodes: [], episode: null, step: 0 };
const cache = new Map();

async function getJson(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(DATA + path).then(r => {
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return r.json();
    }).catch(e => { cache.delete(path); throw e; }));
  }
  return cache.get(path);
}

function shell() {
  $('trajectories').innerHTML = `
  <header class="tv-header">
    <a class="tv-brand" href="./"><img src="./favicon.svg" width="24" height="24" alt="" />miniweb.</a>
    <span class="tv-header-title">Agent trajectories</span>
    <nav aria-label="Links"><a href="./">Paper</a><a href="${DATASET_PAGE}" target="_blank" rel="noopener">Dataset ↗</a></nav>
  </header>
  <main class="tv-main">
    <section class="tv-intro">
      <h1>Agent trajectories</h1>
      <p id="tv-summary">Every agent episode behind the paper's results, step by step.</p>
    </section>
    <div class="tv-benches" role="tablist" aria-label="Benchmark" id="tv-benches"></div>
    <div class="tv-controls">
      <label class="tv-field"><span>Agent</span><select id="tv-arm"></select></label>
      <div class="tv-field" id="tv-seed-field"><span>Seed</span><div class="tv-seg" id="tv-seed" role="group" aria-label="Seed"></div></div>
      <div class="tv-field"><span>Outcome</span><div class="tv-seg" id="tv-filter" role="group" aria-label="Outcome">
        <button data-filter="all" aria-pressed="true">All</button><button data-filter="pass" aria-pressed="false">Passed</button><button data-filter="fail" aria-pressed="false">Failed</button>
      </div></div>
      <label class="tv-field tv-search"><span>Search</span><input id="tv-query" type="search" placeholder="Task, site or id" autocomplete="off" /></label>
      <p class="tv-run-stats" id="tv-run-stats" aria-live="polite"></p>
    </div>
    <div class="tv-body">
      <aside class="tv-list" aria-label="Episodes"><ol id="tv-episodes"></ol></aside>
      <article class="tv-episode" id="tv-episode" aria-live="polite"><p class="tv-empty">Choose an episode.</p></article>
    </div>
  </main>`;
  $('tv-arm').addEventListener('change', e => { state.arm = e.target.value; state.seed = null; chooseRun(); });
  $('tv-filter').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    state.filter = b.dataset.filter;
    $('tv-filter').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    renderList();
  });
  $('tv-query').addEventListener('input', e => { state.query = e.target.value.trim().toLowerCase(); renderList(); });
  document.addEventListener('keydown', e => {
    if (!state.episode || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    if (e.key === 'ArrowRight') { go(state.step + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { go(state.step - 1); e.preventDefault(); }
  });
}

const runsOf = bench => state.index.runs.filter(r => r.bench === bench);

function renderBenches() {
  const total = state.index.runs.reduce((n, r) => n + r.episodes, 0);
  $('tv-summary').innerHTML = `Every agent episode behind the paper's results: <strong>${total.toLocaleString()}</strong> episodes in ${state.index.runs.length} runs, on MiniWeb and three external benchmarks. Pick a benchmark and an agent, then step through an episode with ← and →. Where the planner's harness kept no screenshot, screens marked <span class="tv-redrawn-tag">redrawn</span> were rebuilt on MiniWeb's sites, from the page the recorder saved or, for single primitives, from the step's address.`;
  $('tv-benches').innerHTML = state.index.benchmarks.filter(b => runsOf(b.key).length).map(b => {
    const n = runsOf(b.key).reduce((s, r) => s + r.episodes, 0);
    return `<button role="tab" data-bench="${b.key}" aria-selected="${b.key === state.bench}"><span class="tv-bench-title">${escape(b.title)}</span><span class="tv-bench-meta">${escape(b.paper)} · ${n.toLocaleString()} episodes</span></button>`;
  }).join('');
  $('tv-benches').onclick = e => {
    const b = e.target.closest('button[data-bench]'); if (!b) return;
    state.bench = b.dataset.bench; state.arm = null; state.seed = null;
    renderBenches(); chooseRun();
  };
}

function chooseRun(episodeId) {
  const runs = runsOf(state.bench);
  const arms = [...new Map(runs.map(r => [r.arm, r.arm_title])).entries()];
  if (!arms.some(([a]) => a === state.arm)) state.arm = arms[0][0];
  $('tv-arm').innerHTML = arms.map(([a, t]) => `<option value="${a}" ${a === state.arm ? 'selected' : ''}>${escape(t)}</option>`).join('');
  const seeds = runs.filter(r => r.arm === state.arm);
  if (!seeds.some(r => r.seed === state.seed)) state.seed = seeds[0].seed;
  $('tv-seed-field').hidden = seeds.length < 2;
  $('tv-seed').innerHTML = seeds.map(r => `<button data-seed="${r.seed}" aria-pressed="${r.seed === state.seed}">${r.seed}</button>`).join('');
  $('tv-seed').onclick = e => { const b = e.target.closest('button'); if (!b) return; state.seed = Number(b.dataset.seed); chooseRun(); };
  state.run = seeds.find(r => r.seed === state.seed);
  const r = state.run;
  $('tv-run-stats').innerHTML = `<strong>${pct(r.success)}</strong> success over ${r.episodes} episodes${r.redrawn ? ` · ${r.redrawn.toLocaleString()} screens redrawn` : ''}${!r.screens ? ' · this harness kept no screens' : ''}`;
  loadRun(episodeId);
}

async function loadRun(episodeId) {
  const run = state.run;
  $('tv-episodes').innerHTML = '<li class="tv-loading">Loading episodes…</li>';
  try {
    const data = await getJson(`runs/${run.id}/index.json`);
    if (state.run !== run) return;
    state.episodes = data.episodes;
    renderList();
    const first = episodeId && state.episodes.find(e => e.id === episodeId) || state.episodes[0];
    if (first) openEpisode(first.id);
  } catch (e) {
    $('tv-episodes').innerHTML = `<li class="tv-error">Could not load this run (${escape(e.message)}). <button class="tv-retry" id="tv-retry-run">Try again</button></li>`;
    $('tv-retry-run').onclick = () => loadRun(episodeId);
  }
}

function visibleEpisodes() {
  return state.episodes.filter(e => (state.filter === 'all' || (state.filter === 'pass' ? e.success >= 1 : !(e.success >= 1)))
    && (!state.query || `${e.instruction} ${e.task_id} ${e.site || ''} ${e.macro || ''}`.toLowerCase().includes(state.query)));
}

function renderList() {
  const eps = visibleEpisodes();
  $('tv-episodes').innerHTML = eps.length ? eps.map(e => `<li><button class="tv-ep ${state.episode?.id === e.id ? 'is-open' : ''}" data-ep="${escape(e.id)}">
      <span class="tv-dot ${outcomeClass(e.success)}" title="${outcome(e.success)}"></span>
      <span class="tv-ep-text"><span class="tv-ep-instr">${escape(e.instruction || e.task_id)}</span>
      <span class="tv-ep-meta">${escape(e.site || e.task_id)} · ${e.steps} step${e.steps === 1 ? '' : 's'}${e.missing ? ' · no trajectory' : ''}</span></span></button></li>`).join('')
    : '<li class="tv-loading">No episodes match.</li>';
  $('tv-episodes').onclick = ev => { const b = ev.target.closest('button[data-ep]'); if (b) openEpisode(b.dataset.ep); };
}

async function openEpisode(id) {
  const run = state.run;
  history.replaceState(null, '', `#${run.id}/${id}`);
  state.episode = { id };
  document.querySelectorAll('.tv-ep').forEach(b => b.classList.toggle('is-open', b.dataset.ep === id));
  $('tv-episode').innerHTML = '<p class="tv-loading">Loading the episode…</p>';
  try {
    const ep = await getJson(`runs/${run.id}/${encodeURIComponent(id)}.json`);
    if (state.run !== run || state.episode?.id !== id) return;
    state.episode = ep; state.step = 0;
    renderEpisode();
  } catch (e) {
    $('tv-episode').innerHTML = `<p class="tv-error">Could not load this episode (${escape(e.message)}). <button class="tv-retry" id="tv-retry-ep">Try again</button></p>`;
    $('tv-retry-ep').onclick = () => openEpisode(id);
  }
}

const famOf = p => familyOf[p.macro || p.name] || familyOf[(p.name || '').replace(/#\d+$/, '')];

/** Tab. 2's episodes: the VLM judge's whole verdict, open: the task, then every primitive with its votes, reason, and
 *  the request the agent made against the one the task expects. */
function judgeBlock(ep) {
  const v = ep.verdict || {};
  const agree = v.judge === v.verifier;
  const prims = (ep.primitives || []).map(p => {
    const fam = famOf(p);
    const row = (label, value, mono = true) => value && value !== 'none'
      ? `<div class="tv-jrow"><dt>${label}</dt><dd class="${mono ? 'tv-mono' : ''}">${escape(value)}</dd></div>` : '';
    return `<li class="tv-prim tv-jprim ${p.passed ? 'is-pass' : 'is-fail'}" style="--family:var(--fam-${fam || 'reason'})">
      <div class="tv-jhead"><span class="tv-prim-name">${escape(p.name)}</span>${fam ? `<span class="tv-fam">${escape(familyName[fam])}</span>` : ''}
        <span class="tv-prim-verdict">${p.passed ? 'pass' : 'fail'}${p.votes ? ` · ${escape(p.votes)} votes` : ''}${p.required === false ? ' · optional' : ''}</span></div>
      ${p.why ? `<p class="tv-prim-why">${escape(p.why)}</p>` : ''}
      <dl class="tv-jdl">${row('Agent’s request', p.agent_target)}${row('Expected', p.reference_target)}${row('Other requests', p.extra_targets)}${p.screens_seen ? row('Screens seen', String(p.screens_seen), false) : ''}</dl>
    </li>`;
  }).join('');
  return `<section class="tv-judge" aria-label="VLM judge">
    <h3 class="tv-h3">VLM judge (Gemini 3.5 Flash)</h3>
    <p class="tv-jtask"><span class="tv-badge ${v.judge ? 'is-pass' : 'is-fail'}">task ${v.judge ? 'passed' : 'failed'}</span>
      <span>the task passes only if every required primitive passes</span>
      <span class="tv-jver ${agree ? '' : 'is-split'}">programmatic verifier: ${v.verifier ? 'pass' : 'fail'}${agree ? '' : ' (disagrees)'}</span></p>
    ${prims ? `<ul class="tv-prims">${prims}</ul>` : ''}
  </section>`;
}

function verdictBlock(ep) {
  if (ep.graded_by === 'VLM judge') return judgeBlock(ep);
  const v = ep.verdict || {};
  const text = typeof v.judge === 'string' ? v.judge : v.detail || '';
  const flags = typeof v.judge === 'boolean' ? `VLM judge: ${v.judge ? 'pass' : 'fail'} · verifier: ${v.verifier ? 'pass' : 'fail'}` : '';
  const prims = (ep.primitives || []).map(p => {
    const fam = familyOf[p.macro || p.name] || familyOf[(p.name || '').replace(/#\d+$/, '')];
    return `<li class="tv-prim ${p.passed ? 'is-pass' : 'is-fail'}" style="--family:var(--fam-${fam || 'reason'})" title="${escape(familyName[fam] || '')}">
      <span class="tv-prim-name">${escape(p.name)}</span><span class="tv-prim-verdict">${p.passed ? 'pass' : 'fail'}${p.required === false ? ' · optional' : ''}</span>
      ${p.why ? `<span class="tv-prim-why">${escape(p.why)}</span>` : ''}</li>`;
  }).join('');
  return `${prims ? `<h3 class="tv-h3">Primitives</h3><ul class="tv-prims">${prims}</ul>` : ''}
    ${text || flags ? `<details class="tv-verdict"><summary>Grader's verdict <span>${escape(ep.graded_by || '')}${flags ? ` · ${flags}` : ''}</span></summary>${text ? `<p>${escape(text)}</p>` : ''}${v.answer ? `<p><strong>Agent's answer:</strong> ${escape(v.answer)}</p>` : ''}</details>` : ''}`;
}

function renderEpisode() {
  const ep = state.episode;
  const n = ep.steps.length;
  const plan = ep.plan ? `<h3 class="tv-h3">Planner's subtasks</h3><ol class="tv-plan">${ep.plan.map((s, i) => `<li data-sub="${i}"><button data-sub="${i}"><span class="tv-plan-fam">${escape(s.family || s.model || '')}</span>${escape(s.subtask)}<span class="tv-plan-meta">${s.steps ?? ''} steps${s.done ? '' : ' · not done'}</span></button></li>`).join('')}</ol>` : '';
  $('tv-episode').innerHTML = `
    <header class="tv-ep-head">
      <p class="tv-eyebrow">${escape(state.run.arm_title)}${state.run.seed > 1 || runsOf(state.bench).filter(r => r.arm === state.run.arm).length > 1 ? ` · seed ${state.run.seed}` : ''} · <span class="tv-mono">${escape(ep.task_id)}</span></p>
      <h2>${escape(ep.instruction || ep.task_id)}</h2>
      <p class="tv-ep-outcome"><span class="tv-badge ${outcomeClass(ep.success)}">${outcome(ep.success)}</span>${ep.site ? `<span>${escape(ep.site)}</span>` : ''}<span>${n} step${n === 1 ? '' : 's'}</span>${ep.missing ? '<span>no trajectory was saved</span>' : ''}</p>
      ${ep.answer ? `<p class="tv-answer"><strong>Final answer:</strong> ${escape(ep.answer)}</p>` : ''}
    </header>
    ${verdictBlock(ep)}
    ${plan}
    ${n ? `<section class="tv-player" aria-label="Steps">
      <div class="tv-player-bar">
        <button class="tv-nav" id="tv-prev" aria-label="Previous step">←</button>
        <input type="range" id="tv-scrub" min="0" max="${n - 1}" value="0" aria-label="Step" />
        <button class="tv-nav" id="tv-next" aria-label="Next step">→</button>
        <span class="tv-step-count" id="tv-count"></span>
      </div>
      <figure class="tv-frame"><img id="tv-shot" alt="" /><figcaption id="tv-shot-note"></figcaption></figure>
      <div class="tv-step" id="tv-step"></div>
    </section>` : ''}
    ${ep.final_image != null ? `<details class="tv-final"><summary>Final screen</summary><img src="${ep.images[ep.final_image]}" alt="The page after the last step" /></details>` : ''}`;
  if (!n) return;
  $('tv-prev').onclick = () => go(state.step - 1);
  $('tv-next').onclick = () => go(state.step + 1);
  $('tv-scrub').oninput = e => go(Number(e.target.value));
  $('tv-episode').querySelectorAll('.tv-plan button').forEach(b => b.onclick = () => {
    const i = ep.steps.findIndex(s => s.subtask === Number(b.dataset.sub));
    if (i >= 0) go(i);
  });
  go(0);
}

function go(i) {
  const ep = state.episode;
  if (!ep?.steps?.length) return;
  state.step = Math.max(0, Math.min(ep.steps.length - 1, i));
  const s = ep.steps[state.step];
  $('tv-scrub').value = state.step;
  $('tv-count').textContent = `Step ${state.step + 1} of ${ep.steps.length}`;
  $('tv-prev').disabled = state.step === 0;
  $('tv-next').disabled = state.step === ep.steps.length - 1;
  const img = $('tv-shot');
  if (s.image != null) { img.src = ep.images[s.image]; img.alt = `Screen at step ${state.step + 1}`; img.hidden = false; }
  else { img.removeAttribute('src'); img.hidden = true; }
  $('tv-shot-note').innerHTML = s.withheld ? 'Screen withheld: the page showed the network address of the machine that ran the agent.'
    : s.image == null ? 'No screen was kept for this step.'
    : s.redrawn === 'url' ? '<span class="tv-redrawn-tag">redrawn</span> by visiting this step’s address: typed text and in-page state are not shown'
    : s.redrawn ? '<span class="tv-redrawn-tag">redrawn</span> from the page saved before this step' : '';
  const r = s.reasoning || {};
  const reason = [['thinking', 'Thinking'], ['evaluation', 'Previous goal'], ['memory', 'Memory'], ['next', 'Next goal'], ['thought', 'Thought']]
    .filter(([k]) => r[k]).map(([k, label]) => `<p><span class="tv-label">${label}</span>${escape(r[k])}</p>`).join('');
  $('tv-step').innerHTML = `
    ${s.subtask != null && ep.plan ? `<p class="tv-sub">Subtask ${s.subtask + 1}: ${escape(ep.plan[s.subtask]?.subtask || '')}</p>` : ''}
    ${s.url ? `<p class="tv-url tv-mono">${escape(s.url)}</p>` : ''}
    <p class="tv-action tv-mono">${escape(s.action)}</p>
    ${s.result ? `<p class="tv-result">${escape(s.result)}</p>` : ''}
    ${s.error ? `<p class="tv-err">${escape(s.error)}</p>` : ''}
    ${reason ? `<div class="tv-reason">${reason}</div>` : ''}`;
  $('tv-episode').querySelectorAll('.tv-plan li').forEach(li => li.classList.toggle('is-current', Number(li.dataset.sub) === s.subtask));
}

async function start() {
  shell();
  applyDesign(document, designFromQuery(location.search));
  try {
    state.index = await getJson('index.json');
  } catch (e) {
    $('tv-episodes').innerHTML = `<li class="tv-error">Could not reach the trajectories on Hugging Face (${escape(e.message)}). <button class="tv-retry" onclick="location.reload()">Try again</button></li>`;
    return;
  }
  route();
  window.addEventListener('hashchange', route);   // a pasted link, or back and forward, opens its episode
}

/** #<run>/<episode> -> that run and episode (a run alone opens its first episode; nothing opens the first run). */
function route() {
  const hash = decodeURIComponent(location.hash.slice(1));
  const run = hash && [...state.index.runs].sort((a, b) => b.id.length - a.id.length).find(r => hash === r.id || hash.startsWith(r.id + '/'));
  const episode = run && hash.length > run.id.length ? hash.slice(run.id.length + 1) : undefined;
  if (run && run === state.run && episode && state.episode?.id === episode) return;   // (our own replaceState)
  state.bench = run ? run.bench : state.bench || state.index.benchmarks.find(b => runsOf(b.key).length).key;
  if (run) { state.arm = run.arm; state.seed = run.seed; }
  renderBenches();
  if (run === state.run && episode) openEpisode(episode);
  else chooseRun(episode);
}

start();
