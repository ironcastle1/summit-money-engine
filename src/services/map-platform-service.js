import { LayerCatalog, CORE_MAP_LAYERS } from '../geospatial/layer-catalog.js';
import { fitBounds } from '../geospatial/fit-bounds.js';
import { viewport } from '../geospatial/viewport.js';
import { bbox } from '../geospatial/bbox.js';
export class MapPlatformService {
    constructor(options) {
        Object.assign(this, options);
        this.layers = options.layers || new LayerCatalog(CORE_MAP_LAYERS);
    }
    bootstrap() {
        return Object.freeze({
            version: '20.0.0', projection: 'web-mercator', repeatWorld: false, labels: Object.freeze({ primary: 'english', secondary: 'local', secondaryFormat: 'parentheses' }),
            defaultViewport: viewport({ center: { lat: 20, lon: 0 }, zoom: 2, width: 1280, height: 720 }),
            layerCatalog: this.layers.snapshot(), styleCatalog: this.styles.snapshot(), staticFeatureCounts: this.features.summary(), search: this.search.summary(),
            capabilities: Object.freeze(['BOUNDED_WORLD', 'BILINGUAL_LABELS', 'INTERACTIVE_FEATURES', 'SPATIAL_QUERY', 'CLUSTERING', 'SAVED_VIEWS', 'THEME_BRIDGE', 'KEYBOARD_MAP_CONTROL'])
        });
    }
    async layerData(layerId, options = {}) {
        this.diagnostics.increment(layerId === 'events' ? 'eventQueries' : 'featureQueries');
        if (layerId === 'events')
            return this.features.events(options);
        const bounds = options.bounds ? bbox(options.bounds.west, options.bounds.south, options.bounds.east, options.bounds.north) : null;
        return { collection: this.features.query(layerId, bounds, options), generatedAt: new Date().toISOString(), source: 'MERLIN_STATIC_CATALOGUE' };
    }
    searchPlaces(query, options = {}) { this.diagnostics.increment('searchQueries'); return this.search.search(query, options); }
    fit(input) {
        if (input.bounds)
            return fitBounds(bbox(input.bounds.west, input.bounds.south, input.bounds.east, input.bounds.north), input.dimensions || { width: 1280, height: 720 }, input.options || {});
        return viewport({ ...(input.viewport || {}), width: input.dimensions?.width || input.viewport?.width, height: input.dimensions?.height || input.viewport?.height }, input.options || {});
    }
}
