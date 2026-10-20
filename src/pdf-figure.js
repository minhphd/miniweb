// Paper figures drawn from the paper's own PDF with PDF.js, at the screen's pixel density, so they stay as sharp as
// the PDF at any width or zoom. The SVG <img> inside each figure shows until the PDF is drawn, and stays if it cannot be.
const maxPixels = 4096;
let pdfjs;
const loadPdfjs = () => pdfjs ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')])
  .then(([lib, worker]) => { lib.GlobalWorkerOptions.workerSrc = worker.default; return lib; });

async function draw(holder) {
  const fallback = holder.querySelector('img');
  const lib = await loadPdfjs();
  const pdf = await lib.getDocument({ url: holder.dataset.pdf, isEvalSupported: false }).promise;
  const page = await pdf.getPage(1);
  const canvas = document.createElement('canvas');
  canvas.className = 'pdf-canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', fallback?.alt || '');
  let task, pending;
  const render = async () => {
    const width = holder.clientWidth;
    if (!width) return;
    const natural = page.getViewport({ scale: 1 });
    const scale = Math.min(width * (window.devicePixelRatio || 1), maxPixels) / natural.width;
    const viewport = page.getViewport({ scale });
    const next = document.createElement('canvas');
    next.width = Math.round(viewport.width);
    next.height = Math.round(viewport.height);
    task?.cancel();
    task = page.render({ canvasContext: next.getContext('2d'), viewport });
    try { await task.promise; } catch (error) { if (error?.name === 'RenderingCancelledException') return; throw error; }
    canvas.width = next.width;
    canvas.height = next.height;
    canvas.getContext('2d').drawImage(next, 0, 0);
    if (!canvas.isConnected) { fallback?.after(canvas); if (fallback) fallback.hidden = true; }
  };
  await render();
  // Redraw when the figure's width or the pixel density (browser zoom, another screen) changes.
  new ResizeObserver(() => { clearTimeout(pending); pending = setTimeout(render, 150); }).observe(holder);
  const watchDensity = () => matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', () => { render(); watchDensity(); }, { once: true });
  watchDensity();
}

export function initializePdfFigures() {
  const holders = document.querySelectorAll('[data-pdf]');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    draw(entry.target).catch(error => console.warn('PDF figure kept its SVG fallback:', error));
  }), { rootMargin: '800px 0px' });
  holders.forEach(holder => observer.observe(holder));
}
