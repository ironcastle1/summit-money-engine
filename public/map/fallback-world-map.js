const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 1200;
const HEIGHT = 600;
const MIN_VIEW_WIDTH = 180;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function project(point) {
  const lon = Number(point.lon ?? point[0]);
  const lat = Number(point.lat ?? point[1]);
  return { x: ((lon + 180) / 360) * WIDTH, y: ((90 - lat) / 180) * HEIGHT };
}

function unproject(x, y) {
  return { lon: (x / WIDTH) * 360 - 180, lat: 90 - (y / HEIGHT) * 180 };
}

function svgElement(tag, attributes = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

function pathFromCoordinates(coordinates) {
  return coordinates.map((point, index) => {
    const { x, y } = project(point);
    return `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function finiteCoordinate(item) {
  return Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lon));
}

function markerSeverity(item) {
  const raw = Number(item?.markerSize ?? item?.severity ?? item?.risk ?? 1);
  if (!Number.isFinite(raw)) return 1;
  return raw > 5 ? clamp(raw / 20, 0.5, 5) : clamp(raw, 0.5, 5);
}

function markerColour(item, set) {
  return item?.colour || item?.color || (set === 'local' ? '#ffb44a' : '#56bde9');
}

function titleFor(item) {
  return item?.title || item?.name || item?.category || 'Event';
}

export class FallbackWorldMap {
  constructor({ container, onSelect, onEvent, initialPoint, initialZoom = 1 }) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    if (!this.container) throw new Error('Local map container was not found');
    this.onSelect = onSelect;
    this.onEvent = onEvent;
    this.routesVisible = false;
    this.clustersVisible = true;
    this.globalEvents = [];
    this.localEvents = [];
    this.routes = { type: 'FeatureCollection', features: [] };
    this.point = initialPoint || { lat: 51.5074, lon: -0.1278 };
    this.radiusKm = 250;
    this.view = { x: 0, y: 0, width: WIDTH, height: HEIGHT };
    this.drag = null;
    this.suppressClick = false;
    this.#renderShell();
    if (initialZoom > 1) this.flyTo(this.point, { zoom: initialZoom, duration: 0 });
  }

  #renderShell() {
    this.container.replaceChildren();
    this.container.classList.add('fallback-map-active', 'local-vector-map-active');
    this.svg = svgElement('svg', {
      viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
      role: 'img',
      'aria-label': 'Interactive global intelligence map',
      preserveAspectRatio: 'none'
    });
    this.svg.classList.add('fallback-world-map');

    const defs = svgElement('defs');
    const glow = svgElement('filter', { id: `fallback-glow-${Math.random().toString(36).slice(2)}`, x: '-100%', y: '-100%', width: '300%', height: '300%' });
    this.glowId = glow.id;
    glow.append(svgElement('feGaussianBlur', { stdDeviation: '3', result: 'blur' }));
    const merge = svgElement('feMerge');
    merge.append(svgElement('feMergeNode', { in: 'blur' }), svgElement('feMergeNode', { in: 'SourceGraphic' }));
    glow.append(merge);
    defs.append(glow);
    this.svg.append(defs);

    const base = svgElement('image', {
      href: '/assets/world-base.svg',
      x: 0,
      y: 0,
      width: WIDTH,
      height: HEIGHT,
      preserveAspectRatio: 'none',
      class: 'fallback-base-map'
    });
    this.svg.append(base);

    this.routeLayer = svgElement('g', { class: 'fallback-routes' });
    this.globalLayer = svgElement('g', { class: 'fallback-global-events' });
    this.localLayer = svgElement('g', { class: 'fallback-local-events' });
    this.scanLayer = svgElement('g', { class: 'fallback-scan' });
    this.svg.append(this.routeLayer, this.globalLayer, this.localLayer, this.scanLayer);
    this.container.append(this.svg);
    this.resizeObserver?.disconnect?.();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    requestAnimationFrame(() => this.resize());

    this.controls = document.createElement('div');
    this.controls.className = 'local-map-controls';
    this.controls.innerHTML = '<button type="button" data-local-map="zoom-in" aria-label="Zoom in">+</button><button type="button" data-local-map="zoom-out" aria-label="Zoom out">−</button><button type="button" data-local-map="home" aria-label="World view">◎</button>';
    this.container.append(this.controls);

    this.status = document.createElement('div');
    this.status.className = 'local-map-status';
    this.status.textContent = 'VECTOR / 1.0×';
    this.container.append(this.status);

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'local-map-tooltip hidden';
    this.container.append(this.tooltip);

    this.controls.addEventListener('click', event => {
      const action = event.target.closest('button')?.dataset.localMap;
      if (action === 'zoom-in') this.#zoomAt(this.view.x + this.view.width / 2, this.view.y + this.view.height / 2, 1.65);
      if (action === 'zoom-out') this.#zoomAt(this.view.x + this.view.width / 2, this.view.y + this.view.height / 2, 1 / 1.65);
      if (action === 'home') this.#setView({ x: 0, y: 0, width: WIDTH, height: HEIGHT });
    });

    this.svg.addEventListener('wheel', event => {
      event.preventDefault();
      const point = this.#eventToMap(event);
      this.#zoomAt(point.x, point.y, event.deltaY < 0 ? 1.35 : 1 / 1.35);
    }, { passive: false });

    this.svg.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      this.drag = { x: event.clientX, y: event.clientY, view: { ...this.view }, moved: false };
      this.svg.setPointerCapture?.(event.pointerId);
      this.svg.classList.add('dragging');
    });

    this.svg.addEventListener('pointermove', event => {
      this.#updateTooltip(event);
      if (!this.drag) return;
      const box = this.svg.getBoundingClientRect();
      const dx = (event.clientX - this.drag.x) / Math.max(1, box.width) * this.drag.view.width;
      const dy = (event.clientY - this.drag.y) / Math.max(1, box.height) * this.drag.view.height;
      if (Math.abs(event.clientX - this.drag.x) + Math.abs(event.clientY - this.drag.y) > 5) this.drag.moved = true;
      this.#setView({ ...this.drag.view, x: this.drag.view.x - dx, y: this.drag.view.y - dy }, false);
    });

    const finishDrag = event => {
      if (!this.drag) return;
      this.suppressClick = this.drag.moved;
      this.drag = null;
      this.svg.releasePointerCapture?.(event.pointerId);
      this.svg.classList.remove('dragging');
      setTimeout(() => { this.suppressClick = false; }, 0);
    };
    this.svg.addEventListener('pointerup', finishDrag);
    this.svg.addEventListener('pointercancel', finishDrag);
    this.svg.addEventListener('pointerleave', event => {
      if (this.drag) finishDrag(event);
      this.tooltip.classList.add('hidden');
    });

    this.svg.addEventListener('dblclick', event => {
      event.preventDefault();
      const point = this.#eventToMap(event);
      this.#zoomAt(point.x, point.y, 1.8);
    });

    this.svg.addEventListener('click', event => {
      if (this.suppressClick) return;
      const marker = event.target.closest('[data-event-index]');
      if (marker) {
        const collection = marker.dataset.eventSet === 'local' ? this.localEvents : this.globalEvents;
        const item = collection[Number(marker.dataset.eventIndex)];
        if (item) this.onEvent?.(item);
        return;
      }
      const cluster = event.target.closest('[data-cluster-lat]');
      if (cluster) {
        this.flyTo({ lat: Number(cluster.dataset.clusterLat), lon: Number(cluster.dataset.clusterLon) }, { zoom: this.zoom + 1.6 });
        return;
      }
      const point = this.#eventToMap(event);
      this.onSelect?.(unproject(point.x, point.y));
    });

    this.updateGeometry(this.point, this.radiusKm);
    this.#setView(this.view);
  }

  get zoom() {
    return WIDTH / this.view.width;
  }

  #eventToMap(event) {
    const box = this.svg.getBoundingClientRect();
    const px = clamp((event.clientX - box.left) / Math.max(1, box.width), 0, 1);
    const py = clamp((event.clientY - box.top) / Math.max(1, box.height), 0, 1);
    return { x: this.view.x + px * this.view.width, y: this.view.y + py * this.view.height };
  }

  #setView(next, rerender = true) {
    const width = clamp(Number(next.width) || WIDTH, MIN_VIEW_WIDTH, WIDTH);
    const height = width / 2;
    const x = clamp(Number(next.x) || 0, 0, WIDTH - width);
    const y = clamp(Number(next.y) || 0, 0, HEIGHT - height);
    this.view = { x, y, width, height };
    this.svg.setAttribute('viewBox', `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}`);
    if (this.status) this.status.textContent = `VECTOR / ${this.zoom.toFixed(1)}×`;
    if (rerender && this.clustersVisible) this.#renderEvents('global');
  }

  #zoomAt(x, y, factor) {
    const width = clamp(this.view.width / factor, MIN_VIEW_WIDTH, WIDTH);
    const ratioX = (x - this.view.x) / this.view.width;
    const ratioY = (y - this.view.y) / this.view.height;
    this.#setView({ x: x - width * ratioX, y: y - (width / 2) * ratioY, width, height: width / 2 });
  }

  #updateTooltip(event) {
    const marker = event.target.closest?.('[data-map-title]');
    if (!marker) { this.tooltip.classList.add('hidden'); return; }
    const title = marker.dataset.mapTitle || 'Event';
    const meta = marker.dataset.mapMeta || '';
    this.tooltip.innerHTML = `<strong>${title.replace(/[<>]/g, '')}</strong><span>${meta.replace(/[<>]/g, '')}</span>`;
    const containerBox = this.container.getBoundingClientRect();
    this.tooltip.style.left = `${event.clientX - containerBox.left + 14}px`;
    this.tooltip.style.top = `${event.clientY - containerBox.top + 14}px`;
    this.tooltip.classList.remove('hidden');
  }

  updateGeometry(point, radiusKm) {
    if (finiteCoordinate(point)) this.point = { lat: Number(point.lat), lon: Number(point.lon) };
    this.radiusKm = Number(radiusKm) || this.radiusKm;
    this.scanLayer.replaceChildren();
    const p = project(this.point);
    const latitudeScale = Math.max(0.18, Math.cos(this.point.lat * Math.PI / 180));
    const rx = Math.max(2.5, (this.radiusKm / 40075) * WIDTH * 2 / latitudeScale);
    const ry = Math.max(2.5, (this.radiusKm / 20004) * HEIGHT * 2);
    this.scanLayer.append(svgElement('ellipse', { cx: p.x, cy: p.y, rx, ry, class: 'fallback-radius' }));
    this.scanLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: 5.5, class: 'fallback-point-halo', style: `filter:url(#${this.glowId})` }));
    this.scanLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: 2.6, class: 'fallback-point' }));
  }

  #renderEvents(set) {
    const layer = set === 'local' ? this.localLayer : this.globalLayer;
    const events = set === 'local' ? this.localEvents : this.globalEvents;
    layer.replaceChildren();
    const eligible = events.filter(finiteCoordinate).slice(0, set === 'local' ? 800 : 3000);

    if (set === 'global' && this.clustersVisible && this.zoom < 4 && eligible.length > 180) {
      const cell = Math.max(10, 34 / this.zoom);
      const groups = new Map();
      eligible.forEach((item, index) => {
        const p = project(item);
        const key = `${Math.floor(p.x / cell)}:${Math.floor(p.y / cell)}`;
        const group = groups.get(key) || { x: 0, y: 0, lat: 0, lon: 0, count: 0, severity: 0, first: index };
        group.x += p.x; group.y += p.y; group.lat += Number(item.lat); group.lon += Number(item.lon); group.count += 1; group.severity += markerSeverity(item);
        groups.set(key, group);
      });
      for (const group of groups.values()) {
        if (group.count === 1) { this.#appendMarker(layer, eligible[group.first], group.first, set); continue; }
        const x = group.x / group.count; const y = group.y / group.count;
        const radius = clamp(5 + Math.log2(group.count) * 1.7, 6, 15);
        const circle = svgElement('circle', {
          cx: x, cy: y, r: radius, class: 'fallback-cluster',
          'data-cluster-lat': group.lat / group.count,
          'data-cluster-lon': group.lon / group.count,
          'data-map-title': `${group.count} EVENTS`,
          'data-map-meta': 'CLICK TO ZOOM'
        });
        const label = svgElement('text', { x, y: y + 2.2, class: 'fallback-cluster-label', 'text-anchor': 'middle', 'pointer-events': 'none' });
        label.textContent = group.count > 999 ? `${Math.round(group.count / 100) / 10}K` : String(group.count);
        layer.append(circle, label);
      }
      return;
    }

    eligible.forEach((item, index) => this.#appendMarker(layer, item, index, set));
  }

  #appendMarker(layer, item, index, set) {
    const p = project(item);
    const severity = markerSeverity(item);
    const colour = markerColour(item, set);
    const radius = set === 'local' ? 2.7 + severity * 0.75 : 1.45 + severity * 0.48;
    const circle = svgElement('circle', {
      cx: p.x,
      cy: p.y,
      r: radius,
      fill: colour,
      class: `fallback-event fallback-event-${set}`,
      'data-event-index': index,
      'data-event-set': set,
      'data-map-title': titleFor(item),
      'data-map-meta': [item.category, item.source, Number.isFinite(Number(item.severity)) ? `SEV ${Number(item.severity).toFixed(1)}` : ''].filter(Boolean).join(' / '),
      tabindex: 0,
      style: `filter:url(#${this.glowId})`
    });
    const title = svgElement('title');
    title.textContent = [titleFor(item), item.source, item.category].filter(Boolean).join(' / ');
    circle.append(title);
    layer.append(circle);
  }

  setEvents(events, set = 'global') {
    if (set === 'local') this.localEvents = Array.isArray(events) ? events : [];
    else this.globalEvents = Array.isArray(events) ? events : [];
    this.#renderEvents(set);
  }

  setRoutes(collection) {
    this.routes = collection || { type: 'FeatureCollection', features: [] };
    this.routeLayer.replaceChildren();
    for (const feature of this.routes.features || []) {
      const coordinates = feature.geometry?.coordinates || [];
      if (feature.geometry?.type !== 'LineString' || !coordinates.length) continue;
      const path = svgElement('path', {
        d: pathFromCoordinates(coordinates),
        class: 'fallback-route',
        stroke: feature.properties?.colour || feature.properties?.color || '#39bfff',
        'data-map-title': feature.properties?.name || 'Route',
        'data-map-meta': Number.isFinite(Number(feature.properties?.risk)) ? `RISK ${Number(feature.properties.risk).toFixed(0)}` : ''
      });
      this.routeLayer.append(path);
    }
    this.routeLayer.classList.toggle('visible', this.routesVisible);
  }

  setRoutesVisible(visible) {
    this.routesVisible = Boolean(visible);
    this.routeLayer.classList.toggle('visible', this.routesVisible);
  }

  setClustersVisible(visible) {
    this.clustersVisible = Boolean(visible);
    this.#renderEvents('global');
  }

  flyTo(point, options = {}) {
    if (!finiteCoordinate(point)) return;
    this.point = { lat: Number(point.lat), lon: Number(point.lon) };
    const p = project(this.point);
    const requestedZoom = Number(options.zoom);
    const zoom = Number.isFinite(requestedZoom) ? clamp(requestedZoom / 1.35, 1, WIDTH / MIN_VIEW_WIDTH) : Math.max(this.zoom, 2.6);
    const width = WIDTH / zoom;
    this.#setView({ x: p.x - width / 2, y: p.y - width / 4, width, height: width / 2 });
    this.updateGeometry(this.point, this.radiusKm);
  }

  fitBounds(coordinates, options = {}) {
    const flat = (coordinates || []).flat(Infinity).filter((_, index, values) => typeof values[index] === 'number');
    if (!flat.length) return;
    const points = [];
    const visit = value => {
      if (Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) points.push(project(value));
      else if (Array.isArray(value)) value.forEach(visit);
    };
    visit(coordinates);
    if (!points.length) return;
    const minX = Math.min(...points.map(point => point.x)); const maxX = Math.max(...points.map(point => point.x));
    const minY = Math.min(...points.map(point => point.y)); const maxY = Math.max(...points.map(point => point.y));
    const padding = Number(options.padding) || 40;
    const width = clamp(Math.max(maxX - minX + padding, (maxY - minY + padding) * 2), MIN_VIEW_WIDTH, WIDTH);
    this.#setView({ x: (minX + maxX) / 2 - width / 2, y: (minY + maxY) / 2 - width / 4, width, height: width / 2 });
  }

  resize() {
    const bounds = this.container.getBoundingClientRect();
    const width = Math.max(320, Math.round(bounds.width || this.container.clientWidth || 1200));
    const height = Math.max(260, Math.round(bounds.height || this.container.clientHeight || 600));
    this.svg?.setAttribute('width', String(width));
    this.svg?.setAttribute('height', String(height));
    if (this.svg) {
      this.svg.style.width = `${width}px`;
      this.svg.style.height = `${height}px`;
      this.svg.style.maxWidth = 'none';
      this.svg.style.maxHeight = 'none';
    }
    this.#setView(this.view, false);
  }

  destroy() {
    this.resizeObserver?.disconnect?.();
    this.container.replaceChildren();
    this.container.classList.remove('fallback-map-active', 'local-vector-map-active');
  }
}
