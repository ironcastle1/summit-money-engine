import { TILE_SIZE } from './constants.js';
import { project } from './projection.js';
import { TileScheduler } from './tile-scheduler.js';

function createGroup(zoom) {
  const element = document.createElement('div');
  element.className = 'merlin-v20-tile-group';
  element.dataset.zoom = String(zoom);
  return { zoom, element, records: new Map(), loaded: 0, visible: new Set() };
}

export class TileLayer {
  constructor(container, source) {
    this.container = container;
    this.source = source;
    this.scheduler = new TileScheduler({ maximumConcurrent: 16 });
    this.active = null;
    this.previous = null;
    this.transitionTimer = null;
  }

  setSource(source) {
    if (this.source?.id === source?.id) return;
    this.source = source;
    this.clear();
  }

  render(viewport) {
    if (!this.source?.enabled) {
      this.clear();
      return;
    }

    const zoom = Math.max(0, Math.floor(viewport.zoom));
    if (!this.active || this.active.zoom !== zoom) this.#startZoom(zoom);

    const count = 2 ** zoom;
    const center = project(viewport.center, zoom);
    const halfWidth = viewport.size.width / 2;
    const halfHeight = viewport.size.height / 2;
    const minX = Math.floor((center.x - halfWidth) / TILE_SIZE) - 1;
    const maxX = Math.floor((center.x + halfWidth) / TILE_SIZE) + 1;
    const minY = Math.max(0, Math.floor((center.y - halfHeight) / TILE_SIZE) - 1);
    const maxY = Math.min(count - 1, Math.floor((center.y + halfHeight) / TILE_SIZE) + 1);
    const visible = new Set();

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (x < 0 || x >= count) continue;
        const key = `${zoom}/${x}/${y}`;
        visible.add(key);
        let record = this.active.records.get(key);
        if (!record) {
          const image = document.createElement('img');
          image.className = 'merlin-v20-tile';
          image.alt = '';
          image.draggable = false;
          image.decoding = 'async';
          image.loading = 'eager';
          record = { element: image, loaded: false, touchedAt: Date.now() };
          this.active.records.set(key, record);
          this.active.element.append(image);
          const priority = -Math.hypot(x - center.x / TILE_SIZE, y - center.y / TILE_SIZE);
          this.scheduler.schedule(`${this.source.id}:${key}`, () => this.#load(record, { z: zoom, x, y }), priority).catch(() => {});
        }
        record.touchedAt = Date.now();
        record.element.style.left = `${x * TILE_SIZE - center.x + halfWidth}px`;
        record.element.style.top = `${y * TILE_SIZE - center.y + halfHeight}px`;
      }
    }

    this.active.visible = visible;
    this.#prune(this.active);
  }

  #startZoom(zoom) {
    this.scheduler.clear();
    clearTimeout(this.transitionTimer);
    if (this.active) {
      this.previous?.element.remove();
      this.previous = this.active;
      this.previous.element.classList.add('is-previous');
    }
    this.active = createGroup(zoom);
    this.container.append(this.active.element);
    this.transitionTimer = setTimeout(() => this.#finishTransition(), 1100);
  }

  #load(record, tile) {
    return new Promise(resolve => {
      const image = record.element;
      image.onload = () => {
        record.loaded = true;
        image.classList.add('loaded');
        this.active.loaded += 1;
        if (this.active.loaded >= 2) this.#finishTransition();
        resolve(true);
      };
      image.onerror = () => {
        const fallback = this.source.fallbackUrl(tile);
        if (fallback && image.src !== fallback) image.src = fallback;
        else {
          image.remove();
          resolve(false);
        }
      };
      image.referrerPolicy = 'no-referrer';
      image.src = this.source.url(tile);
    });
  }

  #finishTransition() {
    clearTimeout(this.transitionTimer);
    if (!this.previous) return;
    const old = this.previous;
    this.previous = null;
    old.element.classList.add('fade-out');
    setTimeout(() => old.element.remove(), 220);
  }

  #prune(group) {
    if (group.records.size <= 180) return;
    const stale = [...group.records.entries()]
      .filter(([key]) => !group.visible.has(key))
      .sort((a, b) => a[1].touchedAt - b[1].touchedAt);
    while (group.records.size > 150 && stale.length) {
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
