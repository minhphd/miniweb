import { HUB_IDS, buildEdges, clamp, distributeSites, projectPoint, rotatePoint } from './graph-math.js';

/** A DOM/canvas 3D network: real HTML controls remain accessible at every depth. */
export class MiniWebGraph {
  constructor({ container, sites, onSelect = () => {}, onHover = () => {}, onStats = () => {}, reducedMotion = false }) {
    this.container = container;
    this.sites = sites;
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.onStats = onStats;
    this.reducedMotion = reducedMotion;
    this.positions = distributeSites(sites);
    this.edges = buildEdges(sites, this.positions);
    this.visible = sites.map(() => true);
    this.selectedId = null;
    this.hoveredId = null;
    this.yaw = 0;
    this.pitch = 0;
    this.zoom = 1;
    this.velocity = { x: 0, y: 0 };
    this.paused = reducedMotion;
    this.pointers = new Map();
    this.dragged = false;
    this.ignoreClickUntil = 0;
    this.lastInteraction = performance.now();
    this.dirty = true;
    this.abortController = new AbortController();
    this.previousTime = 0;
    this.originalTabIndex = container.getAttribute('tabindex');
    this.originalTouchAction = container.style.touchAction;
    container.tabIndex = 0;
    container.style.touchAction = 'none';
    container.setAttribute('aria-label', 'Interactive MiniWeb site network. Drag to rotate, scroll to zoom, or use arrow keys. Tab to explore sites.');

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'graph-edges';
    this.canvas.setAttribute('aria-hidden', 'true');
    Object.assign(this.canvas.style, { position: 'absolute', inset: '0', pointerEvents: 'none', width: '100%', height: '100%' });
    this.context = this.canvas.getContext('2d');
    this.nodesLayer = document.createElement('div');
    this.nodesLayer.className = 'graph-nodes';
    Object.assign(this.nodesLayer.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
    container.append(this.canvas, this.nodesLayer);
    this.nodes = sites.map((site) => this.createNode(site));
    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.emitStats();
    this.frame = requestAnimationFrame((time) => this.animate(time));
  }

  listen(target, event, callback, options = {}) {
    target.addEventListener(event, callback, { ...options, signal: this.abortController.signal });
  }

  createNode(site) {
    const displayName = site.shortName || site.name;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `graph-node${HUB_IDS.has(site.id) ? ' is-hub' : ''}`;
    button.dataset.siteId = site.id;
    button.setAttribute('aria-label', `Explore ${displayName}${site.category ? `, ${site.category}` : ''}`);
    button.setAttribute('aria-pressed', 'false');
    Object.assign(button.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'auto', transformOrigin: '50% 50%', willChange: 'transform' });
    const previewWindow = document.createElement('span');
    previewWindow.className = 'node-preview-window';
    previewWindow.setAttribute('aria-hidden', 'true');
    previewWindow.style.pointerEvents = 'none';
    const preview = document.createElement('img');
    preview.className = 'node-image node-preview';
    preview.src = `${import.meta.env.BASE_URL}previews/thumbnails/${site.id}.webp`;
    preview.alt = '';
    preview.width = 550;
    preview.height = 350;
    preview.decoding = 'async';
    preview.draggable = false;
    preview.style.pointerEvents = 'none';
    previewWindow.append(preview);
    const labels = document.createElement('span');
    labels.className = 'node-labels';
    const name = document.createElement('span');
    name.className = 'node-name';
    name.textContent = displayName;
    const domain = document.createElement('span');
    domain.className = 'node-domain';
    domain.textContent = site.domain || new URL(site.url).hostname;
    labels.append(name, domain);
    button.append(previewWindow, labels);
    this.listen(button, 'click', (event) => {
      event.stopPropagation();
      if (event.detail !== 0 && performance.now() < this.ignoreClickUntil) return;
      this.setSelected(site.id);
      this.onSelect(site);
    });
    this.listen(button, 'pointerenter', () => {
      if (!this.pointers.size) this.setHover(site.id);
    });
    this.listen(button, 'pointerleave', () => this.setHover(null));
    this.listen(button, 'focus', () => {
      this.setHover(site.id);
      this.lastInteraction = performance.now();
    });
    this.listen(button, 'blur', () => this.setHover(null));
    this.listen(button, 'dragstart', (event) => event.preventDefault());
    this.nodesLayer.append(button);
    return button;
  }

  bindEvents() {
    this.listen(this.container, 'pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.velocity = { x: 0, y: 0 };
      this.lastInteraction = performance.now();
      if (this.pointers.size === 1) {
        this.dragged = false;
        this.dragOrigin = { x: event.clientX, y: event.clientY };
      }
      if (this.pointers.size === 2) {
        const points = [...this.pointers.values()];
        this.pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        this.dragged = true;
      }
      // Capture on the original card so a simple pointer click still targets it.
      event.target.setPointerCapture?.(event.pointerId);
      this.container.classList.add('is-dragging');
    });
    this.listen(this.container, 'pointermove', (event) => {
      const previous = this.pointers.get(event.pointerId);
      if (!previous) return;
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.lastInteraction = performance.now();
      if (this.pointers.size >= 2) {
        const points = [...this.pointers.values()];
        const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        if (this.pinchDistance > 0) this.setZoom((distance / this.pinchDistance - 1) * this.zoom);
        this.pinchDistance = distance;
        this.dragged = true;
        this.ignoreClickUntil = performance.now() + 400;
        return;
      }
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      if (Math.hypot(event.clientX - this.dragOrigin.x, event.clientY - this.dragOrigin.y) > 4) this.dragged = true;
      if (!this.dragged) return;
      this.setHover(null);
      this.yaw += dx * 0.0045;
      this.pitch = clamp(this.pitch - dy * 0.0045, -1.2, 1.2);
      this.velocity = { x: dx * 0.002, y: -dy * 0.002 };
      this.ignoreClickUntil = performance.now() + 400;
      this.dirty = true;
    });
    const endPointer = (event) => {
      if (!this.pointers.has(event.pointerId)) return;
      this.pointers.delete(event.pointerId);
      this.lastInteraction = performance.now();
      if (this.dragged) this.ignoreClickUntil = performance.now() + 400;
      if (this.pointers.size === 1) this.dragOrigin = { ...this.pointers.values().next().value };
      if (!this.pointers.size) {
        this.container.classList.remove('is-dragging');
        if (this.reducedMotion) this.velocity = { x: 0, y: 0 };
      }
    };
    this.listen(this.container, 'pointerup', endPointer);
    this.listen(this.container, 'pointercancel', endPointer);
    this.listen(this.container, 'lostpointercapture', endPointer);
    this.listen(this.container, 'wheel', (event) => {
      event.preventDefault();
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      this.setZoom(-clamp(delta, -120, 120) * 0.0013);
    }, { passive: false });
    this.listen(this.container, 'keydown', (event) => {
      const key = event.key;
      const amount = event.shiftKey ? 0.18 : 0.08;
      if (key === 'ArrowLeft') this.yaw -= amount;
      else if (key === 'ArrowRight') this.yaw += amount;
      else if (key === 'ArrowUp') this.pitch = clamp(this.pitch + amount, -1.2, 1.2);
      else if (key === 'ArrowDown') this.pitch = clamp(this.pitch - amount, -1.2, 1.2);
      else if (key === '+' || key === '=') this.setZoom(0.12);
      else if (key === '-') this.setZoom(-0.12);
      else if (key === 'Home' && event.target === this.container) this.reset();
      else return;
      event.preventDefault();
      this.velocity = { x: 0, y: 0 };
      this.lastInteraction = performance.now();
      this.dirty = true;
    });
    this.listen(this.container, 'click', (event) => {
      if (event.target.closest('.graph-node')) return;
      if (performance.now() < this.ignoreClickUntil) return;
      this.setSelected(null);
      this.onSelect(null);
    });
    this.listen(document, 'visibilitychange', () => {
      this.previousTime = 0;
      this.dirty = true;
    });
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.dirty = true;
  }

  setHover(id) {
    if (this.hoveredId === id) return;
    this.hoveredId = id;
    this.onHover(id ? this.sites.find((site) => site.id === id) : null);
    this.dirty = true;
  }

  setSelected(id) {
    this.selectedId = id;
    this.lastInteraction = performance.now();
    this.nodes.forEach((node, index) => {
      const selected = this.sites[index].id === id;
      node.classList.toggle('is-selected', selected);
      node.setAttribute('aria-pressed', String(selected));
    });
    this.dirty = true;
  }

  setFilter(predicate) {
    this.visible = this.sites.map((site) => Boolean(predicate(site)));
    this.nodes.forEach((node, index) => {
      node.hidden = !this.visible[index];
      node.style.display = this.visible[index] ? '' : 'none';
      node.tabIndex = this.visible[index] ? 0 : -1;
    });
    if (this.hoveredId && !this.sites.some((site, index) => site.id === this.hoveredId && this.visible[index])) this.setHover(null);
    this.dirty = true;
    this.emitStats();
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    if (this.paused) this.velocity = { x: 0, y: 0 };
    this.emitStats();
  }

  setZoom(delta) {
    this.zoom = clamp(this.zoom + delta, 0.55, 2.2);
    this.lastInteraction = performance.now();
    this.dirty = true;
    this.emitStats();
  }

  reset() {
    this.yaw = 0;
    this.pitch = 0;
    this.zoom = 1;
    this.velocity = { x: 0, y: 0 };
    this.lastInteraction = performance.now();
    this.dirty = true;
    this.emitStats();
  }

  emitStats() {
    this.onStats({
      visible: this.visible.filter(Boolean).length,
      total: this.sites.length,
      edges: this.edges.filter(([a, b]) => this.visible[a] && this.visible[b]).length,
      zoom: this.zoom,
      paused: this.paused,
    });
  }

  animate(time) {
    if (this.destroyed) return;
    const elapsed = this.previousTime ? Math.min((time - this.previousTime) / 16.667, 3) : 1;
    this.previousTime = time;
    if (!document.hidden && !this.pointers.size) {
      if (Math.abs(this.velocity.x) + Math.abs(this.velocity.y) > 0.0001) {
        this.yaw += this.velocity.x * elapsed;
        this.pitch = clamp(this.pitch + this.velocity.y * elapsed, -1.2, 1.2);
        this.velocity.x *= Math.pow(0.93, elapsed);
        this.velocity.y *= Math.pow(0.93, elapsed);
        this.dirty = true;
      } else if (!this.paused && !this.hoveredId && !this.selectedId && time - this.lastInteraction > 3000) {
        this.yaw += 0.00015 * elapsed;
        this.dirty = true;
      }
    }
    if (this.dirty && !document.hidden) this.render();
    this.frame = requestAnimationFrame((nextTime) => this.animate(nextTime));
  }

  render() {
    this.dirty = false;
    const activeId = this.hoveredId || this.selectedId;
    const activeIndex = this.sites.findIndex((site) => site.id === activeId);
    const neighbors = new Set();
    if (activeIndex >= 0) this.edges.forEach(([a, b]) => {
      if (a === activeIndex) neighbors.add(b);
      if (b === activeIndex) neighbors.add(a);
    });
    const points = this.positions.map((point, index) => projectPoint(
      rotatePoint(point, this.yaw, this.pitch), this.width, this.height, this.zoom, HUB_IDS.has(this.sites[index].id),
    ));
    this.nodes.forEach((node, index) => {
      if (!this.visible[index]) return;
      const point = points[index];
      const active = index === activeIndex;
      const scale = point.scale * (active ? 1.12 : 1);
      node.style.transform = `translate3d(${point.x.toFixed(2)}px,${point.y.toFixed(2)}px,0) translate(-50%,-50%) scale(${scale.toFixed(4)})`;
      node.style.zIndex = String(active ? 1000 : 10 + Math.round(point.depth * 100));
      node.style.opacity = String(active || neighbors.has(index) ? 1 : 0.53 + point.depth * 0.47);
      node.style.setProperty('--node-depth', point.depth.toFixed(3));
      node.classList.toggle('is-connected', neighbors.has(index));
      node.classList.toggle('is-hovered', this.sites[index].id === this.hoveredId);
    });
    const ctx = this.context;
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    const drawEdge = (a, b, highlighted) => {
      const start = points[a];
      const end = points[b];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      const depth = (start.depth + end.depth) / 2;
      ctx.strokeStyle = highlighted ? `rgba(66, 115, 84, ${0.38 + depth * 0.22})` : `rgba(122, 130, 117, ${0.14 + depth * 0.18})`;
      ctx.lineWidth = highlighted ? 1.15 : 0.65;
      ctx.stroke();
    };
    this.edges.forEach(([a, b]) => {
      if (this.visible[a] && this.visible[b] && a !== activeIndex && b !== activeIndex) drawEdge(a, b, false);
    });
    if (activeIndex >= 0) this.edges.forEach(([a, b]) => {
      if (this.visible[a] && this.visible[b] && (a === activeIndex || b === activeIndex)) drawEdge(a, b, true);
    });
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.abortController.abort();
    this.resizeObserver.disconnect();
    this.canvas.remove();
    this.nodesLayer.remove();
    if (this.originalTabIndex === null) this.container.removeAttribute('tabindex');
    else this.container.setAttribute('tabindex', this.originalTabIndex);
    this.container.style.touchAction = this.originalTouchAction;
    this.container.classList.remove('is-dragging');
  }
}
