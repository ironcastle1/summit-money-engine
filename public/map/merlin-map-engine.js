(function(){
'use strict';
const SVG_NS = 'http://www.w3.org/2000/svg';
const TILE_SIZE = 256;
const MIN_ZOOM = 1;
const MAX_ZOOM = 18;
const MAX_LAT = 85.05112878;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = value => Number.isFinite(Number(value));
const wrap = (value, modulo) => ((value % modulo) + modulo) % modulo;

function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

function lonToWorldX(lon, zoom) {
  return ((Number(lon) + 180) / 360) * TILE_SIZE * (2 ** zoom);
}

function latToWorldY(lat, zoom) {
  const limited = clamp(Number(lat), -MAX_LAT, MAX_LAT);
  const sin = Math.sin(limited * Math.PI / 180);
  return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * TILE_SIZE * (2 ** zoom);
}

function worldXToLon(x, zoom) {
  return (x / (TILE_SIZE * (2 ** zoom))) * 360 - 180;
}

function worldYToLat(y, zoom) {
  const n = Math.PI - (2 * Math.PI * y) / (TILE_SIZE * (2 ** zoom));
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

function eventGroup(item) {
  const category = String(item?.category || item?.kind || '').toLowerCase();
  if (category === 'earthquake') return 'earthquakes';
  if (['conflict', 'war', 'terror', 'protest', 'military', 'crime'].includes(category)) return 'conflict';
  return 'disasters';
}

function colourFor(item, kind) {
  if (kind === 'news') return '#9a73d9';
  if (kind === 'port') return '#27b985';
  if (kind === 'place') return '#e5ad45';
  if (kind === 'alert') return '#e64b61';
  const category = String(item?.category || '').toLowerCase();
  if (category === 'earthquake') {
    const magnitude = Number(item?.magnitude);
    if (magnitude >= 6) return '#e54559';
    if (magnitude >= 5) return '#ed7848';
    if (magnitude >= 3.5) return '#dcae45';
    if (magnitude >= 2) return '#51a9d3';
    return '#7e9fad';
  }
  if (eventGroup(item) === 'conflict') return '#e64b61';
  return '#e28b45';
}

function titleFor(item) {
  return item?.title || item?.name || item?.country?.name || item?.category || 'Map item';
}

function pointFor(item, kind) {
  if (kind === 'port') return item?.coordinates || null;
  if (kind === 'place') {
    const country = item?.country || item;
    return { lat: country?.capitalLat ?? country?.lat, lon: country?.capitalLon ?? country?.lon };
  }
  if (kind === 'news') return item?.mapPoint || null;
  return { lat: item?.lat, lon: item?.lon };
}

class MerlinTileMap {
  constructor({ container, onSelect, onEntity, initialPoint = { lat: 22, lon: 0 }, initialZoom = 2 } = {}) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    if (!this.container) throw new Error('Map container not found');
    this.onSelect = onSelect;
    this.onEntity = onEntity;
    this.center = { lat: Number(initialPoint.lat) || 22, lon: Number(initialPoint.lon) || 0 };
    this.zoom = clamp(Math.round(Number(initialZoom) || 2), MIN_ZOOM, MAX_ZOOM);
    this.layers = { alerts: true, news: true, earthquakes: true, disasters: true, conflict: true, routes: true, ports: true, countryRisk: true, heat: true };
    this.data = { alerts: [], events: [], news: [], ports: [], routes: [], places: [] };
    this.entities = new Map();
    this.drag = null;
    this.tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.fallbackTileUrl = '/api/map/tiles/streets/{z}/{x}/{y}.png';
    this.#build();
    this.resize();
    this.render();
  }

  #build() {
    this.container.replaceChildren();
    this.container.classList.add('merlin-tile-map', 'map-ready');

    this.localBase = document.createElement('img');
    this.localBase.className = 'merlin-map-local-base';
    this.localBase.src = '/assets/world-base.svg?v=18.0.0';
    this.localBase.alt = '';
    this.localBase.draggable = false;

    this.tileLayer = document.createElement('div');
    this.tileLayer.className = 'merlin-map-tiles';

    this.overlay = svg('svg', { class: 'merlin-map-overlay', 'aria-label': 'Interactive Merlin map' });
    this.heatLayer = svg('g', { class: 'merlin-map-heat' });
    this.routeLayer = svg('g', { class: 'merlin-map-routes' });
    this.markerLayer = svg('g', { class: 'merlin-map-markers' });
    this.labelLayer = svg('g', { class: 'merlin-map-labels' });
    this.overlay.append(this.heatLayer, this.routeLayer, this.markerLayer, this.labelLayer);

    this.hitLayer = document.createElement('div');
    this.hitLayer.className = 'merlin-map-hit-layer';

    this.status = document.createElement('div');
    this.status.className = 'merlin-map-status';

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'merlin-map-tooltip hidden';

    this.container.append(this.localBase, this.tileLayer, this.overlay, this.hitLayer, this.status, this.tooltip);

    this.container.addEventListener('wheel', event => {
      event.preventDefault();
      const delta = event.deltaY < 0 ? 1 : -1;
      this.zoomAround(event.clientX, event.clientY, this.zoom + delta);
    }, { passive: false });

    this.container.addEventListener('dblclick', event => {
      event.preventDefault();
      this.zoomAround(event.clientX, event.clientY, this.zoom + 1);
    });

    this.container.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest?.('[data-map-entity]')) return;
      this.drag = { x: event.clientX, y: event.clientY, center: { ...this.center }, moved: false };
      this.container.setPointerCapture?.(event.pointerId);
      this.container.classList.add('is-panning');
    });

    this.container.addEventListener('pointermove', event => {
      if (!this.drag) return;
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) this.drag.moved = true;
      const centerX = lonToWorldX(this.drag.center.lon, this.zoom) - dx;
      const centerY = latToWorldY(this.drag.center.lat, this.zoom) - dy;
      this.center = { lat: worldYToLat(centerY, this.zoom), lon: worldXToLon(centerX, this.zoom) };
      this.#normaliseCenter();
      this.tileLayer.style.transform = `translate(${dx}px, ${dy}px)`;
      this.renderLocalBase();
      this.renderOverlay();
      this.status.textContent = `ZOOM ${this.zoom}  ·  ${this.center.lat.toFixed(2)}, ${this.center.lon.toFixed(2)}`;
    });

    const finish = event => {
      if (!this.drag) return;
      const moved = this.drag.moved;
      this.drag = null;
      this.container.releasePointerCapture?.(event.pointerId);
      this.container.classList.remove('is-panning');
      this.tileLayer.style.transform = '';
      this.render();
      if (!moved) this.onSelect?.(this.unproject(event.clientX, event.clientY));
    };
    this.container.addEventListener('pointerup', finish);
    this.container.addEventListener('pointercancel', finish);

    this.overlay.addEventListener('click', event => {
      const target = event.target.closest('[data-map-entity]');
      if (!target) return;
      event.stopPropagation();
      const entity = this.entities.get(target.dataset.mapEntity);
      if (entity) this.onEntity?.(entity);
    });

    this.overlay.addEventListener('pointermove', event => {
      const target = event.target.closest('[data-map-entity]');
      if (!target) { this.tooltip.classList.add('hidden'); return; }
      const entity = this.entities.get(target.dataset.mapEntity);
      if (!entity) return;
      const box = this.container.getBoundingClientRect();
      this.tooltip.textContent = titleFor(entity.data);
      this.tooltip.style.left = `${event.clientX - box.left + 14}px`;
      this.tooltip.style.top = `${event.clientY - box.top + 14}px`;
      this.tooltip.classList.remove('hidden');
    });
    this.overlay.addEventListener('pointerleave', () => this.tooltip.classList.add('hidden'));

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.container);
    } else {
      window.addEventListener('resize', () => this.resize(), { passive: true });
    }
  }

  setData(data = {}) {
    this.data = {
      alerts: Array.isArray(data.alerts) ? data.alerts : [],
      events: Array.isArray(data.events) ? data.events : [],
      news: Array.isArray(data.news) ? data.news : [],
      ports: Array.isArray(data.ports) ? data.ports : [],
      routes: Array.isArray(data.routes) ? data.routes : [],
      places: Array.isArray(data.places) ? data.places : []
    };
    this.renderOverlay();
  }

  setLayerVisibility(layers = {}) {
    this.layers = { ...this.layers, ...layers };
    this.renderOverlay();
  }

  setTileMode(mode) {
    if (mode === 'local') { this.tileUrl = null; this.fallbackTileUrl = null; }
    else if (mode === 'terrain') { this.tileUrl = 'https://tile.opentopomap.org/{z}/{x}/{y}.png'; this.fallbackTileUrl = '/api/map/tiles/terrain/{z}/{x}/{y}.png'; }
    else if (mode === 'light') { this.tileUrl = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'; this.fallbackTileUrl = '/api/map/tiles/light/{z}/{x}/{y}.png'; }
    else { this.tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'; this.fallbackTileUrl = '/api/map/tiles/streets/{z}/{x}/{y}.png'; }
    this.renderTiles();
  }

  resize() {
    const box = this.container.getBoundingClientRect();
    this.size = { width: Math.max(320, Math.round(box.width)), height: Math.max(240, Math.round(box.height)) };
    this.overlay.setAttribute('width', this.size.width);
    this.overlay.setAttribute('height', this.size.height);
    this.overlay.setAttribute('viewBox', `0 0 ${this.size.width} ${this.size.height}`);
    this.render();
  }

  #normaliseCenter() {
    this.center.lat = clamp(this.center.lat, -MAX_LAT, MAX_LAT);
    while (this.center.lon < -180) this.center.lon += 360;
    while (this.center.lon > 180) this.center.lon -= 360;
  }

  project(point) {
    const centerX = lonToWorldX(this.center.lon, this.zoom);
    const centerY = latToWorldY(this.center.lat, this.zoom);
    let pointX = lonToWorldX(point.lon, this.zoom);
    const worldWidth = TILE_SIZE * (2 ** this.zoom);
    while (pointX - centerX > worldWidth / 2) pointX -= worldWidth;
    while (pointX - centerX < -worldWidth / 2) pointX += worldWidth;
    return { x: this.size.width / 2 + pointX - centerX, y: this.size.height / 2 + latToWorldY(point.lat, this.zoom) - centerY };
  }

  unproject(clientX, clientY) {
    const box = this.container.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    const centerX = lonToWorldX(this.center.lon, this.zoom);
    const centerY = latToWorldY(this.center.lat, this.zoom);
    return { lon: worldXToLon(centerX + x - this.size.width / 2, this.zoom), lat: worldYToLat(centerY + y - this.size.height / 2, this.zoom) };
  }

  zoomAround(clientX, clientY, nextZoom) {
    const targetZoom = clamp(Math.round(nextZoom), MIN_ZOOM, MAX_ZOOM);
    if (targetZoom === this.zoom) return;
    const anchor = this.unproject(clientX, clientY);
    const box = this.container.getBoundingClientRect();
    const localX = clientX - box.left;
    const localY = clientY - box.top;
    this.zoom = targetZoom;
    const anchorX = lonToWorldX(anchor.lon, this.zoom);
    const anchorY = latToWorldY(anchor.lat, this.zoom);
    this.center = {
      lon: worldXToLon(anchorX - localX + this.size.width / 2, this.zoom),
      lat: worldYToLat(anchorY - localY + this.size.height / 2, this.zoom)
    };
    this.#normaliseCenter();
    this.render();
  }

  setZoom(value) {
    const box = this.container.getBoundingClientRect();
    this.zoomAround(box.left + this.size.width / 2, box.top + this.size.height / 2, value);
  }

  zoomIn() { this.setZoom(this.zoom + 1); }
  zoomOut() { this.setZoom(this.zoom - 1); }

  flyTo(point, options = {}) {
    const lat = Number(point?.lat ?? point?.center?.[1]);
    const lon = Number(point?.lon ?? point?.center?.[0]);
    if (!finite(lat) || !finite(lon)) return;
    this.center = { lat, lon };
    if (finite(options.zoom)) this.zoom = clamp(Math.round(Number(options.zoom)), MIN_ZOOM, MAX_ZOOM);
    this.#normaliseCenter();
    this.render();
  }

  render() {
    if (!this.size) return;
    this.renderLocalBase();
    this.renderTiles();
    this.renderOverlay();
    this.status.textContent = `ZOOM ${this.zoom}  ·  ${this.center.lat.toFixed(2)}, ${this.center.lon.toFixed(2)}`;
  }

  renderLocalBase() {
    const scale = 2 ** Math.max(0, this.zoom - 2);
    const width = Math.max(this.size.width, this.size.height * 2) * scale;
    const height = width / 2;
    const centerX = (this.center.lon + 180) / 360 * width;
    const centerY = (90 - this.center.lat) / 180 * height;
    Object.assign(this.localBase.style, {
      width: `${width}px`, height: `${height}px`,
      left: `${this.size.width / 2 - centerX}px`, top: `${this.size.height / 2 - centerY}px`
    });
  }

  renderTiles() {
    this.tileLayer.replaceChildren();
    if (!this.tileUrl) return;
    const z = this.zoom;
    const n = 2 ** z;
    const centerX = lonToWorldX(this.center.lon, z);
    const centerY = latToWorldY(this.center.lat, z);
    const left = centerX - this.size.width / 2;
    const top = centerY - this.size.height / 2;
    const startX = Math.floor(left / TILE_SIZE) - 1;
    const endX = Math.floor((left + this.size.width) / TILE_SIZE) + 1;
    const startY = Math.max(0, Math.floor(top / TILE_SIZE) - 1);
    const endY = Math.min(n - 1, Math.floor((top + this.size.height) / TILE_SIZE) + 1);
    const fragment = document.createDocumentFragment();
    for (let tileY = startY; tileY <= endY; tileY += 1) {
      for (let rawX = startX; rawX <= endX; rawX += 1) {
        const tileX = wrap(rawX, n);
        const image = document.createElement('img');
        image.className = 'merlin-map-tile';
        image.alt = '';
        image.draggable = false;
        image.referrerPolicy = 'strict-origin-when-cross-origin';
        const primaryUrl = this.tileUrl.replace('{z}', z).replace('{x}', tileX).replace('{y}', tileY);
        const fallbackUrl = this.fallbackTileUrl?.replace('{z}', z).replace('{x}', tileX).replace('{y}', tileY) || null;
        image.src = primaryUrl;
        image.style.left = `${rawX * TILE_SIZE - left}px`;
        image.style.top = `${tileY * TILE_SIZE - top}px`;
        image.addEventListener('load', () => this.container.classList.add('has-map-tiles'));
        image.addEventListener('error', () => {
          if (fallbackUrl && image.dataset.fallback !== 'proxy') {
            image.dataset.fallback = 'proxy';
            image.src = fallbackUrl;
            return;
          }
          image.remove();
        });
        fragment.append(image);
      }
    }
    this.tileLayer.append(fragment);
  }

  renderOverlay() {
    if (!this.size) return;
    this.entities.clear();
    this.heatLayer.replaceChildren();
    this.routeLayer.replaceChildren();
    this.markerLayer.replaceChildren();
    this.labelLayer.replaceChildren();

    if (this.layers.heat) {
      const heatItems = this.data.events.filter(item => finite(item.lat) && finite(item.lon)).sort((a, b) => Number(b.severity || b.magnitude || 0) - Number(a.severity || a.magnitude || 0)).slice(0, 260);
      for (const item of heatItems) {
        const point = this.project(item);
        if (!this.#visible(point, 60)) continue;
        const strength = clamp(Number(item.severity || item.magnitude || 1), 1, 100);
        this.heatLayer.append(svg('circle', { cx: point.x, cy: point.y, r: clamp(8 + strength * .22, 9, 35), fill: colourFor(item, 'event'), opacity: clamp(.025 + strength / 900, .035, .16), 'pointer-events': 'none' }));
      }
    }

    if (this.layers.routes) {
      this.data.routes.forEach((route, index) => {
        const coordinates = route?.geometry?.coordinates || route?.coordinates || [];
        const lines = route?.geometry?.type === 'MultiLineString' ? coordinates : [coordinates];
        lines.forEach((line, lineIndex) => {
          if (!Array.isArray(line) || line.length < 2) return;
          const points = line.map(pair => this.project({ lon: pair[0], lat: pair[1] })).filter(point => finite(point.x) && finite(point.y));
          if (points.length < 2) return;
          const key = `route:${route.id || index}:${lineIndex}`;
          this.entities.set(key, { kind: 'route', data: route });
          this.routeLayer.append(svg('polyline', { points: points.map(point => `${point.x},${point.y}`).join(' '), fill: 'none', stroke: '#24a9cf', 'stroke-width': this.zoom >= 6 ? 3 : 2, 'stroke-dasharray': '8 6', opacity: .82, 'data-map-entity': key, class: 'map-route-line' }));
        });
      });
    }

    const markerSets = [];
    if (this.layers.alerts) markerSets.push(['alert', this.data.alerts.slice(0, 80)]);
    if (this.layers.news) markerSets.push(['news', this.data.news.slice(0, 180)]);
    markerSets.push(['event', this.data.events]);
    if (this.layers.ports) markerSets.push(['port', this.data.ports]);
    if (this.layers.countryRisk) markerSets.push(['place', this.data.places]);

    const renderedCells = new Set();
    for (const [kind, items] of markerSets) {
      items.forEach((item, index) => {
        if (kind === 'event') {
          const group = eventGroup(item);
          if (!this.layers[group]) return;
        }
        const pointData = pointFor(item, kind);
        if (!pointData || !finite(pointData.lat) || !finite(pointData.lon)) return;
        const point = this.project(pointData);
        if (!this.#visible(point, 24)) return;
        const cellSize = this.zoom <= 3 ? 10 : this.zoom <= 5 ? 6 : 1;
        const cell = `${kind}:${Math.round(point.x / cellSize)}:${Math.round(point.y / cellSize)}`;
        if (kind === 'event' && renderedCells.has(cell) && this.zoom <= 5) return;
        renderedCells.add(cell);
        const key = `${kind}:${item.id || item.sourceId || index}`;
        this.entities.set(key, { kind, data: item });
        const colour = colourFor(item, kind);
        const radius = kind === 'alert' ? 7 : kind === 'news' ? 5.5 : kind === 'port' ? 5 : kind === 'place' ? 4.5 : clamp(2.5 + Number(item.magnitude || item.severity || 1) * .38, 3, 8);
        const marker = kind === 'port'
          ? svg('rect', { x: point.x - radius, y: point.y - radius, width: radius * 2, height: radius * 2, rx: 1, fill: colour, stroke: '#f5fbfd', 'stroke-width': 1, 'data-map-entity': key, class: 'map-entity-marker port-marker' })
          : svg('circle', { cx: point.x, cy: point.y, r: radius, fill: colour, stroke: '#f5fbfd', 'stroke-width': kind === 'alert' ? 1.8 : .8, opacity: .94, 'data-map-entity': key, class: `map-entity-marker ${kind}-marker` });
        this.markerLayer.append(marker);
        if (this.zoom >= 6 && (kind === 'port' || kind === 'place' || (kind === 'event' && Number(item.magnitude) >= 4.5))) {
          const label = svg('text', { x: point.x + radius + 4, y: point.y + 3, class: 'merlin-map-label', 'pointer-events': 'none' });
          label.textContent = titleFor(item).slice(0, 32);
          this.labelLayer.append(label);
        }
      });
    }
  }

  #visible(point, padding = 0) {
    return point.x >= -padding && point.x <= this.size.width + padding && point.y >= -padding && point.y <= this.size.height + padding;
  }
}

window.MerlinMapEngine = MerlinTileMap;

})();
