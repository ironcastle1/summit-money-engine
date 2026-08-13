const TECH_STYLE = {
  version: 8,
  name: 'Merlin Dark Blue Relief',
  sources: {
    tech: {
      type: 'raster',
      tiles: ['/assets/tech-map/{z}/{x}/{y}.jpg'],
      tileSize: 512,
      minzoom: 0,
      maxzoom: 3,
      attribution: 'Physical relief: NASA / Natural Earth-derived bundled cartography',
    },
  },
  layers: [
    { id: 'merlin-tech-background', type: 'background', paint: { 'background-color': '#020813' } },
    { id: 'merlin-tech-raster', type: 'raster', source: 'tech', paint: {
      'raster-opacity': 1,
      'raster-saturation': 0.08,
      'raster-contrast': 0.14,
      'raster-brightness-min': 0.02,
      'raster-brightness-max': 0.88,
      'raster-fade-duration': 80,
    } },
  ],
};

const SATELLITE_STYLE = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Tiles © Esri',
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'satellite-background', type: 'background', paint: { 'background-color': '#01070d' } },
    { id: 'satellite', type: 'raster', source: 'satellite', paint: {
      'raster-saturation': -0.08,
      'raster-contrast': 0.18,
      'raster-brightness-min': 0.01,
      'raster-brightness-max': 0.72,
    } },
  ],
};

export class MerlinMap {
  constructor(viewport, { onChange = () => {}, onTiles = () => {} } = {}) {
    this.viewport = viewport;
    this.container = viewport.querySelector('#glMap');
    this.fallback = viewport.querySelector('#fallbackMap');
    this.fallbackOverlay = viewport.querySelector('#fallbackOverlay');
    this.fallbackRoutes = viewport.querySelector('#fallbackRouteLayer');
    this.unavailable = viewport.querySelector('#mapUnavailable');
    this.onChange = onChange;
    this.onTiles = onTiles;
    this.styleReadyHandlers = new Set();
    this.center = { lat: 24, lon: 18 };
    this.zoom = 2.05;
    this.minZoom = 1.25;
    this.maxZoom = 9.2;
    this.basemap = 'tech';
    this.map = null;
    this.lib = null;
    this.ready = false;
    this.styleReady = false;
    this.mode = 'fallback';
    this.loadErrors = 0;
    this._cameraQueue = null;
    this.viewport.dataset.basemap = 'tech';
    this._showFallback();
    this._init();
  }

  async _init() {
    try {
      this.lib = window.__MERLIN_MAPLIBRE__ || await import('/vendor/maplibre-gl.mjs');
      const MapClass = this.lib.Map;
      if (!MapClass) throw new Error('Map renderer did not load');
      this.map = new MapClass({
        container: this.container,
        style: TECH_STYLE,
        center: [this.center.lon, this.center.lat],
        zoom: this.zoom,
        minZoom: this.minZoom,
        maxZoom: this.maxZoom,
        attributionControl: false,
        maplibreLogo: false,
        renderWorldCopies: true,
        pitchWithRotate: false,
        dragRotate: false,
        cooperativeGestures: false,
        fadeDuration: 100,
        antialias: true,
      });
      if (this.map.touchZoomRotate?.disableRotation) this.map.touchZoomRotate.disableRotation();
      if (this.lib.AttributionControl) this.map.addControl(new this.lib.AttributionControl({ compact: true, customAttribution: 'MERLIN relief · Natural Earth / NASA' }), 'bottom-right');
      this.map.on('load', () => {
        this.ready = true; this.styleReady = true; this.mode = 'gl';
        this._showGL(); this._syncCamera(); this._installTechDecoration(); this._notifyStyleReady(); this._reportMapState('ready');
        if (this._cameraQueue) { const q = this._cameraQueue; this._cameraQueue = null; this.focus(q.lat, q.lon, q.zoom, q.animate); }
      });
      this.map.on('style.load', () => {
        if (!this.ready) return;
        this.styleReady = true;
        this._installTechDecoration();
        this._notifyStyleReady();
        this._reportMapState('ready');
      });
      this.map.on('idle', () => { this._showGL(); this._reportMapState('ready'); });
      this.map.on('move', () => { this._syncCamera(); this.onChange(this.state(), { transient: true }); });
      this.map.on('moveend', () => { this._syncCamera(); this.onChange(this.state(), { transient: false }); });
      this.map.on('zoom', () => this._syncCamera());
      this.map.on('error', event => this._handleMapError(event));
      setTimeout(() => { if (!this.ready) this._showFallback(); }, 4500);
    } catch (error) {
      this.loadErrors++;
      this._showFallback();
      this.onTiles({ loaded: 1, failed: this.loadErrors, pending: 0, basemap: 'local-tech', error: error.message });
    }
  }

  getMap() { return this.map; }
  isReady() { return Boolean(this.map && this.ready && this.styleReady); }
  isFallback() { return this.mode === 'fallback'; }
  getFallbackOverlay() { return this.fallbackOverlay; }
  getFallbackRoutes() { return this.fallbackRoutes; }
  setOnChange(fn) { this.onChange = typeof fn === 'function' ? fn : () => {}; }
  setOnStyleReady(fn) { if (typeof fn !== 'function') return () => {}; this.styleReadyHandlers.add(fn); if (this.isReady()) queueMicrotask(() => fn(this.map)); return () => this.styleReadyHandlers.delete(fn); }
  state() { return { lat: this.center.lat, lon: this.center.lon, zoom: this.zoom, basemap: this.basemap, mode: this.mode }; }

  setBasemap(name) {
    if (!['tech', 'satellite'].includes(name) || name === this.basemap) return;
    this.basemap = name;
    this.viewport.dataset.basemap = name;
    if (!this.map || !this.ready) return;
    this.styleReady = false;
    this.map.setStyle(name === 'satellite' ? SATELLITE_STYLE : TECH_STYLE, { diff: false });
    this._reportMapState('loading');
  }

  focus(lat, lon, zoom = this.zoom, animate = true) {
    const t = { lat: clampMap(Number(lat), -84.8, 84.8), lon: wrapLon(Number(lon)), zoom: clampMap(Number(zoom), this.minZoom, this.maxZoom), animate };
    this.center = { lat: t.lat, lon: t.lon }; this.zoom = t.zoom;
    if (!this.map || !this.ready) { this._applyFallbackFocus(); this.onChange(this.state(), { transient: false }); return; }
    const method = animate ? 'easeTo' : 'jumpTo';
    const options = { center: [t.lon, t.lat], zoom: t.zoom };
    if (animate) Object.assign(options, { duration: 500, essential: true, easing: x => 1 - Math.pow(1 - x, 3) });
    this.map[method](options);
  }
  world() { this.center = { lat: 20, lon: 18 }; this.zoom = 2.05; if (this.isFallback()) this._resetFallback(); else this.focus(20, 18, 2.05, true); }
  setZoom(value) { this.zoom = clampMap(Number(value), this.minZoom, this.maxZoom); if (this.map && this.ready) this.map.easeTo({ zoom: this.zoom, duration: 220, essential: true }); else this._applyFallbackFocus(); }
  project(lat, lon) {
    if (this.map && this.ready) { const p = this.map.project([Number(lon), Number(lat)]); return { x: p.x, y: p.y }; }
    const r=this.viewport.getBoundingClientRect(),baseX=((Number(lon)+180)/360)*r.width,baseY=((90-Number(lat))/180)*r.height;
    const scale=Math.max(1,Math.min(2.4,1+(this.zoom-2)*.36)),tx=-(this.center.lon/180)*.18*r.width,ty=(this.center.lat/90)*.12*r.height;
    return {x:(baseX-r.width/2)*scale+r.width/2+tx,y:(baseY-r.height/2)*scale+r.height/2+ty};
  }
  render() { if (this.map) this.map.resize(); }

  _installTechDecoration() {
    if (!this.map || !this.styleReady) return;
    const gl = this.map;
    try {
      if (!gl.getSource('merlin-tech-lines')) gl.addSource('merlin-tech-lines', { type: 'geojson', data: '/data/tech-base-lines.json' });
      if (!gl.getLayer('merlin-tech-coast-glow')) gl.addLayer({ id: 'merlin-tech-coast-glow', type: 'line', source: 'merlin-tech-lines', filter: ['==', ['get', 'kind'], 'coast'], paint: { 'line-color': '#1fa6c7', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.45, 5, 1.1], 'line-opacity': 0.25, 'line-blur': 1.8 } });
      if (!gl.getLayer('merlin-tech-coast')) gl.addLayer({ id: 'merlin-tech-coast', type: 'line', source: 'merlin-tech-lines', filter: ['==', ['get', 'kind'], 'coast'], paint: { 'line-color': '#5b8494', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.25, 5, 0.65], 'line-opacity': 0.58 } });
      if (!gl.getLayer('merlin-tech-borders')) gl.addLayer({ id: 'merlin-tech-borders', type: 'line', source: 'merlin-tech-lines', filter: ['==', ['get', 'kind'], 'country'], paint: { 'line-color': '#8c7549', 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.22, 5, 0.72], 'line-opacity': 0.55, 'line-dasharray': [2, 1.5] } });
      const grid = gridGeoJSON();
      if (!gl.getSource('merlin-tech-grid')) gl.addSource('merlin-tech-grid', { type: 'geojson', data: grid });
      if (!gl.getLayer('merlin-tech-grid')) gl.addLayer({ id: 'merlin-tech-grid', type: 'line', source: 'merlin-tech-grid', paint: { 'line-color': '#0a6d91', 'line-width': 0.45, 'line-opacity': ['interpolate', ['linear'], ['zoom'], 1, 0.12, 4, 0.04] } });
    } catch (error) { console.warn('Map decoration unavailable', error); }
  }
  _resetFallback() { if (this.fallback) { this.fallback.style.setProperty('--fb-scale', '1'); this.fallback.style.setProperty('--fb-x', '0%'); this.fallback.style.setProperty('--fb-y', '0%'); } }
  _applyFallbackFocus() { if (!this.fallback) return; const scale = Math.max(1, Math.min(2.4, 1 + (this.zoom - 2) * .36)); const x = -(this.center.lon / 180) * 18; const y = (this.center.lat / 90) * 12; this.fallback.style.setProperty('--fb-scale', String(scale)); this.fallback.style.setProperty('--fb-x', `${x}%`); this.fallback.style.setProperty('--fb-y', `${y}%`); }
  _showFallback() { this.mode = 'fallback'; this.ready = false; this.styleReady = false; this.fallback?.classList.remove('hidden'); this.container?.classList.add('map-loading'); this.unavailable?.classList.add('hidden'); this.viewport.dataset.mapmode = 'local'; this._reportMapState('fallback'); }
  _showGL() { this.mode = 'gl'; this.fallback?.classList.add('hidden'); this.container?.classList.remove('map-loading'); this.unavailable?.classList.add('hidden'); this.viewport.dataset.mapmode = 'vector'; }
  _syncCamera() { if (!this.map) return; const c = this.map.getCenter?.(); if (c) this.center = { lat: Number(c.lat), lon: Number(c.lng) }; const z = this.map.getZoom?.(); if (Number.isFinite(z)) this.zoom = Number(z); }
  _notifyStyleReady() { for (const fn of this.styleReadyHandlers) { try { fn(this.map); } catch {} } }
  _handleMapError(event) { this.loadErrors++; const message = event?.error?.message || 'Map resource failed'; this.onTiles({ loaded: this.ready ? 1 : 0, failed: this.loadErrors, pending: this.ready ? 0 : 1, basemap: this.basemap, error: message }); if (!this.ready && this.loadErrors >= 2) this._showFallback(); }
  _reportMapState(status) { this.onTiles({ loaded: 1, failed: this.loadErrors, pending: status === 'loading' ? 1 : 0, basemap: this.mode === 'fallback' ? 'local-tech' : this.basemap, mode: this.mode }); }
}

function gridGeoJSON() {
  const features = [];
  for (let lon = -150; lon <= 180; lon += 30) features.push({ type: 'Feature', properties: { axis: 'lon' }, geometry: { type: 'LineString', coordinates: Array.from({ length: 35 }, (_, i) => [lon, -85 + i * 5]) } });
  for (let lat = -60; lat <= 75; lat += 15) features.push({ type: 'Feature', properties: { axis: 'lat' }, geometry: { type: 'LineString', coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat]) } });
  return { type: 'FeatureCollection', features };
}
function clampMap(v, min, max) { return Math.min(max, Math.max(min, v)); }
function wrapLon(lon) { let v = Number.isFinite(lon) ? lon : 0; while (v > 180) v -= 360; while (v < -180) v += 360; return v; }
