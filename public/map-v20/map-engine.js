import { DEFAULT_LAYERS } from './constants.js';
import { ViewportModel } from './viewport-model.js';
import { EventBus } from './event-bus.js';
import { TileLayer } from './tile-layer.js';
import { tileSourceForMode } from './tile-source.js';
import { SvgSurface } from './svg-surface.js';
import { FeatureStore } from './feature-store.js';
import { EntityRegistry } from './entity-registry.js';
import { LayerRegistry } from './layer-registry.js';
import { LayerRuntime } from './layer-runtime.js';
import { MarkerRenderer } from './marker-renderer.js';
import { ClusterRenderer } from './cluster-renderer.js';
import { RouteRenderer } from './route-renderer.js';
import { LabelRenderer } from './label-renderer.js';
import { PolygonRenderer } from './polygon-renderer.js';
import { HeatRenderer } from './heat-renderer.js';
import { RasterRenderer } from './raster-renderer.js';
import { GestureController } from './gesture-controller.js';
import { KeyboardController } from './keyboard-controller.js';
import { TooltipController } from './tooltip-controller.js';
import { InteractionController } from './interaction-controller.js';
import { installMapSearchToggle } from './search-toggle.js';

function pointFor(item, layer) {
  if (layer === 'ports') return item.coordinates;
  if (layer === 'news') return item.mapPoint || item.coordinates;
  if (['places', 'focus', 'watch'].includes(layer)) return item.coordinates || { lat: item.lat ?? item.country?.lat, lon: item.lon ?? item.country?.lon };
  return item.coordinates || { lat: item.lat, lon: item.lon };
}

function pointFeature(item, layer, index) {
  const point = pointFor(item, layer);
  if (!Number.isFinite(Number(point?.lat)) || !Number.isFinite(Number(point?.lon))) return null;
  const nameEnglish = item.nameEnglish || item.name || item.country?.name || item.title || item.category || 'Map item';
  const nameLocal = item.nameLocal || item.nativeName || item.country?.nativeName || '';
  const kind = layer === 'places' ? 'PLACE' : layer === 'focus' ? 'FOCUS' : layer === 'watch' ? 'WATCH' : layer === 'events' ? String(item.kind || item.category || 'EVENT').toUpperCase() : layer.slice(0, -1).toUpperCase();
  return {
    type: 'Feature',
    id: String(item.id || `${layer}:${index}`),
    geometry: { type: 'Point', coordinates: [Number(point.lon), Number(point.lat)] },
    properties: { ...item, kind, nameEnglish, nameLocal },
    __data: item
  };
}

function routeFeature(item, index) {
  const coordinates = item.geometry?.coordinates || item.coordinates || item.points?.map(point => [point.lon, point.lat]) || [];
  if (!coordinates.length) return null;
  return {
    type: 'Feature',
    id: String(item.id || item.properties?.id || `route:${index}`),
    geometry: item.geometry || { type: 'LineString', coordinates },
    properties: { ...item.properties, ...item, kind: 'ROUTE' },
    __data: item
  };
}

export class MapEngineV20 {
  constructor(options = {}) {
    this.container = typeof options.container === 'string' ? document.getElementById(options.container) : options.container;
    if (!this.container) throw new Error('Map container not found');
    this.onSelect = options.onSelect;
    this.onEntity = options.onEntity;
    this.events = new EventBus();
    this.layersState = { ...DEFAULT_LAYERS };
    this.container.replaceChildren();
    this.container.classList.add('merlin-v20-map', 'map-ready');

    this.localBase = document.createElement('img');
    this.localBase.className = 'merlin-v20-local-base';
    this.localBase.src = '/assets/world-base.svg?v=24.1.0';
    this.localBase.alt = '';
    this.localBase.draggable = false;

    this.tileContainer = document.createElement('div');
    this.tileContainer.className = 'merlin-v20-tiles';
    this.container.append(this.localBase, this.tileContainer);

    this.viewport = new ViewportModel({
      center: options.initialPoint,
      zoom: options.initialZoom,
      width: this.container.clientWidth || 1280,
      height: this.container.clientHeight || 720
    });
    this.tileLayer = new TileLayer(this.tileContainer, tileSourceForMode(options.tileMode || 'dark'));
    this.surface = new SvgSurface(this.container);
    this.features = new FeatureStore();
    this.entities = new EntityRegistry();
    this.layerRegistry = new LayerRegistry([
      { id: 'routes', source: 'routes', renderer: 'route', order: 10, visible: false, style: { colour: '#d4a749', width: 2.2, opacity: .88 } },
      { id: 'events', source: 'events', renderer: 'cluster', order: 20, visible: true, style: { colour: '#f35d6f', clusterRadius: 50, clusterMaxZoom: 7 } },
      { id: 'news', source: 'news', renderer: 'cluster', order: 30, visible: true, style: { colour: '#58b8e7', clusterRadius: 48, clusterMaxZoom: 7 } },
      { id: 'focus', source: 'focus', renderer: 'marker', order: 34, visible: true, minimumZoom: 1.5, style: { colour: '#d4a749', radius: 3.5 } },
      { id: 'watch', source: 'watch', renderer: 'marker', order: 36, visible: true, minimumZoom: 2, style: { colour: '#ec9250', radius: 4.6 } },
      { id: 'ports', source: 'ports', renderer: 'marker', order: 40, visible: true, minimumZoom: 2, style: { colour: '#59d4d0', radius: 4.8 } },
      { id: 'places', source: 'places', renderer: 'marker', order: 50, visible: false, minimumZoom: 5.5, style: { colour: '#53636d', radius: 2.8 } },
      { id: 'labels', source: 'places', renderer: 'label', order: 60, visible: true, minimumZoom: 1.8, style: { maximum: 220 } }
    ]);

    this.runtime = new LayerRuntime({
      surface: this.surface,
      layers: this.layerRegistry,
      features: this.features,
      entities: this.entities
    })
      .registerRenderer('marker', new MarkerRenderer())
      .registerRenderer('cluster', new ClusterRenderer())
      .registerRenderer('route', new RouteRenderer())
      .registerRenderer('label', new LabelRenderer())
      .registerRenderer('polygon', new PolygonRenderer())
      .registerRenderer('heat', new HeatRenderer())
      .registerRenderer('raster', new RasterRenderer());

    this.tooltip = new TooltipController(this.container);
    this.interaction = new InteractionController({
      surface: this.surface.root,
      entities: this.entities,
      tooltip: this.tooltip,
      select: entity => this.#selectEntity(entity)
    });
    this.gestures = new GestureController({
      element: this.container,
      viewport: this.viewport,
      changed: reason => this.render(reason),
      click: event => this.#selectPoint(event)
    });
    this.keyboard = new KeyboardController({
      element: this.container,
      viewport: this.viewport,
      changed: reason => this.render(reason)
    });
    this.searchToggle = installMapSearchToggle();
    this.status = document.createElement('div');
    this.status.className = 'merlin-v20-status';
    this.container.append(this.status);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.render('init');
  }

  get zoom() { return this.viewport.state.zoom; }
  on(type, listener) { return this.events.on(type, listener); }
  getViewport() {
    const state = this.viewport.snapshot();
    const northWest = this.viewport.unproject({ x: 0, y: 0 });
    const southEast = this.viewport.unproject({ x: state.size.width, y: state.size.height });
    return {
      ...state,
      bounds: { west: northWest.lon, north: northWest.lat, east: southEast.lon, south: southEast.lat }
    };
  }

  setData(data = {}) {
    const groups = {
      events: [...(data.events || [])].map((item, index) => pointFeature(item, 'events', index)).filter(Boolean),
      news: [...(data.news || [])].map((item, index) => pointFeature(item, 'news', index)).filter(Boolean),
      focus: [...(data.focus || [])].map((item, index) => pointFeature(item, 'focus', index)).filter(Boolean),
      watch: [...(data.watch || [])].map((item, index) => pointFeature(item, 'watch', index)).filter(Boolean),
      ports: [...(data.ports || [])].map((item, index) => pointFeature(item, 'ports', index)).filter(Boolean),
      places: [...(data.places || [])].map((item, index) => pointFeature(item, 'places', index)).filter(Boolean),
      routes: [...(data.routes || [])].map(routeFeature).filter(Boolean)
    };
    for (const [id, values] of Object.entries(groups)) this.features.set(id, values);
    this.render('data');
  }

  setLayerVisibility(values = {}) {
    this.layersState = { ...this.layersState, ...values };
    for (const id of ['events', 'news', 'focus', 'watch', 'routes', 'ports', 'places', 'labels']) {
      if (id in values) this.layerRegistry.setVisible(id, values[id]);
    }
    this.render('layers');
  }

  setTileMode(mode) {
    this.tileLayer.setSource(tileSourceForMode(mode));
    this.container.dataset.mapStyle = mode;
    this.render('style');
  }

  setZoom(value) {
    this.viewport.setZoom(Math.round(value));
    this.render('zoom');
  }

  flyTo(point, options = {}) {
    this.viewport.setCenter(point);
    if (options.zoom !== undefined) this.viewport.setZoom(Math.round(options.zoom));
    this.render('fly');
  }

  resize() {
    const box = this.container.getBoundingClientRect();
    this.viewport.resize(box.width, box.height);
    this.surface.resize(this.viewport.state.size.width, this.viewport.state.size.height);
    this.render('resize');
  }

  render(reason = 'render') {
    const state = this.viewport.snapshot();
    this.tileLayer.render(state);
    this.runtime.render(this.viewport);
    this.localBase.style.display = ''; this.localBase.style.opacity = this.tileLayer.source?.enabled ? '.16' : '.42';
    this.status.textContent = `Zoom ${Math.round(state.zoom)} · ${state.center.lat.toFixed(1)}, ${state.center.lon.toFixed(1)}`;
    this.events.emit('render', { reason, viewport: this.getViewport(), features: this.features.version });
  }

  #selectEntity(entity) {
    if (entity.kind === 'CLUSTER' && entity.data?.members?.length) {
      const points = entity.data.members.map(feature => ({ lat: feature.geometry.coordinates[1], lon: feature.geometry.coordinates[0] }));
      this.flyTo({
        lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
        lon: points.reduce((sum, point) => sum + point.lon, 0) / points.length
      }, { zoom: Math.min(14, this.zoom + 2) });
      return;
    }
    const data = entity.feature?.__data || entity.data || entity.feature?.properties;
    const kind = String(entity.kind || '').toLowerCase();
    this.onEntity?.({ kind, data, feature: entity.feature });
  }

  #selectPoint(event) {
    if (event.target.closest?.('[data-map-entity]')) return;
    const box = this.container.getBoundingClientRect();
    this.onSelect?.(this.viewport.unproject({ x: event.clientX - box.left, y: event.clientY - box.top }));
  }

  destroy() {
    this.resizeObserver?.disconnect();
    this.gestures.destroy();
    this.keyboard.destroy();
    this.interaction.destroy();
    this.tooltip.destroy();
    this.searchToggle.destroy();
    this.tileLayer.clear();
    this.surface.destroy();
    this.events.clear();
  }
}
