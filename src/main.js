import './style.css';
import './paper-page.css';
import './explorer.css';
import { applyDesign, designFromQuery } from './design-theme.js';
import { renderPaperIntro, renderPaperSections, initializePaperSections } from './paper-page.js';
import { initializeShowcases } from './showcase.js';
import { initializeSkillProfiles } from './skill-profiles.js';
import { initializePrimitiveCatalog } from './primitive-catalog.js';
import { initializePdfFigures } from './pdf-figure.js';
import { initializeSkillImprovement } from './skill-improvement.js';
import { revealOnScroll } from './motion.js';
import { initializeAnnotationTool } from './annotation-tool.js';
import { initializeTaskExplorer } from './task-explorer.js';
import catalog from './data/sites.json';
const sites = catalog.map(site => ({ ...site, registryName: site.name, name: site.shortName || site.name }));
import { MiniWebGraph } from './graph.js';

const icons = {
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="m8 5 11 7-11 7Z"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  network: '<circle cx="5" cy="7" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="14" cy="19" r="3"/><path d="m8 7 8-2M7 10l5 6M18 8l-3 8"/>',
  chevron: '<path d="m8 4 8 8-8 8"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  mouse: '<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 2v7"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.globe}</svg>`;
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const categories = [...new Set(sites.map(s => s.category))].sort();
const categoryShort = {
  'Shopping & Transactional': 'Shopping', 'Search & Reference': 'Search & reference',
  'Static & Informational': 'Information', 'Dynamic Info & Feeds': 'News & feeds',
  'Streaming & Media': 'Media', 'Government & Civic': 'Civic',
  'Education & LMS': 'Education', 'Financial': 'Finance',
};
const categoryColor = (category) => ({ Productivity:'#649072', Communication:'#708ac0', 'Shopping & Transactional':'#c39157', Financial:'#699b89', Editing:'#a87da9', 'Streaming & Media':'#bc827c', 'Search & Reference':'#8f88b3' }[category] || '#859b9b');
const siteUrl = site => site.url || `https://sparklabuofu-miniweb-demo.hf.space${site.path}`;
const previewUrl = site => `${import.meta.env.BASE_URL}previews/thumbnails/${site.id}.webp`;
const liveOrigin = new URL(siteUrl(sites[0])).origin;
if (!document.head.querySelector(`link[rel="preconnect"][href="${liveOrigin}"]`)) {
  const connection = document.createElement('link');
  connection.rel = 'preconnect';
  connection.href = liveOrigin;
  document.head.append(connection);
}

const app = document.querySelector('#app');
app.innerHTML = `
  <a class="skip-link" href="#explorer">Skip to website explorer</a><a class="skip-link" href="#background">Skip to the write-up</a>
  <main>
    ${renderPaperIntro()}
    <section class="explorer" id="explorer" aria-label="MiniWeb interactive website explorer">
      <div class="explorer-toolbar">
        <p class="explorer-title">The ${sites.length} websites</p><div class="view-switch" role="group" aria-label="Explorer view"><button id="network-view" class="view-tab active" aria-pressed="true">${icon('network')} Network</button><button id="directory-view" class="view-tab" aria-pressed="false">${icon('grid')} Directory</button></div>
        <div class="filter-tools"><label class="search-field">${icon('search')}<input id="site-search" type="search" placeholder="Find a website…" aria-label="Find a website" autocomplete="off"/><kbd>/</kbd></label><label class="category-select"><span class="sr-only">Filter by domain</span><select id="category"><option value="">All domains</option>${categories.map(c => `<option value="${escape(c)}">${escape(categoryShort[c] || c)}</option>`).join('')}</select></label></div>
      </div>
      <div class="workspace">
        <div class="network-pane">
          <div class="stage-label"><span class="status-dot"></span><span id="site-count">65 websites</span><span class="label-separator">/</span><span id="domain-count">15 domains</span></div>
          <div id="graph" aria-label="3D website network. Drag to rotate, scroll to zoom, or use arrow keys. Press Tab to explore site cards."></div>
          <div id="directory" class="directory" hidden></div>
          <div id="no-results" class="no-results" hidden>${icon('search')}<h2>No websites found</h2><p>Try another name or explore a different domain.</p><button id="clear-search" class="text-button">Clear filters ${icon('arrow')}</button></div>
          <div class="graph-bottom"><div class="interaction-hint">${icon('mouse')}<span>Drag to rotate<span class="hint-dot">·</span>Scroll to zoom<span class="hint-dot">·</span>Click to explore</span></div><div class="graph-controls" role="group" aria-label="Network controls"><button id="rotate" title="Pause rotation" aria-label="Pause rotation" aria-pressed="false">${icon('pause')}</button><span class="control-divider"></span><button id="zoom-out" title="Zoom out" aria-label="Zoom out">${icon('minus')}</button><span id="zoom-level" aria-hidden="true">100%</span><button id="zoom-in" title="Zoom in" aria-label="Zoom in">${icon('plus')}</button><span class="control-divider"></span><button id="reset-view" title="Reset view" aria-label="Reset network view">${icon('reset')}</button></div></div>
        </div>
        <aside id="detail-panel" class="detail-panel" aria-label="Selected website" hidden></aside>
      </div>
    </section>
    <p class="paper-caption explorer-note"><strong>The 65 MiniWeb websites in 15 domains.</strong> Drag to rotate, scroll to zoom, and click a website to load its live interface. Edges are illustrative links between domains, not measured task relationships.</p>
    ${renderPaperSections()}
    <footer class="page-footer"><span>Numbers, figures, and examples follow the paper draft of 20 October 2026.</span><a href="https://github.com/miniweb-site/MiniWeb" target="_blank" rel="noopener noreferrer">github.com/miniweb-site/MiniWeb ${icon('arrow')}</a></footer>
  </main>
  <div id="announcer" class="sr-only" role="status" aria-live="polite"></div>
`;

applyDesign(document, designFromQuery(location.search));
initializePaperSections();
initializeShowcases();
initializeSkillProfiles();
initializePrimitiveCatalog();
initializePdfFigures();
initializeSkillImprovement();
initializeAnnotationTool();
initializeTaskExplorer();
revealOnScroll('.paper-tldr, .band, .paper-figure:not(.band)');

const $ = id => document.getElementById(id);
let selected = null;
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode = 'network';
let visibleSites = sites;
let expanded = false;
let previousFocus = null;
let loadTimer;
let graph;
const liveFrames = new Map();
const liveFrameLimit = 3;
const slowLoadDelay = 12000;

function announce(message) { $('announcer').textContent = message; }
function updateRotation() {
  $('rotate').innerHTML = icon(paused ? 'play' : 'pause');
  $('rotate').setAttribute('aria-label', paused ? 'Resume rotation' : 'Pause rotation');
  $('rotate').title = paused ? 'Resume rotation' : 'Pause rotation';
  $('rotate').setAttribute('aria-pressed', String(paused));
  $('rotate').disabled = !!selected;
  if (selected) {
    $('rotate').innerHTML = icon('pause');
    $('rotate').title = 'Rotation pauses while a website is open';
    $('rotate').setAttribute('aria-label', 'Rotation pauses while a website is open');
  }
  graph?.setPaused(paused || mode !== 'network' || !!selected);
}

function renderDirectory() {
  $('directory').innerHTML = visibleSites.map(s => `<button class="directory-card ${selected?.id === s.id ? 'selected' : ''}" data-site="${s.id}" aria-label="Explore ${escape(s.name)}" aria-pressed="${selected?.id === s.id}"><span class="directory-thumb"><img src="${previewUrl(s)}" loading="lazy" decoding="async" width="550" height="350" alt="" /></span><span class="directory-card-info"><span class="directory-card-name">${escape(s.name)} ${icon('arrow')}</span><span class="category-tag"><i style="background:${categoryColor(s.category)}"></i>${escape(categoryShort[s.category] || s.category)}</span></span></button>`).join('');
  $('directory').querySelectorAll('[data-site]').forEach(button => button.addEventListener('click', () => selectSite(sites.find(s => s.id === button.dataset.site))));
}

function filterSites() {
  const query = $('site-search').value.trim().toLocaleLowerCase();
  const category = $('category').value;
  const matches = s => (!category || s.category === category) && [s.name, s.registryName, s.shortName, s.id, s.category, s.domain, s.description, s.type, s.keywords].join(' ').toLocaleLowerCase().includes(query);
  visibleSites = sites.filter(matches);
  graph.setFilter(matches);
  $('site-count').textContent = `${visibleSites.length} ${visibleSites.length === 1 ? 'website' : 'websites'}`;
  const domainCount = new Set(visibleSites.map(s => s.category)).size;
  $('domain-count').textContent = `${domainCount} ${domainCount === 1 ? 'domain' : 'domains'}`;
  $('no-results').hidden = visibleSites.length > 0;
  if (selected && !matches(selected)) closeDetail(false);
  if (mode === 'directory') renderDirectory();
  announce(`${visibleSites.length} websites shown.`);
}

function setMode(nextMode) {
  mode = nextMode;
  $('graph').hidden = mode !== 'network';
  $('directory').hidden = mode !== 'directory';
  document.querySelector('.network-pane').classList.toggle('directory-mode', mode === 'directory');
  ['network', 'directory'].forEach(m => {
    $(`${m}-view`).classList.toggle('active', m === mode);
    $(`${m}-view`).setAttribute('aria-pressed', String(m === mode));
  });
  if (mode === 'directory') renderDirectory();
  updateRotation();
}

function scalePreview() {
  const viewport = document.querySelector('.live-viewport');
  const frame = selected && liveFrames.get(selected.id)?.frame;
  if (!viewport || !frame) return;
  const width = viewport.clientWidth;
  if (!width) return;
  const scale = Math.min(1, width / 1100);
  // Keep a full desktop viewport while making the entire UI visible in the panel.
  frame.style.width = `${width / scale}px`;
  frame.style.height = `${Math.max(760, viewport.clientHeight / scale)}px`;
  frame.style.transform = `scale(${scale})`;
}
const panelResize = new ResizeObserver(scalePreview);
panelResize.observe($('detail-panel'));

function ensureDetailPanel() {
  if ($('live-viewport')) return;
  $('detail-panel').innerHTML = `
    <div class="detail-top"><span class="detail-eyebrow">Website <span id="detail-index"></span></span><div class="detail-actions"><button id="expand-preview" class="icon-button">${icon('expand')}</button><button id="close-detail" class="icon-button" aria-label="Close website details" title="Close (Esc)">${icon('close')}</button></div></div>
    <div id="detail-information" class="detail-information"></div>
    <div class="live-browser"><div class="browser-toolbar"><span class="browser-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="browser-address" id="browser-address"></span><a id="browser-open" target="_blank" rel="noopener noreferrer" class="icon-button" title="Open in new tab">${icon('arrow')}</a></div><div id="live-viewport" class="live-viewport" aria-busy="false"><img id="live-snapshot" class="live-snapshot" width="550" height="350" alt="" /><div class="loading-site" id="site-loading"><span class="spinner" aria-hidden="true"></span><span id="loading-message"></span></div></div></div>
    <div class="detail-bottom"><span role="status"><span class="status-dot"></span><span id="live-status"></span></span><a id="full-site" target="_blank" rel="noopener noreferrer">Open full site ${icon('arrow')}</a></div>
    <p id="load-help" class="load-help" hidden><span id="load-help-message"></span> <button id="retry-site" class="retry-site">Try again</button></p>
  `;
  $('close-detail').addEventListener('click', () => closeDetail());
  $('expand-preview').addEventListener('click', () => {
    expanded = !expanded;
    updateExpansion();
    requestAnimationFrame(scalePreview);
  });
  $('retry-site').addEventListener('click', () => {
    if (!selected) return;
    clearTimeout(loadTimer);
    removeLiveFrame(selected.id);
    openLiveFrame(selected);
  });
}

function updateExpansion() {
  document.querySelector('.workspace').classList.toggle('preview-expanded', expanded);
  $('expand-preview').setAttribute('aria-pressed', String(expanded));
  $('expand-preview').setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} website preview`);
  $('expand-preview').title = `${expanded ? 'Collapse' : 'Expand'} preview`;
}

function renderLiveStatus(entry) {
  if (selected?.id !== entry.site.id) return;
  const ready = entry.state === 'loaded';
  const failed = entry.state === 'error';
  const slow = !ready && performance.now() - entry.startedAt >= slowLoadDelay;
  $('live-viewport').setAttribute('aria-busy', String(!ready && !failed));
  $('live-snapshot').hidden = ready;
  $('site-loading').hidden = ready;
  $('site-loading').classList.toggle('failed', failed);
  $('loading-message').textContent = failed ? 'Live website unavailable' : slow ? 'Still connecting to the live website…' : 'Opening live website…';
  $('live-status').textContent = ready ? 'Live website' : failed ? 'Website preview' : 'Preview · connecting to live site';
  $('load-help').hidden = ready || (!failed && !slow);
  $('load-help-message').textContent = failed
    ? 'The live site could not open. You can try again or open the full site.'
    : 'The live site is taking longer to respond. Its preview is shown while it loads.';
  entry.frame.classList.toggle('is-ready', ready);
  entry.frame.inert = !ready;
  entry.frame.setAttribute('aria-hidden', String(!ready));
  entry.frame.tabIndex = ready ? 0 : -1;
}

function removeLiveFrame(id) {
  const entry = liveFrames.get(id);
  if (!entry) return;
  entry.listeners.abort();
  entry.frame.remove();
  liveFrames.delete(id);
}

function openLiveFrame(site) {
  clearTimeout(loadTimer);
  let entry = liveFrames.get(site.id);
  if (entry) {
    // Keep the browsing context mounted: reparenting an iframe reloads its page.
    liveFrames.delete(site.id);
    liveFrames.set(site.id, entry);
  } else {
    const frame = document.createElement('iframe');
    frame.className = 'live-site';
    frame.title = `${site.name} — live MiniWeb website`;
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads');
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.inert = true;
    frame.tabIndex = -1;
    const listeners = new AbortController();
    entry = { site, frame, listeners, state: 'loading', startedAt: performance.now() };
    const finish = state => {
      entry.state = state;
      if (selected?.id !== site.id) return;
      clearTimeout(loadTimer);
      renderLiveStatus(entry);
    };
    frame.addEventListener('load', () => finish('loaded'), { signal: listeners.signal });
    frame.addEventListener('error', () => finish('error'), { signal: listeners.signal });
    frame.src = siteUrl(site);
    liveFrames.set(site.id, entry);
    $('live-viewport').append(frame);
    while (liveFrames.size > liveFrameLimit) removeLiveFrame(liveFrames.keys().next().value);
  }
  liveFrames.forEach((cached, id) => { cached.frame.hidden = id !== site.id; });
  renderLiveStatus(entry);
  if (entry.state === 'loading') {
    loadTimer = setTimeout(() => {
      if (selected?.id === site.id && liveFrames.get(site.id) === entry) renderLiveStatus(entry);
    }, Math.max(0, slowLoadDelay - (performance.now() - entry.startedAt)));
  }
  requestAnimationFrame(scalePreview);
}

function selectSite(site, { focus = true } = {}) {
  if (!site) { closeDetail(false); return; }
  if (!$('detail-panel').contains(document.activeElement)) previousFocus = document.activeElement;
  selected = site;
  clearTimeout(loadTimer);
  graph.setSelected(site.id);
  ensureDetailPanel();
  $('detail-panel').hidden = false;
  document.querySelector('.workspace').classList.add('has-selection');
  const features = site.features || [];
  $('detail-index').textContent = `${sites.indexOf(site) + 1} of ${sites.length}`;
  $('detail-information').innerHTML = `
    <div class="detail-heading"><div><span class="category-tag"><i style="background:${categoryColor(site.category)}"></i>${escape(categoryShort[site.category] || site.category)}</span><h2 tabindex="-1" id="selected-title">${escape(site.name)}</h2></div></div>
    <p class="detail-description">${escape(site.description)}</p>
    ${features.length ? `<div class="features" aria-label="Site features">${features.slice(0, 3).map(f => `<span>${escape(f)}</span>`).join('')}</div>` : ''}
  `;
  $('browser-address').innerHTML = `${icon('globe')}${escape(site.domain)}`;
  $('browser-open').href = siteUrl(site);
  $('browser-open').setAttribute('aria-label', `Open ${site.name} in a new tab`);
  $('full-site').href = siteUrl(site);
  $('live-snapshot').src = previewUrl(site);
  $('live-snapshot').alt = `${site.name} interface preview`;
  updateExpansion();
  openLiveFrame(site);
  history.replaceState(null, '', `#site=${encodeURIComponent(site.id)}`);
  updateRotation();
  if (mode === 'directory') renderDirectory();
  if (focus) $('selected-title').focus({ preventScroll: true });
  if (matchMedia('(max-width: 760px)').matches) $('detail-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  announce(`${site.name} selected. Its preview and description are open.`);
}
function closeDetail(restoreFocus = true) {
  if (!selected) return;
  const closingSiteId = selected.id;
  selected = null;
  expanded = false;
  clearTimeout(loadTimer);
  graph.setSelected(null);
  $('detail-panel').hidden = true;
  $('live-viewport').setAttribute('aria-busy', 'false');
  liveFrames.forEach(entry => { entry.frame.hidden = true; });
  document.querySelector('.workspace').classList.remove('has-selection', 'preview-expanded');
  history.replaceState(null, '', location.pathname + location.search);
  updateRotation();
  if (mode === 'directory') renderDirectory();
  if (restoreFocus) {
    const target = previousFocus?.isConnected ? previousFocus : document.querySelector(`[data-site="${closingSiteId}"]`) || document.querySelector(`[data-site-id="${closingSiteId}"]`) || $('graph');
    target.focus({ preventScroll: true });
  }
}

graph = new MiniWebGraph({
  container: $('graph'), sites, onSelect: selectSite,
  reducedMotion: paused,
  onStats: stats => { if (stats.zoom) $('zoom-level').textContent = `${Math.round(stats.zoom * 100)}%`; },
});
updateRotation();
$('site-search').addEventListener('input', filterSites);
$('category').addEventListener('change', filterSites);
$('clear-search').addEventListener('click', () => { $('site-search').value = ''; $('category').value = ''; filterSites(); $('site-search').focus(); });
$('network-view').addEventListener('click', () => setMode('network'));
$('directory-view').addEventListener('click', () => setMode('directory'));
$('rotate').addEventListener('click', () => { paused = !paused; updateRotation(); });
$('zoom-in').addEventListener('click', () => graph.setZoom(0.15));
$('zoom-out').addEventListener('click', () => graph.setZoom(-0.15));
$('reset-view').addEventListener('click', () => { graph.reset(); announce('Network view reset.'); });
document.addEventListener('keydown', event => {
  const editing = event.target.closest('input, textarea, select, [contenteditable="true"]');
  if (event.key === '/' && !editing && !event.metaKey && !event.ctrlKey) { event.preventDefault(); $('site-search').focus(); }
  if (event.key === 'Escape' && selected) closeDetail();
});
window.addEventListener('hashchange', () => {
  const id = new URLSearchParams(location.hash.slice(1)).get('site');
  const site = sites.find(s => s.id === id);
  if (site) selectSite(site, { focus: false }); else closeDetail(false);
});
const initialId = new URLSearchParams(location.hash.slice(1)).get('site');
if (initialId) { const site = sites.find(s => s.id === initialId); if (site) selectSite(site, { focus: false }); }
