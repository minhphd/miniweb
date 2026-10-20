// The 37 primitives by skill family (the paper's primitive table), each with its span rule, its counts, and the
// site-agnostic guide that MiniWebGen distilled from the human demonstrations, drawn like the guide card of the
// paper's method figure. The data (src/data/primitives.json) loads when the catalog comes near the screen.
import { facts, escapeHtml as escape } from './structure-content.js';

const inline = text => escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');

function guideSection(section) {
  const items = tag => `<${tag}>${section.items.map(item => `<li>${inline(item)}</li>`).join('')}</${tag}>`;
  if (section.title === 'Done when') return `<div class="guide-row"><span class="guide-tag done">done</span><p>${inline(section.text || section.items.join(' '))}</p></div>`;
  if (section.title === 'Pitfalls') return `<div class="guide-block"><p class="guide-heading"><span class="guide-tag pitfall">pitfall</span></p>${items('ul')}</div>`;
  return `<div class="guide-block"><p class="guide-heading">${escape(section.title)}</p>${section.items.length ? items(section.ordered ? 'ol' : 'ul') : `<p>${inline(section.text)}</p>`}</div>`;
}

function detail(primitive, family) {
  const guide = primitive.guide;
  const generated = primitive.generated === null
    ? 'none: reasoning steps stay with the base model'
    : `${primitive.generated} verified trajectories`;
  return `<div class="catalog-title"><code class="primitive solid fam-${primitive.family}">${escape(primitive.name)}</code><span>${escape(family.name)}</span></div>
    <p class="catalog-description">${inline(primitive.description)}</p>
    <dl class="catalog-facts">
      <div><dt>Span</dt><dd>${escape(primitive.span[0])} <span aria-label="to">→</span> ${escape(primitive.span[1])}</dd></div>
      <div><dt>Human tasks</dt><dd>${primitive.tasks} instances on ${primitive.sites} sites</dd></div>
      <div><dt>MiniWebGen</dt><dd>${generated}</dd></div>
    </dl>
    ${guideCard(guide)}`;
}

/** A MiniWebGen guide, drawn like the guide card of the paper's method figure. */
export function guideCard(guide) {
  if (!guide) return '';
  return `<div class="guide-card"><div class="guide-header"><span>guide <i>G<sub>m</sub></i></span><span class="guide-scope">site-agnostic</span></div>
    <div class="guide-body"><p class="guide-summary">${inline(guide.summary)}</p>${guide.sections.map(guideSection).join('')}${guide.note ? `<p class="guide-note">${inline(guide.note)}</p>` : ''}</div></div>`;
}

function render(frame, catalog, selected) {
  const primitive = catalog.primitives.find(p => p.name === selected);
  const family = catalog.families.find(f => f.id === primitive.family);
  frame.innerHTML = `<div class="showcase-head"><p class="showcase-title">The ${catalog.primitives.length} primitives <span>select one to see its guide</span></p></div>
    <div class="catalog">
      <div class="catalog-families">${catalog.families.map(f => {
        const members = catalog.primitives.filter(p => p.family === f.id);
        return `<div class="catalog-family fam-${f.id}"><p class="catalog-family-name">${escape(f.name)}<b>${members.length}</b></p><div class="catalog-chips">${members.map(p => `<button class="primitive-button fam-${f.id}" data-primitive="${escape(p.name)}" aria-pressed="${p.name === selected}" title="${p.tasks} instances in the human tasks">${escape(p.name)}<small>${p.tasks}</small></button>`).join('')}</div></div>`;
      }).join('')}<p class="catalog-key">Numbers: instances in the ${facts.tasks} human tasks.</p></div>
      <div class="catalog-detail" aria-live="polite">${detail(primitive, family)}</div>
    </div>`;
}

export function initializePrimitiveCatalog() {
  const container = document.querySelector('[data-figure="primitives"]');
  if (!container) return;
  const frame = document.createElement('div');
  frame.className = 'showcase-frame catalog-frame';
  frame.innerHTML = '<p class="showcase-title">Loading the primitives…</p>';
  container.prepend(frame);
  const observer = new IntersectionObserver(async entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    const catalog = (await import('./data/primitives.json')).default;
    let selected = 'filter_by_slider';
    render(frame, catalog, selected);
    frame.addEventListener('click', event => {
      const button = event.target.closest('[data-primitive]');
      if (!button) return;
      selected = button.dataset.primitive;
      render(frame, catalog, selected);
      frame.querySelector(`[data-primitive="${CSS.escape(selected)}"]`)?.focus({ preventScroll: true });
    });
  }, { rootMargin: '600px 0px' });
  observer.observe(container);
}
