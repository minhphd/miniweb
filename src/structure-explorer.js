import './structure-explorer.css';
import { directions, sections, recommended, paper, storageKey, cleanMix, escapeHtml as esc } from './structure-content.js';

const $ = id => document.getElementById(id);
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { /* Storage is optional. */ }
const query = new URLSearchParams(location.search);
const known = id => directions.some(d => d.id === id) || id === 'mix';
let active = known(query.get('direction')) ? query.get('direction') : known(saved.active) ? saved.active : 'paper';
let mix = cleanMix(query.has('sections') ? query.get('sections').split(',') : saved.mix);
let notes = typeof saved.notes === 'string' ? saved.notes : '';
let device = 'desktop';
let showNotes = true;
let noticeTimer;

document.querySelector('#structure-studio').innerHTML = `
  <a class="studio-skip" href="#preview-frame">Skip to page preview</a>
  <header class="studio-header">
    <a class="studio-brand" href="./"><img src="./favicon.svg" alt="" width="28" height="28" />miniweb<span>.</span></a>
    <span class="header-divider"></span><span class="studio-label">Structure studio</span><span class="draft-tag">LOCAL CONCEPTS</span>
    <nav aria-label="Studio links"><a href="./design-explorer.html" target="_blank" rel="noopener">Type & color ↗</a><button class="button dark" id="share">Export decisions ↗</button></nav>
  </header>
  <main>
    <section class="studio-intro"><div><p class="eyebrow">ONE PAPER. FOUR WAYS IN.</p><h1>What should come first?</h1></div><p>Explore four reading paths for MiniWeb.<br />Keep the sections you like. Make the story yours.</p></section>
    <div class="direction-grid" id="direction-grid" role="group" aria-label="Website structures"></div>
    <div class="studio-workspace">
      <aside class="structure-panel" aria-label="Structure controls">
        <div class="panel-tabs" role="group" aria-label="Structure panel"><button id="outline-tab" aria-pressed="true">Reading path</button><button id="mix-tab" aria-pressed="false">My mix <span id="mix-count"></span></button></div>
        <div id="direction-info"></div>
        <div class="panel-section"><div class="small-heading"><span id="outline-title">PAGE ORDER</span><button class="plain-button" id="compare">Compare all ↗</button></div><ol id="section-list" class="section-list"></ol></div>
        <div class="panel-section" id="mix-tools" hidden><label class="eyebrow" for="add-section">ADD A SECTION</label><div class="add-row"><select id="add-section" aria-label="Section to add"></select><button class="button" id="add">Add</button></div><label class="eyebrow" for="decision-notes">YOUR NOTES</label><textarea id="decision-notes" rows="3" placeholder="e.g. Keep A’s title, bring the world up, then tell C’s story…"></textarea></div>
        <div class="recommendation"><span class="eyebrow">MY STARTING POINT</span><p><strong>A’s clarity + B’s world + C’s argument.</strong> A short academic opening, early exploration, then the research story and results.</p><button class="button full" id="recommended">Preview this combination →</button></div>
        <div class="source-note"><span class="source-dot"></span><div>Grounded in the arXiv source<br /><span>20 Oct 2026</span></div></div>
      </aside>
      <section class="preview-column" aria-label="Live structure preview">
        <div class="preview-toolbar"><div class="preview-name"><span class="live-dot"></span><span id="preview-name"></span></div><div class="preview-actions"><div class="device-switch" role="group" aria-label="Preview width"><button data-device="desktop" aria-pressed="true">Desktop</button><button data-device="phone" aria-pressed="false">Phone</button></div><label class="notes-switch"><input type="checkbox" id="show-notes" checked /> Section notes</label><a id="open-preview" target="_blank" rel="noopener">Open page ↗</a></div></div>
        <div class="preview-stage" id="preview-stage"><iframe id="preview-frame" title="Academic website structure preview"></iframe></div>
        <p class="preview-footnote">Draft copy and reported results from the current manuscript. Section notes belong to this studio, not the eventual website.</p>
      </section>
    </div>
  </main>
  <div id="studio-status" class="toast" role="status" aria-live="polite"></div>
  <dialog id="compare-dialog"><div class="dialog-header"><div><p class="eyebrow">COMPARE THE JOURNEYS</p><h2>Same research. Different first impression.</h2></div><button class="button" data-close="compare-dialog">Close</button></div><div class="comparison-grid">${directions.map(d => `<article><span class="direction-letter">${d.letter}</span><h3>${d.title}</h3><p>${esc(d.promise)}</p><ol>${d.sections.map(id => `<li>${esc(sections[id].label)}</li>`).join('')}</ol><strong>Best for</strong><p>${esc(d.audience)}</p><strong>Tradeoff</strong><p>${esc(d.tradeoff)}</p><button class="button full" data-choose="${d.id}">Explore ${d.letter} →</button></article>`).join('')}</div></dialog>
  <dialog id="export-dialog"><div class="dialog-header"><div><p class="eyebrow">TAKE THE NEXT STEP</p><h2>Your website direction</h2></div><button class="button" data-close="export-dialog">Close</button></div><p>This captures your current preview, section order, and notes. Paste it into our chat to keep shaping the page.</p><textarea id="export-text" rows="16" readonly aria-label="Website structure decisions"></textarea><div class="export-actions"><button class="button" id="download">Download outline</button><button class="button dark" id="copy">Copy decisions</button></div></dialog>
`;

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ active, mix, notes })); } catch { /* URL remains available. */ }
  const url = new URL(location.href);
  url.searchParams.set('direction', active);
  if (active === 'mix') url.searchParams.set('sections', mix.join(','));
  else url.searchParams.delete('sections');
  history.replaceState(null, '', url);
}
function notify(message) {
  $('studio-status').textContent = message;
  $('studio-status').classList.add('visible');
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => $('studio-status').classList.remove('visible'), 3000);
}
function selectedDirection() { return directions.find(d => d.id === active); }
function currentSections() { return active === 'mix' ? mix : selectedDirection().sections; }
function previewURL(annotated = false) {
  const url = new URL('./structure-preview.html', location.href);
  url.searchParams.set('direction', active);
  if (active === 'mix') url.searchParams.set('sections', mix.join(','));
  if (annotated) url.searchParams.set('studio', '1');
  if (!showNotes && annotated) url.searchParams.set('notes', '0');
  return url;
}
function syncFrame() {
  $('preview-frame').contentWindow.postMessage({ type: 'miniweb-studio-state', mix, showNotes }, location.origin);
}
function renderControls() {
  $('direction-grid').innerHTML = directions.map(d => `<button class="direction-card ${active === d.id ? 'selected' : ''}" data-direction="${d.id}" aria-pressed="${active === d.id}"><span class="wireframe wireframe-${d.id}" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="direction-card-copy"><span class="direction-card-top"><span class="direction-letter">${d.letter}</span><span class="direction-indicator">${active === d.id ? 'VIEWING' : 'EXPLORE ↗'}</span></span><strong>${d.title}</strong><span>${d.subtitle}</span></span></button>`).join('');
  const d = selectedDirection();
  const custom = active === 'mix';
  $('outline-tab').setAttribute('aria-pressed', String(!custom));
  $('mix-tab').setAttribute('aria-pressed', String(custom));
  $('mix-count').textContent = mix.length;
  $('direction-info').innerHTML = custom
    ? `<div class="direction-detail"><p class="eyebrow">YOUR COMBINATION</p><h2>Make the order yours.</h2><p>One opening, followed by the sections you choose. Use the arrows to change the reading path.</p></div>`
    : `<div class="direction-detail"><p class="eyebrow">DIRECTION ${d.letter}</p><h2>${esc(d.promise)}</h2><p>${esc(d.strength)}</p><div class="tradeoff"><strong>The tradeoff</strong><p>${esc(d.tradeoff)}</p></div><button class="button full" id="use-direction">Use ${d.letter} as my starting point →</button></div>`;
  $('outline-title').textContent = custom ? 'YOUR PAGE ORDER' : 'PAGE ORDER';
  $('section-list').innerHTML = currentSections().map((id, i, all) => `<li class="section-row"><button class="section-jump" data-jump="${id}"><span class="section-index">${String(i + 1).padStart(2, '0')}</span><span>${esc(sections[id].label)}<small>${esc(sections[id].kind)}</small></span></button>${custom ? `<span class="reorder-buttons"><button data-move="${id}" data-delta="-1" aria-label="Move ${esc(sections[id].label)} up" ${i < 2 ? 'disabled' : ''}>↑</button><button data-move="${id}" data-delta="1" aria-label="Move ${esc(sections[id].label)} down" ${i === 0 || i === all.length - 1 ? 'disabled' : ''}>↓</button><button data-remove="${id}" aria-label="Remove ${esc(sections[id].label)}" ${i === 0 ? 'disabled' : ''}>×</button></span>` : `<button class="keep-mini ${mix.includes(id) ? 'kept' : ''}" data-keep="${id}" aria-label="${mix.includes(id) ? 'Already kept' : 'Keep'} ${esc(sections[id].label)}">${mix.includes(id) ? '✓' : '+'}</button>`}</li>`).join('');
  $('mix-tools').hidden = !custom;
  const options = Object.keys(sections).filter(id => !mix.includes(id));
  $('add-section').innerHTML = options.map(id => `<option value="${id}">${esc(sections[id].label)}</option>`).join('');
  $('add').disabled = !options.length;
  $('decision-notes').value = notes;
  $('preview-name').textContent = custom ? 'Your mix' : `${d.letter} / ${d.title}`;
  $('open-preview').href = previewURL();
}
function render(loadFrame = true) {
  persist();
  renderControls();
  if (loadFrame) $('preview-frame').src = previewURL(true);
  else syncFrame();
}
function keep(id) {
  if (!Object.hasOwn(sections, id)) return;
  if (mix.includes(id)) return notify('This section is already in your mix.');
  if (id.startsWith('hero-')) mix[0] = id;
  else {
    const closing = mix.indexOf('resources');
    mix.splice(closing < 0 ? mix.length : closing, 0, id);
  }
  render(active === 'mix');
  notify(`${sections[id].label} kept in your mix.`);
}
function exportText() {
  const title = selectedDirection()?.title || 'My custom mix';
  return `MiniWeb academic website direction: ${title}\n\nResearch: ${paper.title}\nSource: ${paper.snapshot}\n\nSection order:\n${currentSections().map((id, i) => `${i + 1}. ${sections[id].label}\n   ${sections[id].purpose}`).join('\n')}\n\nMy notes:\n${notes || '(No notes yet)'}\n\nPreview (local server required):\n${previewURL()}\n\nPublication details to finalize: public paper/PDF link, code and dataset release availability, final citation metadata.`;
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.direction) { active = button.dataset.direction; render(); }
  if (button.dataset.choose) { active = button.dataset.choose; $('compare-dialog').close(); render(); }
  if (button.dataset.close) $(button.dataset.close).close();
  if (button.dataset.keep) keep(button.dataset.keep);
  if (button.dataset.jump) $('preview-frame').contentWindow.postMessage({ type: 'miniweb-studio-jump', id: button.dataset.jump }, location.origin);
  if (button.dataset.remove) { mix = mix.filter(id => id !== button.dataset.remove); render(); }
  if (button.dataset.move) {
    const i = mix.indexOf(button.dataset.move);
    const next = i + Number(button.dataset.delta);
    if (i > 0 && next > 0 && next < mix.length) { [mix[i], mix[next]] = [mix[next], mix[i]]; render(); }
  }
  if (button.dataset.device) {
    device = button.dataset.device;
    $('preview-stage').classList.toggle('phone', device === 'phone');
    document.querySelectorAll('[data-device]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.device === device)));
  }
  if (button.id === 'use-direction') { mix = [...selectedDirection().sections]; active = 'mix'; render(); notify('This direction is now your editable mix.'); }
});
$('mix-tab').addEventListener('click', () => { active = 'mix'; render(); });
$('outline-tab').addEventListener('click', () => { if (active === 'mix') { active = 'paper'; render(); } });
$('recommended').addEventListener('click', () => { mix = [...recommended]; active = 'mix'; render(); notify('Recommended combination loaded.'); });
$('add').addEventListener('click', () => keep($('add-section').value));
$('decision-notes').addEventListener('input', event => { notes = event.target.value; persist(); });
$('show-notes').addEventListener('change', event => { showNotes = event.target.checked; syncFrame(); });
$('preview-frame').addEventListener('load', syncFrame);
$('compare').addEventListener('click', () => $('compare-dialog').showModal());
$('share').addEventListener('click', () => { $('export-text').value = exportText(); $('export-dialog').showModal(); });
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('export-text').value); notify('Decisions copied. Paste them into our chat.'); }
  catch { $('export-text').focus(); $('export-text').select(); notify('Text selected. Use your browser’s Copy command.'); }
});
$('download').addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([exportText()], { type: 'text/plain' }));
  link.download = 'miniweb-website-direction.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== $('preview-frame').contentWindow) return;
  if (event.data?.type === 'miniweb-studio-keep') keep(event.data.id);
  if (event.data?.type === 'miniweb-studio-ready') syncFrame();
});
render();
