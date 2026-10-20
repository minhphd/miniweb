// Motion for the figures: data that moves to its value, processes that play out in order. Everything here is skipped
// when the reader asks for reduced motion, and nothing is hidden unless the script that reveals it is running.
const query = matchMedia('(prefers-reduced-motion: reduce)');
export const reduced = () => query.matches;
const ease = 'cubic-bezier(.2,.7,.2,1)';

/** Web Animations API, or nothing under reduced motion. */
export function animate(element, keyframes, options = {}) {
  if (!element || reduced() || !element.animate) return null;
  return element.animate(keyframes, { duration: 520, easing: ease, fill: 'backwards', ...options });
}

/** Each element in turn, `gap` ms apart. */
export function stagger(elements, keyframes, { gap = 70, delay = 0, ...options } = {}) {
  [...elements].forEach((element, i) => animate(element, keyframes, { delay: delay + i * gap, ...options }));
}

/** A number counting up to its value; `format` renders it (the final text is set first, so it is right if skipped). */
export function countUp(element, value, format, { duration = 700, delay = 0 } = {}) {
  if (!element) return;
  element.textContent = format(value);
  if (reduced()) return;
  const start = performance.now() + delay;
  const tick = now => {
    const t = Math.min(1, Math.max(0, (now - start) / duration));
    element.textContent = format(value * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Run `play` the first time `element` reaches the upper four fifths of the screen (at once if it already has):
    a top-edge test, so it works for figures taller than the screen. */
export function whenVisible(element, play) {
  if (!element) return;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    play();
  }, { rootMargin: '0px 0px -20% 0px' });
  observer.observe(element);
}

/** Figures below the fold rise into place as they arrive. Elements already on screen are left alone. */
export function revealOnScroll(selector) {
  if (reduced()) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    entry.target.classList.remove('reveal-pending');
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll(selector).forEach(element => {
    if (element.getBoundingClientRect().top < innerHeight) return;
    element.classList.add('reveal-pending');
    observer.observe(element);
  });
}

/** Dumbbell rows (`.gain-row`): the second dot travels from the first to its value, the bar grows behind it in the
    direction of the change, and the gain counts up. */
export function playDumbbells(root, { delay = 0 } = {}) {
  root.querySelectorAll('.gain-row').forEach((row, i) => {
    const [from, to] = ['base', 'ours'].map(k => parseFloat(row.querySelector(`.gain-dot.${k}`)?.style.left));
    const link = row.querySelector('.gain-link');
    const value = row.querySelector('.gain-value');
    const at = delay + i * 70;
    if (Number.isNaN(from) || Number.isNaN(to)) return;
    animate(row.querySelector('.gain-dot.base'), [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.3)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { duration: 280, delay: at });
    animate(row.querySelector('.gain-dot.ours'), [{ left: `${from}%`, opacity: 0 }, { left: `${from}%`, opacity: 1, offset: 0.08 }, { left: `${to}%`, opacity: 1 }], { duration: 760, delay: at + 180 });
    if (link) {
      link.style.transformOrigin = to >= from ? 'left center' : 'right center';
      animate(link, [{ transform: 'translateY(-50%) scaleX(0)' }, { transform: 'translateY(-50%) scaleX(1)' }], { duration: 760, delay: at + 180 });
    }
    if (value) {
      const text = value.textContent.trim();
      const sign = text[0] === '−' || text[0] === '-' ? '−' : '+';
      const decimals = (text.split('.')[1] || '').length;
      countUp(value, Math.abs(parseFloat(text.replace('−', '-'))), v => `${sign}${v.toFixed(decimals)}`, { delay: at + 180, duration: 760 });
    }
  });
}
