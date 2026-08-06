import { TILE_SIZE } from './constants.js';
import { project } from './projection.js';
import { TileScheduler } from './tile-scheduler.js';

function createGroup(zoom) {
  const element = document.createElement('div');
  element.className = 'merlin-v20-tile-group';
  element.dataset.zoom = String(zoom);
  return { zoom, element, records: new Map(), loaded: 0, visible: new Set(), startedAt: Date.now() };
}

function tileRange(viewport, zoom) {
  const count = 2 ** zoom;
  const center = project(viewport.center, zoom);
  const halfWidth = viewport.size.width / 2;
  const halfHeight = viewport.size.height / 2;
  return {
    count, center, halfWidth, halfHeight,
    minX: Math.floor((center.x - halfWidth) / TILE_SIZE) - 1,
    maxX: Math.floor((center.x + halfWidth) / TILE_SIZE) + 1,
    minY: Math.max(0, Math.floor((center.y - halfHeight) / TILE_SIZE) - 1),
    maxY: Math.min(count - 1, Math.floor((center.y + halfHeight) / TILE_SIZE) + 1)
  };
}

export class TileLayer {
  constructor(container, source) {
    this.container = container;
    this.source = source;
    this.scheduler = new TileScheduler({ maximumConcurrent: 8 });
    this.active = null;
    this.previous = null;
    this.transitionTimer = null;
    this.lastViewport = null;
  }

  setSource(source) {
    if (this.source?.id === source?.id) return;
    this.source = source;
    this.clear();
  }

  render(viewport) {
    this.lastViewport = viewport;
    if (!this.source?.enabled) {
      this.clear();
      return;
    }
    const zoom = Math.max(0, Math.floor(viewport.zoom));
    if (!this.active || this.active.zoom !== zoom) this.#startZoom(zoom);
    this.#renderActive(this.active, viewport);
    this.#renderPrevious(this.previous, viewport);
  }

  #renderActive(group, viewport) {
    if (!group) return;
    const range = tileRange(viewport, group.zoom);
    const visible = new Set();
    for (let y = range.minY; y <= range.maxY; y += 1) {
      for (let x = range.minX; x <= range.maxX; x += 1) {
        if (x < 0 || x >= range.count) continue;
        const key = `${group.zoom}/${x}/${y}`;
        visible.add(key);
        let record = group.records.get(key);
        if (!record) {
          const image = document.createElement('img');
          image.className = 'merlin-v20-tile';
          image.alt = '';
          image.draggable = false;
          image.decoding = 'async';
          image.loading = 'eager';
          record = { element: image, loaded: false, failed: false, touchedAt: Date.now(), x, y };
          group.records.set(key, record);
          group.element.append(image);
          const priority = -Math.hypot(x - range.center.x / TILE_SIZE, y - range.center.y / TILE_SIZE);
          this.scheduler.schedule(`${this.source.id}:${key}`, () => this.#load(group, record, { z: group.zoom, x, y }), priority).catch(() => {});
        }
        record.touchedAt = Date.now();
        record.element.style.left = `${x * TILE_SIZE - range.center.x + range.halfWidth}px`;
        record.element.style.top = `${y * TILE_SIZE - range.center.y + range.halfHeight}px`;
      }
    }
    group.visible = visible;
    group.element.style.transform = 'none';
    this.#prune(group);
    this.#maybeFinishTransition();
  }

  #renderPrevious(group, viewport) {
    if (!group) return;
    const range = tileRange(viewport, group.zoom);
    for (const record of group.records.values()) {
      record.element.style.left = `${record.x * TILE_SIZE - range.center.x + range.halfWidth}px`;
      record.element.style.top = `${record.y * TILE_SIZE - range.center.y + range.halfHeight}px`;
    }
    const scale = 2 ** (Math.floor(viewport.zoom) - group.zoom);
    group.element.style.transformOrigin = `${viewport.size.width / 2}px ${viewport.size.height / 2}px`;
    group.element.style.transform = `scale(${scale})`;
  }

  #startZoom(zoom) {
    clearTimeout(this.transitionTimer);
    if (this.active) {
      this.previous?.element.remove();
      this.previous = this.active;
      this.previous.element.classList.add('is-previous');
    }
    this.active = createGroup(zoom);
    this.container.append(this.active.element);
    this.transitionTimer = setTimeout(() => this.#finishTransition(), 8_000);
  }

  #load(group, record, tile) {
    return new Promise(resolve => {
      const image = record.element;
      image.onload = () => {
        if (!record.loaded) group.loaded += 1;
        record.loaded = true;
        image.classList.add('loaded');
        this.#maybeFinishTransition();
        resolve(true);
      };
      image.onerror = () => {
        const fallback = this.source.fallbackUrl(tile);
        if (fallback && image.src !== fallback) image.src = fallback;
        else {
          record.failed = true;
          image.remove();
          this.#maybeFinishTransition();
          resolve(false);
        }
      };
      image.referrerPolicy = 'no-referrer';
      image.src = this.source.url(tile);
    });
  }

  #maybeFinishTransition() {
    if (!this.previous || !this.active) return;
    const visible = [...this.active.visible].map(key => this.active.records.get(key)).filter(Boolean);
    if (!visible.length) return;
    const settled = visible.filter(record => record.loaded || record.failed).length;
    const loaded = visible.filter(record => record.loaded).length;
    const enough = loaded >= Math.min(8, Math.max(3, Math.ceil(visible.length * .45)));
    const exhausted = settled === visible.length && loaded > 0;
    if (enough || exhausted) this.#finishTransition();
  }

  #finishTransition() {
    clearTimeout(this.transitionTimer);
    if (!this.previous) return;
    const old = this.previous;
    this.previous = null;
    old.element.classList.add('fade-out');
    setTimeout(() => old.element.remove(), 360);
  }

  #prune(group) {
    if (group.records.size <= 150) return;
    const stale = [...group.records.entries()]
      .filter(([key]) => !group.visible.has(key))
      .sort((a, b) => a[1].touchedAt - b[1].touchedAt);
    while (group.records.size > 120 && stale.length) {
      const [key, record] = stale.shift();
      record.element.remove();
      group.records.delete(key);
    }
  }

  clear() {
    clearTimeout(this.transitionTimer);
    this.scheduler.clear();
    this.active = null;
    this.previous = null;
    this.container.replaceChildren();
  }
}
