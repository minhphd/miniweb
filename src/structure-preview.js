import './structure-preview.css';
import catalog from './data/sites.json';
import { directions, sections, paper, resultRows, evaluations, sampleSizes, cleanMix, storageKey, escapeHtml as esc } from './structure-content.js';

const query = new URLSearchParams(location.search);
const active = directions.some(d => d.id === query.get('direction')) || query.get('direction') === 'mix' ? query.get('direction') : 'paper';
const direction = directions.find(d => d.id === active);
const ids = active === 'mix' ? cleanMix(query.get('sections')?.split(',')) : direction.sections;
const studio = query.get('studio') === '1' && window.parent !== window;
let savedMix = [];
try { savedMix = cleanMix(JSON.parse(localStorage.getItem(storageKey) || '{}')?.mix); } catch { /* Optional preferences. */ }
document.body.classList.toggle('in-studio', studio);
document.body.classList.toggle('show-notes', query.get('notes') !== '0');
document.body.dataset.direction = active;
const base = import.meta.env.BASE_URL;
const thumbnail = site => `${base}previews/thumbnails/${site.id}.webp`;
const external = (url, text, cls = '') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
const jump = id => ids.includes(id) ? `#${id}` : './';
const authors = () => `<div class="authors">${paper.authors}</div><p class="affiliations">${paper.affiliations}</p>`;
const links = () => `<div class="resource-pills">${external(paper.overleaf, 'Paper draft ↗', 'pill primary')}${external(paper.code, 'Code ↗', 'pill')}${external(paper.data, 'Dataset ↗', 'pill')}<a class="pill" href="${jump('world')}">Explore MiniWeb ↓</a></div>`;
const stats = () => `<dl class="stat-strip"><div><dt>65</dt><dd>synthetic websites</dd></div><div><dt>37</dt><dd>interaction primitives</dd></div><div><dt>376</dt><dd>human-authored tasks</dd></div><div><dt>3.1K</dt><dd>verified trajectories</dd></div></dl>`;
const title = (kicker, heading, description = '') => `<div class="section-heading"><p class="kicker">${kicker}</p><h2>${heading}</h2>${description ? `<p class="section-lead">${description}</p>` : ''}</div>`;
const featured = ['e-commerce', 'email', 'spreadsheets-slides', 'flights-hotels', 'map-services', 'calendar-todo'].map(id => catalog.find(s => s.id === id));
function mosaic() {
  return `<div class="world-mosaic" aria-label="Six actual MiniWeb website interfaces">${featured.map((s, i) => `<a href="./#site=${s.id}" target="_blank" rel="noopener" class="mosaic-window window-${i}"><div><span>● ● ●</span><span>${esc(s.domain)}</span></div><img src="${thumbnail(s)}" alt="${esc(s.shortName || s.name)} interface" width="550" height="350" /><span class="window-name">${esc(s.shortName || s.name)} ↗</span></a>`).join('')}<div class="mosaic-center"><img src="./favicon.svg" width="40" height="40" alt="" /><span>miniweb.</span><small>ONE CONNECTED WORLD</small></div></div>`;
}
const renderers = {
  'hero-paper': () => `<div class="hero-paper"><p class="kicker">MINIWEB · WEB AGENT RESEARCH</p><h1>Back to Basics:<br /><span>Drills Before Games<br class="wide-break" /> for Web Agents</span></h1>${authors()}${links()}<p class="hero-takeaway">Practice reusable skills.<br class="mobile-only" /> Then compose them.</p><div class="paper-teaser"><div><span>01 / DIAGNOSE</span><strong>Which skill failed?</strong><p>A verdict for each primitive.</p></div><b aria-hidden="true">→</b><div><span>02 / PRACTICE</span><strong>Train the building blocks.</strong><p>Short, verified trajectories.</p></div><b aria-hidden="true">→</b><div><span>03 / COMPOSE</span><strong>Solve unfamiliar tasks.</strong><p>A planner + trained executor.</p></div></div>${stats()}</div>`,
  'hero-world': () => `<div class="hero-world"><div class="world-intro"><p class="kicker">MINIWEB / AN ENVIRONMENT FOR WEB AGENTS</p><h1>A small web.<br />A world of skills.</h1><p>65 connected websites. 37 reusable interactions.<br />A place to discover what agents can do—and practice what they cannot.</p><div class="resource-pills"><a class="pill primary" href="${jump('world')}">Step inside MiniWeb ↓</a>${external(paper.overleaf, 'Read the research ↗', 'pill')}</div></div>${mosaic()}<div class="world-caption"><span>ACTUAL INTERFACES FROM MINIWEB</span><span>15 domains · 43 cross-site tasks</span></div></div>`,
  'hero-story': () => `<div class="hero-story"><p class="kicker">BACK TO BASICS / THE MINIWEB STORY</p><h1>Finding a slider<br />is one thing.<br /><em>Moving it is another.</em></h1><p class="story-deck">A web agent can reach the right control and still fail the interaction. What happens when we teach the building blocks first?</p><div class="slider-demo"><div class="demo-top"><span>AN ILLUSTRATION YOU CAN TRY</span><span>01 / DRAG & GESTURE</span></div><label for="rating">Find cafés rated at least <strong>4 stars</strong>.</label><div class="range-value"><span>Minimum rating</span><output id="rating-value" for="rating">Any</output></div><input type="range" id="rating" min="0" max="5" step="0.5" value="0" aria-describedby="slider-hint" /><div class="range-ends"><span>Any</span><span>5 stars</span></div><p id="slider-hint" role="status">The control is found. The filter still needs to be set.</p></div><div class="story-meta"><p><strong>${paper.title}</strong><br />MiniWeb · MiniWebGen · MiniWebAgent</p>${ids.includes('diagnosis') ? '<a class="text-link" href="#diagnosis">Follow the findings ↓</a>' : external(paper.overleaf, 'Read the findings ↗', 'text-link')}</div></div>`,
  'hero-evidence': () => `<div class="hero-evidence"><div><p class="kicker">MINIWEB / THE RESULT IN CONTEXT</p><h1>Better skills.<br />Better composition.<br /><span>Better task success.</span></h1><p>Targeted practice and an explicit planner help a compact web agent solve tasks on websites it never trained on.</p>${links()}<p class="small-paper-title">${paper.title}</p></div><div class="headline-result"><span class="kicker">HELD-OUT MINIWEB TASKS</span><div class="big-result">+17.5<span>percentage points</span></div><div class="before-after"><div><span>37.0%</span><small>Untrained single agent</small></div><b aria-hidden="true">→</b><div><span>54.5%</span><small>MiniWebAgent</small></div></div><p>Qwen3.5-4B · 63 tasks · 13 unseen websites.<br />The full comparison separates planning and training.</p>${ids.includes('results') ? '<a href="#results" class="text-link">Inspect every baseline ↓</a>' : external(paper.overleaf, 'Read the full results ↗', 'text-link')}</div></div>`,
  thesis: () => `${title('THE IDEA IN 30 SECONDS', 'Drills before games.', 'Measure the skills. Practice them directly. Give the agent a way to compose them.')}<div class="three-pillars"><article><span class="pillar-number">01</span><h3>MiniWeb</h3><p class="pillar-subtitle">The environment</p><p>65 websites built around reusable interactions. Each task carries skill-level labels and verdicts.</p></article><article><span class="pillar-number">02</span><h3>MiniWebGen</h3><p class="pillar-subtitle">The practice</p><p>3,128 verified single-primitive trajectories generated on 52 training websites.</p></article><article><span class="pillar-number">03</span><h3>MiniWebAgent</h3><p class="pillar-subtitle">The composition</p><p>An untrained planner delegates short skill-level instructions to a trained executor.</p></article></div>`,
  abstract: () => `<div class="summary-grid"><div><p class="kicker">RESEARCH SUMMARY</p><h2>What should a small<br />web agent practice?</h2><span class="reading-time">~45 SECOND READ</span></div><div><p>Compact web agents have limited training budgets. MiniWeb asks whether those budgets should go toward more complete tasks or toward the reusable skills that tasks are built from.</p><p>The benchmark contains 65 synthetic websites and 376 human-authored tasks built from 37 interaction primitives. Skill-level evaluation exposes weaknesses hidden by aggregate scores: drag & gesture is the weakest family for every one of the ten evaluated agents.</p><p>Training on MiniWebGen’s targeted trajectories improves isolated skills, but does not by itself improve full-task success. MiniWebAgent adds an explicit planner that composes the trained skills, improving performance on held-out sites and three external benchmarks without target-benchmark training.</p><p class="source-caption">Adapted from the current manuscript abstract and introduction.</p></div></div>`,
  world: () => `${title('THE ENVIRONMENT', 'A miniature web.<br />Real interactions.', 'Shopping, calendars, spreadsheets, maps, and more. Inspect an interface, then open the full interactive explorer.')}<div class="world-toolbar"><label class="site-search"><span>Search websites</span><input type="search" id="catalog-search" placeholder="Try email, shopping, maps…" /></label><span id="catalog-count" role="status"></span><a class="text-link" href="./" target="_blank" rel="noopener">Open 3D explorer ↗</a></div><div class="site-grid" id="site-grid"></div><div class="world-bottom"><span>65 sites · 15 domains · 43 cross-site tasks</span><button class="text-button" id="more-sites">Show all 65 websites ↓</button></div><div class="skill-ribbon"><span>7 SKILL FAMILIES</span>${['Navigation', 'Text entry', 'Discrete selection', 'Form transactions', 'Out-of-page I/O', 'Drag & gesture', 'Reasoning'].map(s => `<span>${s}</span>`).join('')}</div>`,
  diagnosis: () => `${title('FINDING 01 / DIAGNOSE', 'The task failed.<br />But which skill failed?', 'A single success score hides the interaction that went wrong. MiniWeb checks the primitives inside each task.')}<div class="diagnosis-grid"><div class="skill-chain"><p class="kicker">ILLUSTRATIVE TASK BREAKDOWN</p><div><span>01</span><p>Navigate to the café listing<small>Navigation</small></p><b>✓</b></div><div class="failure"><span>02</span><p>Set the minimum rating<small>Drag & gesture</small></p><b>×</b></div><div><span>03</span><p>Report a matching café<small>Reasoning</small></p><b>—</b></div><p class="chain-note">One failed primitive can break the task.</p></div><div class="finding-number"><span class="kicker">ACROSS TEN EVALUATED AGENTS</span><strong>11.7<span>%</span></strong><h3>Average drag & gesture success.</h3><p>The next-weakest family reaches 35.7%. In 72% of failed drag instances, the agent reaches the control, then fails during the gesture or immediately afterward.</p><p class="source-caption">Manuscript §4.1 · one run per agent; 18 drag & gesture task instances.</p></div></div>`,
  practice: () => `${title('FINDING 02 / PRACTICE', 'Better at the drills.<br />Still stuck in the game.', 'Single-primitive training improves isolated skills. Those gains do not automatically compose into completed tasks.')}<div class="practice-comparison"><article><span class="kicker">103 GENERATED SINGLE-PRIMITIVE TASKS</span><h3>Skills improve.</h3><div class="metric-row"><span>Untrained</span><div><i style="width:55.3%"></i></div><b>55.3%</b></div><div class="metric-row trained"><span>Skill-trained</span><div><i style="width:80.3%"></i></div><b>80.3%</b></div></article><article><span class="kicker">63 HUMAN-AUTHORED FULL TASKS</span><h3>Task success stays flat.</h3><div class="metric-row"><span>Untrained</span><div><i style="width:37%"></i></div><b>37.0%</b></div><div class="metric-row trained"><span>Skill-trained</span><div><i style="width:37%"></i></div><b>37.0%</b></div></article></div><p class="insight-line"><span>THE MISSING PIECE</span> A model trained on short skill episodes needs help chaining them into a complete task.</p><p class="source-caption">Qwen3.5-4B single agent, before and after training; both evaluations use the 13 held-out MiniWeb sites. Values shown as rounded in the manuscript.</p>`,
  method: () => `${title('THE METHOD / COMPOSE', 'Practice the skills.<br />Plan the whole task.', 'MiniWebGen creates verified practice. MiniWebAgent makes that practice useful at task time.')}<div class="method-flow"><article><span>TRAINING</span><h3>MiniWebGen</h3><p>Summarize → Sample → Suggest → Execute → Gate</p><strong>3,128 verified trajectories</strong><small>Generated on 52 training sites</small></article><div class="flow-arrow" aria-hidden="true">→</div><article><span>INFERENCE</span><h3>MiniWebAgent</h3><p>Task → Planner → Skill instruction → Executor</p><strong>One base model, one trained adapter</strong><small>Reasoning steps use the untrained base model</small></article></div><figure class="paper-figure"><a href="${base}research/method.webp" target="_blank" rel="noopener"><img src="${base}research/method.webp" width="1800" height="671" alt="MiniWebGen generates and verifies skill trajectories. An untrained planner delegates instructions to a pooled LoRA executor. A held-out task trace shows navigation, text entry, and selection steps." loading="lazy" /></a><figcaption><span>FROM THE MANUSCRIPT</span> The data-generation pipeline and planner–executor architecture. Open the figure to inspect it at full size. ↗</figcaption></figure>`,
  results: () => `${title('RESULTS & TRANSFER', 'The gains travel<br />beyond the training sites.', 'Task success (%) with Qwen3.5-4B. No held-out-site or target-benchmark trajectories are used for training.')}<div class="results-chart"><div class="chart-heading"><label for="benchmark">Evaluation</label><select id="benchmark">${evaluations.map((s, i) => `<option value="${i}">${s}</option>`).join('')}</select><span id="benchmark-scope"></span></div><div id="result-bars"></div><p class="chart-axis">TASK SUCCESS · 0–100%</p></div><details class="results-details" ${active === 'evidence' ? 'open' : ''}><summary>See the full comparison table <span>5 configurations × 4 evaluations</span></summary><div class="table-scroll" tabindex="0" role="region" aria-label="Task success comparison"><table><caption>Task success (%) · current manuscript, Table 2</caption><thead><tr><th scope="col">Configuration</th>${evaluations.map((s, i) => `<th scope="col">${s}<small>${sampleSizes[i]} tasks</small></th>`).join('')}</tr></thead><tbody>${resultRows.map(row => `<tr class="${row.ours ? 'ours' : ''}"><th scope="row">${row.name}<small>${row.detail}</small></th>${row.values.map(v => `<td>${v.toFixed(1)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details><details class="scope-details"><summary>How to read these results</summary><p>The MiniWeb evaluation uses 63 human-authored tasks from 13 held-out sites. Live-web evaluations exclude tasks that are impossible or blocked by the evaluation network. Planning alone is a meaningful baseline; gains over the untrained single agent combine planning and skill training.</p><p>The study focuses on compact open-weight models. It does not evaluate closed-source frontier agents or training-data scaling, and it does not fully resolve drag & gesture failures. See the manuscript for repeated-run protocols and statistical tests. These are draft results, not a live leaderboard.</p></details>`,
  resources: () => `${title('BUILD ON THIS WORK', 'Read. Explore. Reuse.', 'Follow the research, inspect the environment, or work with its data.')}<div class="resource-grid">${external(paper.overleaf, '<span>01 / PAPER</span><h3>Read the manuscript ↗</h3><p>The current Overleaf draft, including methods and supplementary analyses.</p><small>Project access required</small>')}${external(paper.code, '<span>02 / CODE</span><h3>Explore the code ↗</h3><p>The MiniWeb repository linked in the manuscript.</p><small>Release destination · access may be restricted</small>')}${external(paper.data, '<span>03 / DATA</span><h3>Find the dataset ↗</h3><p>The MiniWeb dataset destination linked in the manuscript.</p><small>Release destination · availability to confirm</small>')}</div>`,
  citation: () => `<div class="citation-layout"><div><p class="kicker">THE PEOPLE & THE PAPER</p><h2>Back to Basics.</h2>${authors()}<p class="source-caption">${paper.title}</p></div><div><div class="citation-header"><span class="kicker">DRAFT CITATION</span><button class="text-button" id="copy-citation">Copy citation ↗</button></div><pre id="citation-text"></pre><p class="source-caption">Replace the draft entry with final publication metadata before launch.</p></div></div>`,
};

const navLinks = [['world', 'Explore'], ['method', 'Method'], ['results', 'Results'], ['resources', 'Resources']].filter(([id]) => ids.includes(id));
document.querySelector('#structure-preview').innerHTML = `
  <a class="skip-link" href="#page-content">Skip to content</a>
  <header class="academic-header"><a class="academic-brand" href="./" target="${studio ? '_blank' : '_self'}"><img src="./favicon.svg" width="26" height="26" alt="" />miniweb.</a><nav aria-label="Page sections">${navLinks.map(([id, name]) => `<a href="#${id}">${name}</a>`).join('')}</nav>${external(paper.overleaf, 'Paper draft ↗', 'header-paper')}</header>
  <main id="page-content">${ids.map((id, index) => `<section id="${id}" class="page-section ${id.startsWith('hero-') ? 'hero-section' : ''}"><div class="section-annotation"><div><span>${String(index + 1).padStart(2, '0')} / ${esc(sections[id].kind.toUpperCase())}</span><p>${esc(sections[id].purpose)}</p></div><button data-keep="${id}">+ Keep section</button></div><div class="section-content">${renderers[id]()}</div></section>`).join('')}</main>
  <footer class="academic-footer"><span>MiniWeb · Drills before games.</span><a href="./structure-explorer.html">Explore website structures ↗</a><span>Concept preview · manuscript draft</span></footer>
  <dialog id="site-dialog"><div class="site-dialog-top"><p class="kicker">INSIDE MINIWEB</p><button id="close-site" class="pill">Close</button></div><div id="site-dialog-content"></div></dialog>
  <div id="preview-status" class="preview-toast" role="status" aria-live="polite"></div>
`;
const $ = id => document.getElementById(id);
let allSites = false;
function renderCatalog() {
  const input = $('catalog-search').value.trim().toLowerCase();
  const filtered = catalog.filter(s => `${s.name} ${s.shortName} ${s.category} ${s.description} ${s.keywords}`.toLowerCase().includes(input));
  const visible = input || allSites ? filtered : featured;
  $('catalog-count').textContent = input ? `${filtered.length} of 65 websites` : allSites ? '65 websites' : '6 of 65 websites';
  $('site-grid').innerHTML = visible.length ? visible.map(s => `<button class="site-card" data-site="${s.id}"><span class="site-image"><img src="${thumbnail(s)}" width="550" height="350" alt="${esc(s.shortName || s.name)} interface" loading="lazy" /></span><span class="site-card-bottom"><span><strong>${esc(s.shortName || s.name)}</strong><small>${esc(s.category)}</small></span><span aria-hidden="true">↗</span></span></button>`).join('') : '<p class="no-matches">No matching websites. Try a different name or category.</p>';
  $('more-sites').hidden = !!input;
  $('more-sites').textContent = allSites ? 'Show a selection ↑' : 'Show all 65 websites ↓';
}
function renderResults() {
  const index = Number($('benchmark').value);
  $('benchmark-scope').textContent = `${sampleSizes[index]} tasks${index === 0 ? ' · 13 held-out sites' : ''}`;
  $('result-bars').innerHTML = resultRows.map(row => `<div class="result-bar-row ${row.ours ? 'ours' : ''}"><div><strong>${row.name}</strong><small>${row.detail}</small></div><div class="result-track"><span style="width:${row.values[index]}%"></span></div><b>${row.values[index].toFixed(1)}<small>%</small></b></div>`).join('');
}
function syncKept() {
  document.querySelectorAll('[data-keep]').forEach(button => {
    const kept = savedMix.includes(button.dataset.keep);
    button.textContent = kept ? '✓ In your mix' : '+ Keep section';
    button.setAttribute('aria-pressed', String(kept));
    button.setAttribute('aria-label', `${kept ? 'Already kept' : 'Keep'} ${sections[button.dataset.keep].label}`);
  });
}
if ($('catalog-search')) {
  $('catalog-search').addEventListener('input', renderCatalog);
  $('more-sites').addEventListener('click', () => { allSites = !allSites; renderCatalog(); });
  renderCatalog();
}
if ($('benchmark')) { $('benchmark').addEventListener('change', renderResults); renderResults(); }
if ($('rating')) $('rating').addEventListener('input', event => {
  const value = Number(event.target.value);
  $('rating-value').textContent = value === 0 ? 'Any' : `${value.toFixed(1)} stars`;
  $('slider-hint').textContent = value === 4 ? 'Skill complete: the minimum rating is set to 4 stars.' : value === 0 ? 'The control is found. The filter still needs to be set.' : `The minimum is ${value.toFixed(1)}. Set it to exactly 4 stars to complete this illustration.`;
  document.querySelector('.slider-demo').classList.toggle('complete', value === 4);
});
const citation = `@misc{miniweb_draft,\n  title = {Back to Basics: Drills Before Games for Web Agents},\n  author = {Pham-Dinh, Minh and Ishmam, Md Farhan and\n    Yupanqui, Hernan and Joarder, Reaz Hassan and Marino, Kenneth},\n  note = {Manuscript draft; publication details pending}\n}`;
if ($('citation-text')) $('citation-text').textContent = citation;
if ($('copy-citation')) $('copy-citation').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(citation); $('copy-citation').textContent = 'Copied ✓'; }
  catch { const range = document.createRange(); range.selectNodeContents($('citation-text')); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); $('copy-citation').textContent = 'Selected — use Copy'; }
});
document.addEventListener('click', event => {
  // A srcdoc preview inherits its parent's base URL. Handle local anchors here
  // so the portable studio scrolls its preview instead of navigating the frame.
  const anchor = event.target.closest('a[href^="#"]');
  if (anchor) {
    const target = document.getElementById(anchor.getAttribute('href').slice(1));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }
  const keepButton = event.target.closest('[data-keep]');
  if (keepButton && studio) window.parent.postMessage({ type: 'miniweb-studio-keep', id: keepButton.dataset.keep }, location.origin);
  const siteButton = event.target.closest('[data-site]');
  if (siteButton) {
    const site = catalog.find(s => s.id === siteButton.dataset.site);
    $('site-dialog-content').innerHTML = `<h2>${esc(site.shortName || site.name)}</h2><p>${esc(site.description)}</p><img src="${thumbnail(site)}" width="550" height="350" alt="${esc(site.shortName || site.name)} interface" /><div class="site-features">${site.features.map(f => `<span>${esc(f)}</span>`).join('')}</div><div class="resource-pills">${external(site.url, 'Open live website ↗', 'pill primary')}${external(`./#site=${site.id}`, 'View in 3D explorer ↗', 'pill')}</div>`;
    $('site-dialog').showModal();
  }
});
$('close-site').addEventListener('click', () => $('site-dialog').close());
window.addEventListener('message', event => {
  if (!studio || event.origin !== location.origin || event.source !== window.parent) return;
  if (event.data?.type === 'miniweb-studio-state') {
    savedMix = cleanMix(event.data.mix);
    document.body.classList.toggle('show-notes', !!event.data.showNotes);
    syncKept();
  }
  if (event.data?.type === 'miniweb-studio-jump' && ids.includes(event.data.id)) {
    $(event.data.id).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
});
syncKept();
if (studio) window.parent.postMessage({ type: 'miniweb-studio-ready' }, location.origin);
