const SVG_NS = 'http://www.w3.org/2000/svg';
const MIN_ZOOM = 1;
const MAX_ZOOM = 10;

function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function finiteCoordinate(item) { return Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lon)); }
function safeText(value) { return String(value ?? '').replace(/[<>]/g, ''); }
function svgElement(tag, attributes = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

function categoryColour(item, set) {
  const category = String(item?.category || '').toLowerCase();
  if (category === 'earthquake') {
    const magnitude = Number(item?.magnitude ?? item?.severity);
    if (Number.isFinite(magnitude)) {
      if (magnitude >= 6) return '#ff4d5d';
      if (magnitude >= 5) return '#ff7a45';
      if (magnitude >= 3.5) return '#ffc857';
      if (magnitude >= 2) return '#63d7ff';
      return '#8db5c8';
    }
    return '#63d7ff';
  }
  const colours = {
    volcano: '#ff7a45', wildfire: '#ff9f43', storm: '#ad91ff', flood: '#37b9ff', drought: '#d7a84a',
    landslide: '#c08457', ice: '#8ee8ff', conflict: '#ef4444', protest: '#f4b942', terror: '#ff2f4b',
    crime: '#a3e635', infrastructure: '#f97316', transport: '#38bdf8', energy: '#facc15', economic: '#42d392',
    health: '#ec4899', port: '#42d392', chokepoint: '#f4b942', country: '#ffb44a', city: '#68bde6'
  };
  return item?.colour || item?.color || colours[category] || (set === 'local' ? '#ffb44a' : '#56bde9');
}

function markerRadius(item, set, zoom) {
  const category = String(item?.category || '').toLowerCase();
  if (category === 'earthquake') {
    const magnitude = Number(item?.magnitude ?? item?.severity);
    const base = Number.isFinite(magnitude) ? clamp(1.7 + magnitude * 0.72, 2, 8) : 3;
    return clamp(base + (zoom - 1) * 0.18, 2, 10);
  }
  const raw = Number(item?.markerSize ?? item?.severity ?? item?.risk ?? 1);
  const normalized = Number.isFinite(raw) ? (raw > 5 ? raw / 20 : raw) : 1;
  return clamp((set === 'local' ? 3.8 : 3) + normalized * .9 + (zoom - 1) * .16, 3, 11);
}

function eventKey(item, index, set) { return String(item?.id || item?.sourceId || `${set}-${index}`); }
function titleFor(item) { return item?.title || item?.name || item?.category || 'Event'; }

export class FallbackWorldMap {
  constructor({ container, onSelect, onEvent, initialPoint, initialZoom = 1 } = {}) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    if (!this.container) throw new Error('Map container was not found');
    this.onSelect = onSelect;
    this.onEvent = onEvent;
    this.center = finiteCoordinate(initialPoint) ? { lat: Number(initialPoint.lat), lon: Number(initialPoint.lon) } : { lat: 0, lon: 0 };
    this.zoom = clamp(Math.round(Number(initialZoom) || 1), MIN_ZOOM, MAX_ZOOM);
    this.centerPoint = null;
    this.radiusKm = 250;
    this.globalEvents = [];
    this.localEvents = [];
    this.routes = { type: 'FeatureCollection', features: [] };
    this.routesVisible = false;
    this.clustersVisible = false;
    this.layerState = { events: true, heat: true, grid: false };
    this.size = { width: 1200, height: 600 };
    this.eventLookup = new Map();
    this.routeLookup = new Map();
    this.drag = null;
    this.#renderShell();
    this.resize();
    this.#renderAll();
  }

  #renderShell() {
    this.container.replaceChildren();
    this.container.classList.add('fallback-map-active', 'local-detailed-map');

    this.base = document.createElement('img');
    this.base.className = 'local-detailed-base';
    this.base.src = '/assets/world-base.svg?v=17.2.0';
    this.base.alt = 'Detailed political world map';
    this.base.draggable = false;

    this.overlay = svgElement('svg', { class: 'local-detailed-overlay', role: 'img', 'aria-label': 'Interactive intelligence map' });
    this.gridLayer = svgElement('g', { class: 'local-grid-layer' });
    this.heatLayer = svgElement('g', { class: 'local-heat-layer' });
    this.routeLayer = svgElement('g', { class: 'local-route-layer' });
    this.globalLayer = svgElement('g', { class: 'local-global-layer' });
    this.localLayer = svgElement('g', { class: 'local-local-layer' });
    this.scanLayer = svgElement('g', { class: 'local-scan-layer' });
    this.overlay.append(this.gridLayer, this.heatLayer, this.routeLayer, this.globalLayer, this.localLayer, this.scanLayer);

    this.hitSurface = document.createElement('div');
    this.hitSurface.className = 'local-detailed-hit-surface';
    this.container.append(this.base, this.overlay, this.hitSurface);

    this.controls = document.createElement('div');
    this.controls.className = 'local-map-controls local-detailed-controls';
    this.controls.innerHTML = [
      '<button type="button" data-local-map="zoom-in" aria-label="Zoom in">+</button>',
      '<button type="button" data-local-map="zoom-out" aria-label="Zoom out">−</button>',
      '<button type="button" data-local-map="home" aria-label="World view">◎</button>',
      '<button type="button" data-local-map="layers" aria-label="Map layers">≡</button>'
    ].join('');
    this.container.append(this.controls);

    this.layerPanel = document.createElement('div');
    this.layerPanel.className = 'detailed-layer-panel hidden';
    this.layerPanel.innerHTML = `
      <strong>MAP OVERLAYS</strong>
      <button type="button" data-layer="events" class="active">EVENTS</button>
      <button type="button" data-layer="heat" class="active">DENSITY</button>
      <button type="button" data-layer="grid">GRID</button>
      <small>LOCAL POLITICAL BASE / ALL MAGNITUDES</small>`;
    this.container.append(this.layerPanel);

    this.status = document.createElement('div');
    this.status.className = 'local-map-status local-detailed-status';
    this.container.append(this.status);

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'local-map-tooltip hidden';
    this.container.append(this.tooltip);

    this.attribution = document.createElement('div');
    this.attribution.className = 'detailed-map-attribution';
    this.attribution.textContent = 'MERLIN LOCAL VECTOR BASE';
    this.container.append(this.attribution);

    this.controls.addEventListener('click', event => {
      const action = event.target.closest('button')?.dataset.localMap;
      if (action === 'zoom-in') this.setZoom(this.zoom + 1);
      if (action === 'zoom-out') this.setZoom(this.zoom - 1);
      if (action === 'home') { this.center = { lat: 0, lon: 0 }; this.zoom = 1; this.#renderAll(); }
      if (action === 'layers') this.layerPanel.classList.toggle('hidden');
    });

    this.layerPanel.addEventListener('click', event => {
      const button = event.target.closest('[data-layer]');
      if (!button) return;
      const layer = button.dataset.layer;
      this.layerState[layer] = !this.layerState[layer];
      button.classList.toggle('active', this.layerState[layer]);
      this.#renderAll({ base: false });
    });

    this.hitSurface.addEventListener('wheel', event => {
      event.preventDefault();
      const point = this.#eventLatLon(event);
      this.#zoomAround(point, clamp(this.zoom + (event.deltaY < 0 ? 1 : -1), MIN_ZOOM, MAX_ZOOM), event);
    }, { passive: false });

    this.hitSurface.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      this.drag = { x: event.clientX, y: event.clientY, center: { ...this.center }, moved: false };
      this.hitSurface.setPointerCapture?.(event.pointerId);
      this.container.classList.add('dragging');
    });
    this.hitSurface.addEventListener('pointermove', event => {
      if (!this.drag) return;
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) this.drag.moved = true;
      const rect = this.#worldRect(this.drag.center);
      const lonPerPixel = 360 / rect.width;
      const latPerPixel = 180 / rect.height;
      this.center = this.#clampCenter({ lat: this.drag.center.lat + dy * latPerPixel, lon: this.drag.center.lon - dx * lonPerPixel });
      this.#renderAll();
    });
    const finish = event => {
      if (!this.drag) return;
      const moved = this.drag.moved;
      this.drag = null;
      this.hitSurface.releasePointerCapture?.(event.pointerId);
      this.container.classList.remove('dragging');
      if (!moved) this.onSelect?.(this.#eventLatLon(event));
    };
    this.hitSurface.addEventListener('pointerup', finish);
    this.hitSurface.addEventListener('pointercancel', finish);

    this.overlay.addEventListener('click', event => {
      const marker = event.target.closest('[data-event-key]');
      if (marker) {
        event.stopPropagation();
        const item = this.eventLookup.get(marker.dataset.eventKey);
        if (item) { this.#selectMarker(marker); this.onEvent?.(item); }
        return;
      }
      const cluster = event.target.closest('[data-cluster-lat]');
      if (cluster) {
        event.stopPropagation();
        this.flyTo({ lat: Number(cluster.dataset.clusterLat), lon: Number(cluster.dataset.clusterLon) }, { zoom: Math.min(this.zoom + 2, MAX_ZOOM) });
        return;
      }
      const route = event.target.closest('[data-route-key]');
      if (route) {
        event.stopPropagation();
        const feature = this.routeLookup.get(route.dataset.routeKey);
        if (feature) this.onEvent?.({
          id: feature.properties?.id, entityType: 'routes', title: feature.properties?.name || 'Shipping route', category: 'ROUTE',
          source: Number.isFinite(Number(feature.properties?.risk)) ? `RISK ${Number(feature.properties.risk).toFixed(0)}` : 'SHIPPING CORRIDOR',
          geometry: feature.geometry, properties: feature.properties
        });
      }
    });
    this.overlay.addEventListener('pointermove', event => this.#updateTooltip(event));
    this.overlay.addEventListener('pointerleave', () => this.tooltip.classList.add('hidden'));

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.boundWindowResize = () => this.resize();
    window.addEventListener('resize', this.boundWindowResize, { passive: true });
  }

  #baseSize() {
    const width = this.size.width;
    return { width, height: width / 2 };
  }

  #worldRect(center = this.center) {
    const base = this.#baseSize();
    const scale = 2 ** (this.zoom - 1);
    const width = base.width * scale;
    const height = base.height * scale;
    const centerX = (Number(center.lon) + 180) / 360 * width;
    const centerY = (90 - Number(center.lat)) / 180 * height;
    return { width, height, left: this.size.width / 2 - centerX, top: this.size.height / 2 - centerY };
  }

  #clampCenter(point) {
    const scale = 2 ** (this.zoom - 1);
    const lonLimit = Math.max(0, 180 - 180 / scale);
    const latLimit = Math.max(0, 85 - 80 / scale);
    return { lon: clamp(Number(point.lon), -lonLimit, lonLimit), lat: clamp(Number(point.lat), -latLimit, latLimit) };
  }

  #project(point) {
    const rect = this.#worldRect();
    return {
      x: rect.left + (Number(point.lon) + 180) / 360 * rect.width,
      y: rect.top + (90 - Number(point.lat)) / 180 * rect.height
    };
  }

  #unproject(x, y) {
    const rect = this.#worldRect();
    return {
      lon: clamp((x - rect.left) / rect.width * 360 - 180, -180, 180),
      lat: clamp(90 - (y - rect.top) / rect.height * 180, -90, 90)
    };
  }

  #eventLatLon(event) {
    const box = this.container.getBoundingClientRect();
    return this.#unproject(event.clientX - box.left, event.clientY - box.top);
  }

  #zoomAround(anchor, nextZoom, event) {
    if (nextZoom === this.zoom) return;
    const box = this.container.getBoundingClientRect();
    const cursor = { x: event.clientX - box.left, y: event.clientY - box.top };
    this.zoom = nextZoom;
    const base = this.#baseSize();
    const scale = 2 ** (this.zoom - 1);
    const width = base.width * scale;
    const height = base.height * scale;
    const anchorWorld = { x: (anchor.lon + 180) / 360 * width, y: (90 - anchor.lat) / 180 * height };
    const desiredCenterWorld = { x: anchorWorld.x - (cursor.x - this.size.width / 2), y: anchorWorld.y - (cursor.y - this.size.height / 2) };
    this.center = this.#clampCenter({ lon: desiredCenterWorld.x / width * 360 - 180, lat: 90 - desiredCenterWorld.y / height * 180 });
    this.#renderAll();
  }

  setZoom(value) {
    const next = clamp(Math.round(Number(value)), MIN_ZOOM, MAX_ZOOM);
    if (next === this.zoom) return;
    this.zoom = next;
    this.center = this.#clampCenter(this.center);
    this.#renderAll();
  }

  #renderBase() {
    const rect = this.#worldRect();
    Object.assign(this.base.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  }

  #renderGrid() {
    this.gridLayer.replaceChildren();
    if (!this.layerState.grid) return;
    const interval = this.zoom >= 6 ? 5 : this.zoom >= 4 ? 10 : 30;
    for (let lon = -180; lon <= 180; lon += interval) {
      const a = this.#project({ lon, lat: -85 }); const b = this.#project({ lon, lat: 85 });
      this.gridLayer.append(svgElement('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'detailed-grid-line' }));
    }
    for (let lat = -60; lat <= 60; lat += interval) {
      const a = this.#project({ lon: -180, lat }); const b = this.#project({ lon: 180, lat });
      this.gridLayer.append(svgElement('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'detailed-grid-line' }));
    }
  }

  #routeSegments(coordinates) {
    const segments = [[]];
    for (let index = 0; index < coordinates.length; index += 1) {
      const current = coordinates[index];
      if (index && Math.abs(Number(current[0]) - Number(coordinates[index - 1][0])) > 180) segments.push([]);
      segments.at(-1).push(current);
    }
    return segments.filter(segment => segment.length > 1);
  }

  #renderRoutes() {
    this.routeLayer.replaceChildren();
    this.routeLookup.clear();
    if (!this.routesVisible) return;
    for (const [index, feature] of (this.routes?.features || []).entries()) {
      if (feature.geometry?.type !== 'LineString') continue;
      const key = String(feature.properties?.id || `route-${index}`);
      this.routeLookup.set(key, feature);
      for (const segment of this.#routeSegments(feature.geometry.coordinates || [])) {
        const points = segment.map(([lon, lat]) => this.#project({ lon, lat }));
        const path = svgElement('path', {
          d: points.map((point, i) => `${i ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' '),
          class: 'detailed-route', stroke: feature.properties?.colour || feature.properties?.color || '#39bfff',
          'data-route-key': key, 'data-map-title': feature.properties?.name || 'Route',
          'data-map-meta': Number.isFinite(Number(feature.properties?.risk)) ? `RISK ${Number(feature.properties.risk).toFixed(0)}` : 'SHIPPING CORRIDOR'
        });
        this.routeLayer.append(path);
      }
    }
  }

  #eligibleEvents(set) {
    const events = set === 'local' ? this.localEvents : this.globalEvents;
    return events.filter(finiteCoordinate).slice(0, set === 'local' ? 1500 : 6000);
  }

  #renderEvents(set) {
    const layer = set === 'local' ? this.localLayer : this.globalLayer;
    const eligible = this.#eligibleEvents(set);
    layer.replaceChildren();
    if (!this.layerState.events) return;

    // Individual earthquakes remain visible at world scale. Clustering is only
    // used for exceptionally dense non-earthquake sets.
    const shouldCluster = set === 'global' && this.clustersVisible && this.zoom === 1 && eligible.length > 4500;
    if (shouldCluster) {
      const groups = new Map();
      for (const [index, item] of eligible.entries()) {
        const p = this.#project(item);
        const key = `${Math.floor(p.x / 24)}:${Math.floor(p.y / 24)}`;
        const group = groups.get(key) || { x: 0, y: 0, lat: 0, lon: 0, count: 0, items: [] };
        group.x += p.x; group.y += p.y; group.lat += Number(item.lat); group.lon += Number(item.lon); group.count += 1; group.items.push([item, index]);
        groups.set(key, group);
      }
      for (const group of groups.values()) {
        if (group.count < 4) { group.items.forEach(([item, index]) => this.#appendMarker(layer, item, index, set)); continue; }
        const x = group.x / group.count; const y = group.y / group.count;
        const circle = svgElement('circle', { cx: x, cy: y, r: clamp(6 + Math.log2(group.count) * 1.4, 7, 18), class: 'detailed-cluster', 'data-cluster-lat': group.lat / group.count, 'data-cluster-lon': group.lon / group.count, 'data-map-title': `${group.count} EVENTS`, 'data-map-meta': 'CLICK TO EXPAND' });
        const label = svgElement('text', { x, y: y + 3, class: 'detailed-cluster-label', 'text-anchor': 'middle', 'pointer-events': 'none' });
        label.textContent = String(group.count);
        layer.append(circle, label);
      }
      return;
    }
    eligible.forEach((item, index) => this.#appendMarker(layer, item, index, set));
  }

  #appendMarker(layer, item, index, set) {
    const p = this.#project(item);
    if (p.x < -25 || p.y < -25 || p.x > this.size.width + 25 || p.y > this.size.height + 25) return;
    const key = eventKey(item, index, set);
    this.eventLookup.set(key, item);
    const colour = categoryColour(item, set);
    const radius = markerRadius(item, set, this.zoom);
    const category = String(item.category || '').toLowerCase();
    const group = svgElement('g', { class: `detailed-event-marker detailed-event-${category || 'other'}`, 'data-event-key': key, tabindex: 0 });
    if (category === 'earthquake' && Number(item.magnitude) >= 4.5) group.append(svgElement('circle', { cx: p.x, cy: p.y, r: radius * 1.9, fill: colour, class: 'detailed-event-pulse', opacity: .13 }));
    group.append(svgElement('circle', {
      cx: p.x, cy: p.y, r: radius, fill: colour, class: 'detailed-event-core', 'data-event-key': key,
      'data-map-title': titleFor(item),
      'data-map-meta': [String(item.category || '').toUpperCase(), item.source, Number.isFinite(Number(item.magnitude)) ? `M${Number(item.magnitude).toFixed(1)}` : Number.isFinite(Number(item.severity)) ? `SEV ${Number(item.severity).toFixed(1)}` : ''].filter(Boolean).join(' / ')
    }));
    layer.append(group);
  }

  #renderHeat() {
    this.heatLayer.replaceChildren();
    if (!this.layerState.heat || this.zoom > 5) return;
    const events = [...this.globalEvents, ...this.localEvents].filter(finiteCoordinate).slice(0, 4500);
    for (const item of events) {
      const p = this.#project(item);
      if (p.x < -60 || p.y < -60 || p.x > this.size.width + 60 || p.y > this.size.height + 60) continue;
      const magnitude = Number(item.magnitude ?? item.severity ?? 1);
      const radius = clamp(7 + (Number.isFinite(magnitude) ? magnitude * 2.4 : 3), 8, 28);
      this.heatLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: radius, fill: categoryColour(item, 'global'), class: 'detailed-heat-spot' }));
    }
  }

  #renderScan() {
    this.scanLayer.replaceChildren();
    const point = this.centerPoint || this.center;
    const p = this.#project(point);
    const rect = this.#worldRect();
    const kmPerPixel = Math.max(.01, 40075 * Math.max(.1, Math.cos(Number(point.lat) * Math.PI / 180)) / rect.width);
    const radius = clamp(this.radiusKm / kmPerPixel, 8, Math.max(this.size.width, this.size.height) * 1.5);
    this.scanLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: radius, class: 'detailed-radius' }));
    this.scanLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: 12, class: 'detailed-point-halo' }));
    this.scanLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: 4, class: 'detailed-point' }));
  }

  #renderStatus() { this.status.textContent = `LOCAL MAP / Z${this.zoom} / ${this.globalEvents.length + this.localEvents.length} MARKERS`; }

  #renderAll({ base = true } = {}) {
    if (base) this.#renderBase();
    this.overlay.setAttribute('viewBox', `0 0 ${this.size.width} ${this.size.height}`);
    this.overlay.setAttribute('width', String(this.size.width));
    this.overlay.setAttribute('height', String(this.size.height));
    this.eventLookup.clear();
    this.#renderGrid(); this.#renderHeat(); this.#renderRoutes(); this.#renderEvents('global'); this.#renderEvents('local'); this.#renderScan(); this.#renderStatus();
  }

  #selectMarker(marker) {
    this.overlay.querySelectorAll('.selected').forEach(node => node.classList.remove('selected'));
    marker.closest('.detailed-event-marker')?.classList.add('selected');
  }

  #updateTooltip(event) {
    const target = event.target.closest?.('[data-map-title]');
    if (!target) { this.tooltip.classList.add('hidden'); return; }
    this.tooltip.innerHTML = `<strong>${safeText(target.dataset.mapTitle)}</strong><span>${safeText(target.dataset.mapMeta)}</span>`;
    const box = this.container.getBoundingClientRect();
    this.tooltip.style.left = `${event.clientX - box.left + 14}px`;
    this.tooltip.style.top = `${event.clientY - box.top + 14}px`;
    this.tooltip.classList.remove('hidden');
  }

  updateGeometry(point, radiusKm) {
    if (finiteCoordinate(point)) this.centerPoint = { lat: Number(point.lat), lon: Number(point.lon) };
    this.radiusKm = Number(radiusKm) || this.radiusKm;
    this.#renderScan();
  }
  setEvents(events, set = 'global') {
    if (set === 'local') this.localEvents = Array.isArray(events) ? events : [];
    else this.globalEvents = Array.isArray(events) ? events : [];
    this.eventLookup.clear(); this.#renderHeat(); this.#renderEvents(set); this.#renderStatus();
  }
  setRoutes(collection) { this.routes = collection || { type: 'FeatureCollection', features: [] }; this.#renderRoutes(); }
  setRoutesVisible(visible) { this.routesVisible = Boolean(visible); this.#renderRoutes(); }
  setClustersVisible(visible) { this.clustersVisible = Boolean(visible); this.#renderEvents('global'); }
  flyTo(point, options = {}) {
    if (!finiteCoordinate(point)) return;
    this.center = { lat: Number(point.lat), lon: Number(point.lon) };
    if (Number.isFinite(Number(options.zoom))) this.zoom = clamp(Math.round(Number(options.zoom)), MIN_ZOOM, MAX_ZOOM);
    this.center = this.#clampCenter(this.center);
    this.#renderAll();
  }
  fitBounds(coordinates, options = {}) {
    const points = [];
    const visit = value => {
      if (Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) points.push({ lon: Number(value[0]), lat: Number(value[1]) });
      else if (Array.isArray(value)) value.forEach(visit);
    };
    visit(coordinates);
    if (!points.length) return;
    const minLat = Math.min(...points.map(point => point.lat)); const maxLat = Math.max(...points.map(point => point.lat));
    const minLon = Math.min(...points.map(point => point.lon)); const maxLon = Math.max(...points.map(point => point.lon));
    this.center = { lat: (minLat + maxLat) / 2, lon: (minLon + maxLon) / 2 };
    const span = Math.max((maxLon - minLon) / 360, (maxLat - minLat) / 180, .01);
    this.zoom = clamp(Math.floor(1 + Math.log2(.72 / span)), MIN_ZOOM, MAX_ZOOM);
    this.center = this.#clampCenter(this.center);
    this.#renderAll();
  }
  resize() {
    const bounds = this.container.getBoundingClientRect();
    const width = Math.max(320, Math.round(bounds.width || this.container.clientWidth || 1200));
    const height = Math.max(320, Math.round(bounds.height || this.container.clientHeight || 600));
    if (width === this.size.width && height === this.size.height) return;
    this.size = { width, height };
    this.#renderAll();
  }
  destroy() {
    this.resizeObserver?.disconnect?.();
    window.removeEventListener('resize', this.boundWindowResize);
    this.container.replaceChildren();
    this.container.classList.remove('fallback-map-active', 'local-detailed-map', 'dragging');
  }
}
