import { fonts, accents, logos, layouts } from './design-options.js';

export const productionDesign = Object.freeze({
  font: 'mono', accent: 'paper-blue', logo: 'orbit', layout: 'editorial',
});
const choices = { font: fonts, accent: accents, logo: logos, layout: layouts };

export function createThemeCss(design = productionDesign) {
  const selected = key => {
    const option = choices[key].find(option => option.id === design[key]);
    if (!option) throw new Error(`Unknown ${key}: ${design[key]}`);
    return option;
  };
  const font = selected('font');
  const color = selected('accent');
  const layout = selected('layout');
  const base = `/* MiniWeb design direction: ${font.name} / ${color.name} / ${selected('logo').name} / ${layout.name} */
:root {
  --design-heading: ${font.heading};
  --design-body: ${font.body};
  --design-accent: ${color.accent};
  --design-soft: ${color.soft};
  --design-background: ${color.background};
  --design-ink: ${color.ink};
  --design-muted: ${color.muted || 'color-mix(in srgb, var(--design-ink) 72%, var(--design-background))'};
  --design-tint: color-mix(in srgb, var(--design-soft) 45%, #fff);
  --design-hover: color-mix(in srgb, var(--design-accent) 87%, #000);
  --ink: var(--design-ink);
  --muted: var(--design-muted);
  --green: var(--design-accent);
  --accent: var(--design-soft);
  --line: color-mix(in srgb, var(--design-accent) 16%, var(--design-background));
  font-family: var(--design-body);
  color: var(--design-ink);
  background: var(--design-background);
}
body { background: var(--design-background); color: var(--design-ink); }
.brand, .intro h1, .detail-heading h2, .no-results h2 { font-family: var(--design-heading); }
.brand-mark, .brand-period, .intro h1 span, .eyebrow, .detail-bottom a { color: var(--design-accent); }
.intro p, .header-caption { color: var(--design-muted); }
.brand-mark { width: 33px; height: 33px; }
.brand-mark svg { width: 33px; height: 33px; }
.status-dot { background: var(--design-accent); }
.playground-link { background: var(--design-accent); border-color: var(--design-accent); color: #fff; }
.playground-link:hover { background: var(--design-hover); }
.explorer { background: #fff; border-color: var(--line); box-shadow: 0 5px 20px color-mix(in srgb, var(--design-accent) 7%, transparent); }
.explorer-toolbar, .explorer-caption, .graph-controls, .detail-panel { background: color-mix(in srgb, var(--design-background) 35%, #fff); border-color: var(--line); }
.network-pane { background-color: var(--design-background); background-image: radial-gradient(color-mix(in srgb, var(--design-accent) 18%, var(--design-background)) 1px, transparent 1px); }
.network-pane::after { box-shadow: inset 0 0 90px 15px color-mix(in srgb, var(--design-background) 55%, transparent); }
.view-switch, .view-tab.active, .features span { background: var(--design-soft); color: var(--design-accent); border-color: var(--line); }
.view-tab.active { background: #fff; box-shadow: 0 1px 4px color-mix(in srgb, var(--design-ink) 8%, transparent); }
.node-name, .directory-card-name { color: var(--design-ink); }
.graph-node { border-color: color-mix(in srgb, var(--design-accent) 35%, #fff); box-shadow: 0 3px 6px color-mix(in srgb, var(--design-ink) 7%, transparent); }
.graph-node:hover, .graph-node.is-selected, .graph-node:focus-visible { border-color: var(--design-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--design-accent) 25%, transparent); }
.graph-node.is-connected { border-color: var(--design-accent); }
.stage-label, .interaction-hint { background: color-mix(in srgb, var(--design-background) 88%, transparent); color: var(--design-muted); }
.explorer-caption, .page-footer, .graph-controls .icon, #zoom-level { color: var(--design-muted); }
.detail-heading h2 { color: var(--design-ink); }
.detail-description { color: var(--design-muted); }
.site-monogram { color: var(--design-accent); background: var(--design-soft); border-color: var(--line); }
.header-caption, .search-field, .search-field kbd, .category-select select, .node-preview-window, .live-browser, .browser-toolbar, .directory-card, .directory-card-info { border-color: var(--line); }
.view-tab, .search-field .icon, .search-field input::placeholder, .search-field kbd, .category-select select, .node-domain, .label-separator, .hint-dot, .caption-index, #connection-note, .dimension-label, .detail-eyebrow, .detail-eyebrow span, .category-tag, .browser-address, .detail-bottom, .load-help, .no-results p { color: var(--design-muted); }
.icon-button, .directory-card-name .icon, .no-results>.icon, .text-button { color: var(--design-accent); }
.search-field:focus-within { border-color: var(--design-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--design-accent) 25%, transparent); }
.graph-controls button:hover, .icon-button:hover { background: var(--design-soft); }
.graph-controls { box-shadow: 0 2px 5px color-mix(in srgb, var(--design-ink) 3%, transparent); }
.browser-toolbar, .directory-thumb, .node-preview-window { background: var(--design-tint); }
.browser-dots i, .control-divider { background: var(--line); }
.directory-card:hover, .directory-card.selected { border-color: var(--design-accent); box-shadow: 0 2px 8px color-mix(in srgb, var(--design-accent) 12%, transparent); }
*:focus-visible { outline-color: var(--design-accent); }
`;
  const variants = {
    center: `/* Centered layout */
.intro { text-align: center; padding: 49px 0 34px; }
.intro h1 { font-weight: 500; }
`,
    editorial: `/* Editorial layout */
@media (min-width: 761px) {
  .site-header { height: 82px; }
  .intro { text-align: left; padding: 42px 0 35px; display: grid; grid-template-columns: 1.5fr 1fr; column-gap: 50px; align-items: end; }
  .eyebrow { grid-column: 1 / -1; justify-content: flex-start; margin-bottom: 16px; }
  .intro h1 { margin: 0; font-size: clamp(40px, 4.3vw, 65px); line-height: 1.08; font-weight: 400; }
  .intro h1 span { display: block; }
  .intro p { max-width: 310px; padding-bottom: 4px; line-height: 1.8; font-size: 14px; }
  .explorer { border-radius: 2px; }
  .network-pane { height: 550px; }
  .brand { letter-spacing: -1px; }
}
`,
    split: `/* Split layout */
@media (min-width: 1101px) {
  main { position: relative; padding-top: 44px; }
  .intro { position: absolute; left: 5%; top: 103px; text-align: left; width: 24%; padding: 0; }
  .eyebrow { justify-content: flex-start; font-size: 8px; letter-spacing: .8px; line-height: 1.8; }
  .intro h1 { font-size: clamp(38px, 4vw, 60px); line-height: 1.12; letter-spacing: -2px; margin: 25px 0 22px; font-weight: 500; }
  .intro h1 span { display: block; }
  .intro p { line-height: 1.9; max-width: 260px; font-size: 13px; }
  .explorer { margin-left: 31%; }
  .explorer-toolbar { padding: 0 13px; gap: 8px; }
  .search-field { width: 150px; }
  .filter-tools { gap: 7px; }
  .category-select select { max-width: 135px; }
  .network-pane { height: 640px; }
  .interaction-hint { font-size: 8px; }
  .graph-bottom { left: 16px; right: 16px; }
  .graph-controls button { width: 22px; }
  #connection-note { display: none; }
  .page-footer { margin-left: 31%; }
}
`,
  };
  return base + variants[layout.id];
}


/** One replaceable style element keeps explorer choices isolated and reversible. */
export function applyDesign(doc, design = productionDesign) {
  let style = doc.getElementById('miniweb-theme');
  if (!style) {
    style = doc.createElement('style');
    style.id = 'miniweb-theme';
    doc.head.append(style);
  }
  style.textContent = createThemeCss(design);
  const logo = logos.find(logo => logo.id === design.logo);
  if (!logo) throw new Error(`Unknown logo: ${design.logo}`);
  const mark = doc.querySelector('.brand-mark');
  if (mark) mark.innerHTML = logo.svg;
  const color = accents.find(accent => accent.id === design.accent);
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', color.background);
  doc.documentElement.dataset.design = `${design.font}-${design.accent}-${design.logo}-${design.layout}`;
}
