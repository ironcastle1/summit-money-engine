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
import { ThemeBridge } from './theme-bridge.js';
function materialEarthquake(item) {
    const category = String(item?.category || item?.kind || '').toLowerCase();
    if (category !== 'earthquake')
        return true;
    const magnitude = Number(item?.magnitude);
    const severity = Number(item?.severity);
    const significant = Number(item?.attributes?.significance ?? item?.significance);
    return item?.material === true || item?.tsunami === true || item?.shippingImpact === true || item?.infrastructureImpact === true || magnitude >= 6 || severity >= 80 || significant >= 600;
}
function pointFeature(item, layer, index) {
    const point = layer === 'ports' ? item.coordinates : layer === 'news' ? item.mapPoint : layer === 'places' ? { lat: item.lat ?? item.country?.lat ?? item.capitalLat ?? item.country?.capitalLat, lon: item.lon ?? item.country?.lon ?? item.capitalLon ?? item.country?.capitalLon } : { lat: item.lat, lon: item.lon };
    if (!Number.isFinite(Number(point?.lat)) || !Number.isFinite(Number(point?.lon)))
        return null;
    const nameEnglish = item.nameEnglish || item.name || item.country?.name || item.title || item.category;
    const nameLocal = item.nameLocal || item.nativeName || item.country?.nativeName || '';
    return { type: 'Feature', id: String(item.id || `${layer}:${index}`), geometry: { type: 'Point', coordinates: [Number(point.lon), Number(point.lat)] }, properties: { ...item, kind: layer === 'places' ? 'PLACE' : layer.slice(0, -1).toUpperCase(), nameEnglish, nameLocal }, __data: item };
}
function routeFeature(item, index) {
    const coordinates = item.geometry?.coordinates || item.coordinates || item.points?.map(point => [point.lon, point.lat]) || [];
    if (!coordinates.length)
        return null;
    return { type: 'Feature', id: String(item.id || item.properties?.id || `route:${index}`), geometry: item.geometry || { type: 'LineString', coordinates }, properties: { ...item.properties, ...item, kind: 'ROUTE' }, __data: item };
}
export class MapEngineV20 {
    constructor(options = {}) {
        this.container = typeof options.container === 'string' ? document.getElementById(options.container) : options.container;
        if (!this.container)
            throw new Error('Map container not found');
        this.onSelect = options.onSelect;
        this.onEntity = options.onEntity;
        this.events = new EventBus();
        this.layersState = { ...DEFAULT_LAYERS };
        this.container.replaceChildren();
        this.container.classList.add('merlin-v20-map', 'map-ready');
        this.localBase = document.createElement('img');
        this.localBase.className = 'merlin-v20-local-base';
        this.localBase.src = '/assets/world-base.svg?v=20.0.0';
        this.localBase.alt = '';
        this.localBase.draggable = false;
        this.tileContainer = document.createElement('div');
        this.tileContainer.className = 'merlin-v20-tiles';
        this.container.append(this.localBase, this.tileContainer);
        this.viewport = new ViewportModel({ center: options.initialPoint, zoom: options.initialZoom, width: this.container.clientWidth || 1280, height: this.container.clientHeight || 720 });
        this.tileLayer = new TileLayer(this.tileContainer, tileSourceForMode('streets'));
        this.surface = new SvgSurface(this.container);
        this.features = new FeatureStore();
        this.entities = new EntityRegistry();
        this.layerRegistry = new LayerRegistry([
            { id: 'routes', source: 'routes', renderer: 'route', order: 10, visible: false, style: { colour: '#2f92bd' } },
            { id: 'alerts', source: 'alerts', renderer: 'marker', order: 20 }, { id: 'events', source: 'events', renderer: 'cluster', order: 30, style: { colour: '#d85b55' } },
            { id: 'news', source: 'news', renderer: 'cluster', order: 40, style: { colour: '#8d6bd1' } }, { id: 'ports', source: 'ports', renderer: 'marker', order: 50, visible: false },
            { id: 'places', source: 'places', renderer: 'marker', order: 60, visible: true, minimumZoom: 2 }, { id: 'labels', source: 'places', renderer: 'label', order: 70, visible: true, minimumZoom: 2 }
        ]);
        this.runtime = new LayerRuntime({ surface: this.surface, layers: this.layerRegistry, features: this.features, entities: this.entities }).registerRenderer('marker', new MarkerRenderer()).registerRenderer('cluster', new ClusterRenderer()).registerRenderer('route', new RouteRenderer()).registerRenderer('label', new LabelRenderer()).registerRenderer('polygon', new PolygonRenderer()).registerRenderer('heat', new HeatRenderer()).registerRenderer('raster', new RasterRenderer());
        this.tooltip = new TooltipController(this.container);
        this.interaction = new InteractionController({ surface: this.surface.root, entities: this.entities, tooltip: this.tooltip, select: entity => this.#selectEntity(entity) });
        this.gestures = new GestureController({ element: this.container, viewport: this.viewport, changed: reason => this.render(reason), click: event => this.#selectPoint(event) });
        this.keyboard = new KeyboardController({ element: this.container, viewport: this.viewport, changed: reason => this.render(reason) });
        this.searchToggle = installMapSearchToggle();
        this.theme = new ThemeBridge({ map: this });
        this.status = document.createElement('div');
        this.status.className = 'merlin-v20-status';
        this.container.append(this.status);
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.container);
        this.overlayMetadata = new Map();
        this.render('init');
    }
    get zoom() { return this.viewport.state.zoom; }
    setData(data = {}) {
        const events = [...(data.events || [])].filter(materialEarthquake).map((item, index) => pointFeature(item, 'events', index)).filter(Boolean);
        const alerts = [...(data.alerts || [])].map((item, index) => pointFeature(item, 'alerts', index)).filter(Boolean);
        const news = [...(data.news || [])].map((item, index) => pointFeature(item, 'news', index)).filter(Boolean);
        const ports = [...(data.ports || [])].map((item, index) => pointFeature(item, 'ports', index)).filter(Boolean);
        const places = [...(data.places || [])].map((item, index) => pointFeature(item, 'places', index)).filter(Boolean);
        const routes = [...(data.routes || [])].map(routeFeature).filter(Boolean);
        for (const [id, values] of Object.entries({ events, alerts, news, ports, places, routes }))
            this.features.set(id, values.map(feature => ({ ...feature, __data: feature.__data })));
        this.render('data');
    }

    on(type, listener) { return this.events.on(type, listener); }
    getViewport() { return this.viewport.snapshot(); }
    registerOverlay(definition) {
        if (!this.layerRegistry.get(definition.id)) this.layerRegistry.register({ visible: false, minimumZoom: 0, maximumZoom: 20, order: 100, interactive: true, ...definition });
        return this.layerRegistry.get(definition.id);
    }
    setOverlayData(id, features = []) { this.features.set(id, features.map(feature => ({ ...feature, __data: feature.__data || feature.properties }))); this.render('overlay-data'); }
    setOverlayState(id, state = {}) {
        const aliases = { 'english-local-labels': 'labels', 'major-cities': 'places', 'shipping-routes': 'routes' };
        const targetId = aliases[id] || id;
        const layer = this.layerRegistry.get(targetId);
        if (layer) {
            if ('visible' in state) this.layerRegistry.setVisible(targetId, state.visible);
            if ('opacity' in state) layer.opacity = Number(state.opacity);
            if (state.style) layer.style = { ...(layer.style || {}), ...state.style };
            if (state.filters) layer.filters = { ...(layer.filters || {}), ...state.filters };
        }
        if (id === 'political-boundaries' && 'visible' in state) this.localBase.style.visibility = state.visible ? 'visible' : 'hidden';
        if ((id === 'topography' || id === 'terrain-shading') && state.visible) this.setTileMode('terrain');
        this.render('overlay-state');
    }
    setOverlayMetadata(id, metadata = {}) { this.overlayMetadata.set(id, { ...metadata }); }
    setLayerVisibility(values = {}) {
        this.layersState = { ...this.layersState, ...values };
        const mapping = { alerts: 'alerts', news: 'news', routes: 'routes', ports: 'ports', places: 'places' };
        for (const [source, id] of Object.entries(mapping))
            if (source in values)
                this.layerRegistry.setVisible(id, values[source]);
        if ('places' in values || 'labels' in values)
            this.layerRegistry.setVisible('labels', values.labels ?? values.places);
        this.render('layers');
    }
    setTileMode(mode) { this.tileLayer.setSource(tileSourceForMode(mode)); this.container.dataset.mapStyle = mode; this.render('style'); }
    setZoom(value) { this.viewport.setZoom(value); this.render('zoom'); }
    flyTo(point, options = {}) {
        this.viewport.setCenter(point);
        if (options.zoom !== undefined)
            this.viewport.setZoom(options.zoom);
        this.render('fly');
    }
    resize() { const box = this.container.getBoundingClientRect(); this.viewport.resize(box.width, box.height); this.surface.resize(this.viewport.state.size.width, this.viewport.state.size.height); this.render('resize'); }
    render(reason = 'render') { const state = this.viewport.snapshot(); this.tileLayer.render(state); this.runtime.render(this.viewport); this.localBase.style.display = this.tileLayer.source?.enabled ? 'none' : ''; this.status.textContent = `Z${state.zoom.toFixed(1)} · ${state.center.lat.toFixed(2)}, ${state.center.lon.toFixed(2)} · BOUNDED WORLD`; this.events.emit('render', { reason, viewport: state, features: this.features.version }); }
    #selectEntity(entity) {
        if (entity.kind === 'CLUSTER' && entity.data?.members?.length) {
            const points = entity.data.members.map(feature => ({ lat: feature.geometry.coordinates[1], lon: feature.geometry.coordinates[0] }));
            this.flyTo({ lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length, lon: points.reduce((sum, point) => sum + point.lon, 0) / points.length }, { zoom: Math.min(14, this.zoom + 2) });
            return;
        }
        const data = entity.feature?.__data || entity.data || entity.feature?.properties;
        const kind = String(entity.kind || '').toLowerCase();
        this.onEntity?.({ kind, data, feature: entity.feature });
    }
    #selectPoint(event) {
        if (event.target.closest?.('[data-map-entity]'))
            return;
        const box = this.container.getBoundingClientRect();
        this.onSelect?.(this.viewport.unproject({ x: event.clientX - box.left, y: event.clientY - box.top }));
    }
    destroy() { this.resizeObserver?.disconnect(); this.gestures.destroy(); this.keyboard.destroy(); this.interaction.destroy(); this.tooltip.destroy(); this.searchToggle.destroy(); this.theme.destroy(); this.tileLayer.clear(); this.surface.destroy(); this.events.clear(); }
}
