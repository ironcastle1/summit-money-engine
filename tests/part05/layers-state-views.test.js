import test from 'node:test';
import assert from 'node:assert/strict';
import { layerDefinition, layerVisibleAtZoom } from '../../src/geospatial/layer-definition.js';
import { LayerCatalog, CORE_MAP_LAYERS } from '../../src/geospatial/layer-catalog.js';
import { mapState, patchMapState } from '../../src/geospatial/map-state.js';
import { savedView, validateSavedViews } from '../../src/geospatial/saved-view.js';
test('layer definitions validate renderer and zoom visibility', () => {
    const layer = layerDefinition({ id: 'war-events', title: 'War events', renderer: 'cluster', minimumZoom: 2, maximumZoom: 12 });
    assert.equal(layerVisibleAtZoom(layer, 5), true);
    assert.equal(layerVisibleAtZoom(layer, 1), false);
    assert.throws(() => layerDefinition({ id: 'bad', renderer: 'unknown' }));
});
test('core layer catalogue is ordered and grouped', () => {
    const catalog = new LayerCatalog(CORE_MAP_LAYERS);
    assert.ok(catalog.get('political-boundaries'));
    assert.ok(catalog.get('english-local-labels'));
    assert.ok(catalog.groups().includes('logistics'));
});
test('map state and saved views are immutable normalized records', () => {
    const state = mapState({ center: { lat: 50, lon: 5 }, zoom: 4, visibleLayers: { ports: true } });
    const patched = patchMapState(state, { visibleLayers: { routes: true } });
    assert.equal(patched.visibleLayers.ports, true);
    assert.equal(patched.visibleLayers.routes, true);
    const view = savedView({ id: 'europe', name: 'Europe', state: patched });
    assert.equal(validateSavedViews([view]).length, 1);
    assert.throws(() => validateSavedViews([view, view]));
});
