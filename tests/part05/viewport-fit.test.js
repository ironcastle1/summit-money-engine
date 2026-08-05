import test from 'node:test';
import assert from 'node:assert/strict';
import { viewport, projectToViewport, unprojectFromViewport, panViewport, zoomViewportAround } from '../../src/geospatial/viewport.js';
import { fitBounds } from '../../src/geospatial/fit-bounds.js';
test('viewport projection and unprojection are inverse operations', () => {
    const state = viewport({ center: { lat: 30, lon: 10 }, zoom: 5, width: 1200, height: 700 });
    const point = { lat: 31.2, lon: 14.5 };
    const pixel = projectToViewport(point, state);
    const restored = unprojectFromViewport(pixel, state);
    assert.ok(Math.abs(restored.lat - point.lat) < 1e-7);
    assert.ok(Math.abs(restored.lon - point.lon) < 1e-7);
});
test('panning and zoom-around retain bounded viewport state', () => {
    const state = viewport({ center: { lat: 0, lon: 0 }, zoom: 4, width: 900, height: 600 });
    const panned = panViewport(state, { x: 200, y: -100 });
    const zoomed = zoomViewportAround(panned, 7, { x: 450, y: 300 });
    assert.ok(zoomed.zoom >= 7);
    assert.ok(zoomed.center.lat <= 85.0512);
});
test('fit bounds respects padding and zoom limits', () => {
    const result = fitBounds({ west: -10, south: 35, east: 30, north: 60 }, { width: 1000, height: 700 }, { padding: 80, maximumZoom: 10 });
    assert.ok(result.zoom > 3 && result.zoom <= 10);
    assert.ok(result.center.lat > 35 && result.center.lat < 60);
});
