import './design-explorer.css';
import { fonts, accents, logos, layouts, presets, fontsUrl } from './design-options.js';
import { applyDesign, createThemeCss, productionDesign } from './design-theme.js';

const $ = id => document.getElementById(id);
const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svg = (paths, className = '') => `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const icons = {
  arrow: svg('<path d="M7 17 17 7M7 7h10v10"/>'),
  reset: svg('<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>'),
  copy: svg('<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>'),
  shuffle: svg('<path d="M3 6h3l12 12h3M3 18h3L18 6h3M18 3l3 3-3 3M18 15l3 3-3 3"/>'),
  desktop: svg('<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v4M8 21h8"/>'),
  tablet: svg('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 18h2"/>'),
  mobile: svg('<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>'),
  down: svg('<path d="M12 3v12M7 10l5 5 5-5M4 16v5h16v-5"/>'),
  check: svg('<path d="m5 12 4 4L19 6"/>'),
};
const collections = { font: fonts, accent: accents, logo: logos, layout: layouts };
const defaultState = { ...productionDesign };
const storageKey = 'miniweb-design-explorer-v1';
const state = { ...defaultState };
let activeTab = 'font';
let device = 'desktop';
let frameReady = false;
let feedbackTimeout;
const query = new URLSearchParams(location.search);
let saved = {};
try {
  const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
  if (parsed && typeof parsed === 'object') saved = parsed;
} catch { /* Shared URLs still work when storage is unavailable or invalid. */ }
Object.keys(collections).forEach(key => {
  const candidate = query.get(key) || saved[key];
  if (collections[key].some(option => option.id === candidate)) state[key] = candidate;
});
const selected = key => collections[key].find(option => option.id === state[key]);
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = fontsUrl;
document.head.append(fontLink);

document.querySelector('#design-app').innerHTML = `
  <header class="lab-header"><a class="lab-brand" href="./">${logos[0].svg}<span>miniweb<span class="brand-dot">.</span></span></a><span class="header-rule"></span><span class="lab-title">Design explorer</span><span class="sandbox-badge">SANDBOX</span><div class="header-actions"><a class="original-link" href="./" target="_blank" rel="noopener">Original website ${icons.arrow}</a><button class="button button-dark" id="copy-direction">${icons.copy} Copy direction</button></div></header>
  <section class="directions" aria-labelledby="directions-title"><div class="directions-heading"><div><span class="section-label">FIND THE FEEL</span><h1 id="directions-title">One MiniWeb. Many directions.</h1></div><p>Start with a direction, then make it yours.<br/>Every change appears in the live preview below.</p></div><div class="preset-list" id="presets"></div></section>
  <main class="lab-workspace">
    <aside class="control-panel" aria-label="Design controls"><div class="control-heading"><div><span class="section-label">YOUR RECIPE</span><h2>Make it yours</h2></div><button class="icon-button" id="reset" aria-label="Reset to published design" title="Reset to published design">${icons.reset}</button></div><div class="customization-tabs" role="tablist" aria-label="Design settings"><button id="tab-font" role="tab" aria-controls="options" aria-selected="true" data-tab="font">Type</button><button id="tab-accent" role="tab" aria-controls="options" aria-selected="false" data-tab="accent" tabindex="-1">Color</button><button id="tab-logo" role="tab" aria-controls="options" aria-selected="false" data-tab="logo" tabindex="-1">Logo</button><button id="tab-layout" role="tab" aria-controls="options" aria-selected="false" data-tab="layout" tabindex="-1">Layout</button></div><div id="options" class="options" role="tabpanel" aria-labelledby="tab-font"></div><div class="recipe"><span class="section-label">CURRENT COMBINATION</span><div id="recipe-values"></div><div class="recipe-actions"><button class="text-button" id="shuffle">${icons.shuffle} Surprise me</button><button class="text-button" id="download-css">${icons.down} Save CSS</button></div></div></aside>
    <section class="preview-panel" aria-label="Live MiniWeb design preview"><div class="preview-toolbar"><div class="preview-caption"><span class="live-dot"></span><span>Live preview</span><span class="preview-separator">/</span><span id="direction-label">Custom direction</span></div><div class="device-switch" role="group" aria-label="Preview screen size"><button data-device="desktop" aria-pressed="true" title="Desktop, 1440 pixels" aria-label="Desktop preview">${icons.desktop}</button><button data-device="tablet" aria-pressed="false" title="Tablet, 820 pixels" aria-label="Tablet preview">${icons.tablet}</button><button data-device="mobile" aria-pressed="false" title="Mobile, 390 pixels" aria-label="Mobile preview">${icons.mobile}</button></div><span id="viewport-label">1440 PX</span></div><div class="preview-scroll" id="preview-scroll"><div class="preview-artboard" id="preview-artboard"><div class="preview-viewport" id="preview-viewport"><iframe id="site-preview" title="MiniWeb with your selected design" src="./?design-preview=1"></iframe></div></div><div class="preview-footnote"><span>Interactive preview. Try rotating the network or opening a site.</span><span>Changes stay in this sandbox.</span></div></div></section>
  </main>
  <div id="feedback" class="feedback" role="status" aria-live="polite"></div>
`;

function layoutDiagram(id) {
  return `<span class="layout-diagram diagram-${id}" aria-hidden="true"><i class="diagram-nav"></i><i class="diagram-title"></i><i class="diagram-copy"></i><i class="diagram-graph"><b></b><b></b><b></b><b></b><b></b></i></span>`;
}

function renderPresets() {
  const focusedPreset = document.activeElement?.dataset.preset;
  $('presets').innerHTML = presets.map(p => {
    const f = fonts.find(f => f.id === p.font);
    const a = accents.find(a => a.id === p.accent);
    const l = logos.find(l => l.id === p.logo);
    const active = Object.keys(collections).every(key => state[key] === p[key]);
    return `<button class="preset ${active ? 'selected' : ''}" data-preset="${p.id}" aria-pressed="${active}" style="--preset-accent:${a.accent};--preset-soft:${a.soft};--preset-bg:${a.background};--preset-ink:${a.ink}"><span class="preset-sample" style="font-family:${escape(f.heading)}">${l.svg}<span>miniweb.</span><span class="preset-swatch"></span></span><span class="preset-meta"><span>${escape(p.name)}</span><span class="preset-number">${String(presets.indexOf(p) + 1).padStart(2,'0')}</span></span><span class="preset-description">${escape(p.description)}</span></button>`;
  }).join('');
  if (focusedPreset) $('presets').querySelector(`[data-preset="${focusedPreset}"]`)?.focus({ preventScroll: true });
  $('presets').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    const preset = presets.find(p => p.id === button.dataset.preset);
    Object.keys(collections).forEach(key => state[key] = preset[key]);
    update();
    feedback(`${preset.name} applied. Mix and match any setting.`);
  }));
}

function renderOptions() {
  const groupDescription = {
    font: ['01 / TYPOGRAPHY', 'Set the voice.', 'From quiet and considered to technical and expressive.'],
    accent: ['02 / COLOR', 'Change the atmosphere.', 'Each accent comes with a matching background and ink color.'],
    logo: ['03 / IDENTITY', 'Find your mark.', 'Five original symbols for a small, connected web.'],
    layout: ['04 / COMPOSITION', 'Give it a structure.', 'Same content and graph. A different first impression.'],
  }[activeTab];
  $('options').setAttribute('aria-labelledby', `tab-${activeTab}`);
  $('options').innerHTML = `<div class="option-intro"><span class="section-label">${groupDescription[0]}</span><h3>${groupDescription[1]}</h3><p>${groupDescription[2]}</p></div><div class="option-list list-${activeTab}" role="group" aria-label="${activeTab} options">${collections[activeTab].map(option => {
    const active = state[activeTab] === option.id;
    let sample = '';
    if (activeTab === 'font') sample = `<span class="font-sample" style="font-family:${escape(option.heading)}">Ag</span><span class="option-info"><strong>${escape(option.name)}</strong><small>${escape(option.description)}</small></span>`;
    if (activeTab === 'accent') sample = `<span class="color-sample" style="background:${option.background};color:${option.accent};border-color:${option.soft}"><i style="background:${option.accent}"></i><i style="background:${option.soft}"></i><i style="background:${option.ink}"></i></span><span class="option-info"><strong>${escape(option.name)}</strong><small class="color-hex">${option.accent.toUpperCase()}</small></span>`;
    if (activeTab === 'logo') sample = `<span class="logo-sample">${option.svg}</span><span class="option-info"><strong>${escape(option.name)}</strong><small>${escape(option.description)}</small></span>`;
    if (activeTab === 'layout') sample = `${layoutDiagram(option.id)}<span class="option-info"><strong>${escape(option.name)}</strong><small>${escape(option.description)}</small></span>`;
    return `<button class="option ${active ? 'selected' : ''}" data-option="${option.id}" aria-pressed="${active}">${sample}<span class="option-check">${icons.check}</span></button>`;
  }).join('')}</div>`;
  $('options').querySelectorAll('[data-option]').forEach(button => button.addEventListener('click', () => {
    state[activeTab] = button.dataset.option;
    // Update buttons in place so keyboard focus stays on the chosen option.
    update({ renderControls: false });
    $('options').querySelectorAll('[data-option]').forEach(b => {
      b.classList.toggle('selected', b.dataset.option === state[activeTab]);
      b.setAttribute('aria-pressed', String(b.dataset.option === state[activeTab]));
    });
  }));
}


function applyPreview() {
  if (!frameReady) return;
  const doc = $('site-preview').contentDocument;
  if (!doc) return;
  if (!doc.getElementById('explorer-fonts')) {
    const link = doc.createElement('link');
    link.id = 'explorer-fonts';
    link.rel = 'stylesheet'; link.href = fontsUrl;
    doc.head.append(link);
  }
  applyDesign(doc, state);
  resizePreview();
}

function resizePreview() {
  const width = { desktop: 1440, tablet: 820, mobile: 390 }[device];
  const height = { desktop: 1100, tablet: 1210, mobile: 1370 }[device];
  const available = Math.max(280, $('preview-scroll').clientWidth - 56);
  const scale = Math.min(1, available / width);
  const frame = $('site-preview');
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  frame.style.transform = `scale(${scale})`;
  $('preview-viewport').style.width = `${width * scale}px`;
  $('preview-viewport').style.height = `${height * scale}px`;
  $('viewport-label').textContent = `${width} PX`;
  $('preview-artboard').dataset.device = device;
}

function update({ renderControls = true } = {}) {
  const color = selected('accent');
  document.documentElement.style.setProperty('--chosen-accent', color.accent);
  document.documentElement.style.setProperty('--chosen-soft', color.soft);
  const preset = presets.find(p => Object.keys(collections).every(key => state[key] === p[key]));
  $('direction-label').textContent = preset ? preset.name : 'Custom direction';
  $('recipe-values').innerHTML = Object.entries(collections).map(([key]) => `<div><span>${{font:'Typeface',accent:'Palette',logo:'Mark',layout:'Layout'}[key]}</span><strong>${escape(selected(key).name)}</strong></div>`).join('');
  renderPresets();
  if (renderControls) renderOptions();
  applyPreview();
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Optional persistence. */ }
  const parameters = new URLSearchParams(state);
  history.replaceState(null, '', `${location.pathname}?${parameters}`);
}

function feedback(message) {
  clearTimeout(feedbackTimeout);
  $('feedback').textContent = message;
  $('feedback').classList.add('visible');
  feedbackTimeout = setTimeout(() => $('feedback').classList.remove('visible'), 3500);
}

function setTab(tab, focus = false) {
  activeTab = tab;
  document.querySelectorAll('[data-tab]').forEach(button => {
    const active = button.dataset.tab === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
    if (active && focus) button.focus();
  });
  renderOptions();
}
document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => setTab(button.dataset.tab)));
document.querySelector('.customization-tabs').addEventListener('keydown', event => {
  const ids = Object.keys(collections);
  let next = ids.indexOf(activeTab);
  if (event.key === 'ArrowRight') next = (next + 1) % ids.length;
  else if (event.key === 'ArrowLeft') next = (next + ids.length - 1) % ids.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = ids.length - 1;
  else return;
  event.preventDefault(); setTab(ids[next], true);
});
document.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () => {
  device = button.dataset.device;
  document.querySelectorAll('[data-device]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.device === device)));
  resizePreview();
}));
$('reset').addEventListener('click', () => { Object.assign(state, defaultState); update(); feedback('Back to the published MiniWeb direction.'); });
$('shuffle').addEventListener('click', () => {
  Object.entries(collections).forEach(([key, options]) => state[key] = options[Math.floor(Math.random() * options.length)].id);
  update(); feedback('A fresh combination. See what you think.');
});
$('download-css').addEventListener('click', () => {
  const css = `@import url('${fontsUrl}');\n\n${createThemeCss(state)}`;
  const blob = new Blob([css], { type: 'text/css' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `miniweb-${state.font}-${state.accent}-${state.layout}.css`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback('Theme CSS saved. The logo choice is included in Copy direction.');
});
$('copy-direction').addEventListener('click', async () => {
  const text = `MiniWeb design direction\nTypeface: ${selected('font').name}\nPalette: ${selected('accent').name} (${selected('accent').accent})\nLogo: ${selected('logo').name}\nLayout: ${selected('layout').name}\nPreview: ${location.href}`;
  try { await navigator.clipboard.writeText(text); feedback('Direction copied. Paste it in our chat to choose this design.'); }
  catch {
    const file = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a'); link.href = url; link.download = 'miniweb-design-direction.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    feedback('Clipboard unavailable. Your direction was saved as a text file.');
  }
});
$('site-preview').addEventListener('load', () => { frameReady = true; applyPreview(); });
new ResizeObserver(resizePreview).observe($('preview-scroll'));
update();
