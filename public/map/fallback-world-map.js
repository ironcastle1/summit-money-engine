const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 1200;
const HEIGHT = 600;

const CONTINENTS = Object.freeze([
  [[-168,72],[-140,69],[-125,55],[-123,42],[-115,31],[-100,22],[-84,10],[-77,9],[-66,18],[-60,46],[-79,58],[-105,72]],
  [[-82,12],[-70,7],[-52,5],[-35,-5],[-40,-23],[-55,-55],[-72,-52],[-77,-20]],
  [[-10,36],[2,44],[20,50],[39,56],[60,61],[92,72],[140,62],[170,52],[155,35],[121,20],[108,5],[82,8],[58,23],[42,12],[33,29],[18,32]],
  [[-18,35],[10,37],[32,31],[51,12],[43,-12],[31,-35],[16,-35],[2,-25],[-10,5]],
  [[112,-11],[154,-10],[153,-39],[133,-44],[114,-34]],
  [[-73,83],[-22,83],[-16,61],[-45,59],[-61,69]],
  [[-180,-68],[-120,-73],[-60,-70],[0,-75],[70,-70],[140,-74],[180,-68],[180,-90],[-180,-90]]
]);

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

export class FallbackWorldMap {
  constructor({ container, onSelect, onEvent }) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    this.onSelect = onSelect;
    this.onEvent = onEvent;
    this.routesVisible = false;
    this.clustersVisible = true;
    this.globalEvents = [];
    this.localEvents = [];
    this.routes = { type: 'FeatureCollection', features: [] };
    this.point = { lat: 51.5074, lon: -0.1278 };
    this.radiusKm = 250;
    this.#renderShell();
  }

  #renderShell() {
    this.container.replaceChildren();
    this.container.classList.add('fallback-map-active');
    this.svg = svgElement('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: 'img', 'aria-label': 'Interactive world intelligence map' });
    this.svg.classList.add('fallback-world-map');
    const defs = svgElement('defs');
    const glow = svgElement('filter', { id: 'fallback-glow', x: '-100%', y: '-100%', width: '300%', height: '300%' });
    glow.append(svgElement('feGaussianBlur', { stdDeviation: '4', result: 'blur' }));
    const merge = svgElement('feMerge');
    merge.append(svgElement('feMergeNode', { in: 'blur' }), svgElement('feMergeNode', { in: 'SourceGraphic' }));
    glow.append(merge); defs.append(glow); this.svg.append(defs);

    const ocean = svgElement('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, class: 'fallback-ocean' });
    this.svg.append(ocean);
    const grid = svgElement('g', { class: 'fallback-grid' });
    for (let lon = -150; lon <= 150; lon += 30) { const a = project([lon, -90]); const b = project([lon, 90]); grid.append(svgElement('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y })); }
    for (let lat = -60; lat <= 60; lat += 30) { const a = project([-180, lat]); const b = project([180, lat]); grid.append(svgElement('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y })); }
    this.svg.append(grid);
    const land = svgElement('g', { class: 'fallback-land' });
    for (const polygon of CONTINENTS) land.append(svgElement('path', { d: `${pathFromCoordinates(polygon)} Z` }));
    this.svg.append(land);
    this.routeLayer = svgElement('g', { class: 'fallback-routes' });
    this.globalLayer = svgElement('g', { class: 'fallback-global-events' });
    this.localLayer = svgElement('g', { class: 'fallback-local-events' });
    this.scanLayer = svgElement('g', { class: 'fallback-scan' });
    this.svg.append(this.routeLayer, this.globalLayer, this.localLayer, this.scanLayer);
    this.container.append(this.svg);
    this.badge = document.createElement('div');
    this.badge.className = 'fallback-map-badge';
    this.badge.innerHTML = '<strong>MAP FALLBACK</strong><span>INTERACTIVE / CDN INDEPENDENT</span>';
    this.container.append(this.badge);
    this.svg.addEventListener('click', event => {
      const target = event.target.closest('[data-event-index]');
      if (target) {
        const collection = target.dataset.eventSet === 'local' ? this.localEvents : this.globalEvents;
        const item = collection[Number(target.dataset.eventIndex)];
        if (item) this.onEvent?.(item);
        return;
      }
      const box = this.svg.getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width) * WIDTH;
      const y = ((event.clientY - box.top) / box.height) * HEIGHT;
      this.onSelect?.(unproject(x, y));
    });
    this.updateGeometry(this.point, this.radiusKm);
  }

  updateGeometry(point, radiusKm) {
    this.point = point;
    this.radiusKm = radiusKm;
    this.scanLayer.replaceChildren();
    const p = project(point);
    const rx = Math.max(3, (Number(radiusKm) / 40075) * WIDTH * 2);
    const ry = Math.max(3, (Number(radiusKm) / 20004) * HEIGHT * 2);
    this.scanLayer.append(svgElement('ellipse', { cx: p.x, cy: p.y, rx, ry, class: 'fallback-radius' }));
    this.scanLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: 7, class: 'fallback-point-halo' }));
    this.scanLayer.append(svgElement('circle', { cx: p.x, cy: p.y, r: 3.2, class: 'fallback-point' }));
  }

  setEvents(events, set = 'global') {
    const layer = set === 'local' ? this.localLayer : this.globalLayer;
    if (set === 'local') this.localEvents = events || []; else this.globalEvents = events || [];
    layer.replaceChildren();
    (events || []).slice(0, set === 'local' ? 500 : 1500).forEach((event, index) => {
      if (!Number.isFinite(Number(event.lat)) || !Number.isFinite(Number(event.lon))) return;
      const p = project(event);
      const severity = Math.max(0, Math.min(5, Number(event.severity) || 1));
      const circle = svgElement('circle', {
        cx: p.x, cy: p.y, r: set === 'local' ? 4 + severity : 2.2 + severity * .55,
        class: `fallback-event fallback-event-${set}`,
        'data-event-index': index,
        'data-event-set': set,
        tabindex: 0
      });
      const title = svgElement('title'); title.textContent = `${event.title || event.category || 'Event'} / ${event.source || 'source'}`;
      circle.append(title); layer.append(circle);
    });
  }

  setRoutes(collection) {
    this.routes = collection || { type: 'FeatureCollection', features: [] };
    this.routeLayer.replaceChildren();
    for (const feature of this.routes.features || []) {
      const coordinates = feature.geometry?.coordinates || [];
      if (feature.geometry?.type !== 'LineString' || !coordinates.length) continue;
      this.routeLayer.append(svgElement('path', { d: pathFromCoordinates(coordinates), class: 'fallback-route' }));
    }
    this.routeLayer.classList.toggle('visible', this.routesVisible);
  }

  setRoutesVisible(visible) { this.routesVisible = Boolean(visible); this.routeLayer.classList.toggle('visible', this.routesVisible); }
  setClustersVisible(visible) { this.clustersVisible = Boolean(visible); this.globalLayer.classList.toggle('clusters-off', !this.clustersVisible); }
  flyTo(point) { this.updateGeometry(point, this.radiusKm); }
  resize() {}
  destroy() { this.container.replaceChildren(); }
}
