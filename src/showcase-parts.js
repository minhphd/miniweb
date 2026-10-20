// Pieces shared by the interactive figures: pagers, step strips, and screenshots with the action marked on them.
import { escapeHtml as escape } from './structure-content.js';

export const url = path => `${import.meta.env.BASE_URL}${path}`;
export const chip = (name, family) => `<code class="primitive fam-${family}">${escape(name)}</code>`;
export const mapCredit = ids => ids.includes('map-services') ? '<span class="showcase-credit">Map data © OpenStreetMap contributors</span>' : '';
export const arrow = direction => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${direction < 0 ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'}"/></svg>`;

export function pager(label, index, count) {
  return `<div class="showcase-pager" role="group" aria-label="${label}"><button data-move="-1" aria-label="Previous ${label.toLowerCase()}" ${index === 0 ? 'disabled' : ''}>${arrow(-1)}</button><span>${label} ${index + 1} of ${count}</span><button data-move="1" aria-label="Next ${label.toLowerCase()}" ${index === count - 1 ? 'disabled' : ''}>${arrow(1)}</button></div>`;
}

export function stepStrip(steps, families, selected, label) {
  return `<div class="step-strip" style="--steps:${steps.length}" role="group" aria-label="${label}">${steps.map((step, i) => `<button class="step-box ${families[i] ? `fam-${families[i]}` : 'fam-none'} ${i === selected ? 'is-selected' : ''}" data-step="${i}" aria-label="Step ${i + 1}: ${escape(step.action)}" aria-pressed="${i === selected}">${step.final ? '✓' : i + 1}</button>`).join('')}</div>`;
}

export function screenshot(step, alt) {
  const marker = step.point ? `<span class="step-marker" style="left:${step.point[0] * 100}%;top:${step.point[1] * 100}%"></span>` : '';
  // The drag path in the screenshot's own pixels, so that it can draw itself along its length.
  const [w, h] = [step.w || 1280, step.h || 800];
  const path = step.path ? `<svg class="step-path" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline pathLength="1" points="${step.path.map(([x, y]) => `${(x * w).toFixed(1)},${(y * h).toFixed(1)}`).join(' ')}" /></svg>` : '';
  return `<div class="showcase-screen" style="aspect-ratio:${step.w || 16} / ${step.h || 10}">${step.image ? `<img src="${url(step.image)}" width="${step.w}" height="${step.h}" alt="${escape(alt)}" decoding="async" />` : '<span class="screen-missing">No screenshot recorded for this step</span>'}${path}${marker}</div>`;
}

export function preload(steps, i) {
  [i + 1, i + 2].forEach(k => { if (steps[k]?.image) new Image().src = url(steps[k].image); });
}

export function playButton(playing, what = 'the steps') {
  return `<button class="play-button" data-play aria-pressed="${playing}" aria-label="${playing ? 'Pause' : 'Play'} ${what}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${playing ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>' : '<path d="M7 5v14l12-7z"/>'}</svg>${playing ? 'Pause' : 'Play'}</button>`;
}

/** Previous / next, the position, and (when `playing` is given) a play button that steps on by itself. */
export function stepControls(index, count, label = 'Step', playing) {
  return `<div class="step-controls"><button data-step-move="-1" aria-label="Previous ${label.toLowerCase()}" ${index === 0 ? 'disabled' : ''}>${arrow(-1)}</button><span class="step-count">${label} ${index + 1} / ${count}</span><button data-step-move="1" aria-label="Next ${label.toLowerCase()}" ${index === count - 1 ? 'disabled' : ''}>${arrow(1)}</button>${playing === undefined ? '' : playButton(playing)}</div>`;
}

/** Step on by itself every `interval` ms until the last step; returns a function that stops it. */
export function autoplay(advance, interval = 1500) {
  const timer = setInterval(() => { if (!advance()) clearInterval(timer); }, interval);
  return () => clearInterval(timer);
}
