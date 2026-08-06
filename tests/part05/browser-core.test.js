import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLongitude, project, unproject } from '../../public/map-v20/projection.js';
import { minimumZoomForSize, clampViewport } from '../../public/map-v20/world-boundary.js';
import { ViewportModel } from '../../public/map-v20/viewport-model.js';
import { labelLines } from '../../public/map-v20/label-language.js';
import { placeFloatingPanel } from '../../public/map-v20/detail-placement.js';
test('browser projection and viewport use the same bounded world rules', () => {
    assert.equal(normalizeLongitude(190), -170);
    const point = { lat: 40, lon: 30 };
    const restored = unproject(project(point, 5), 5);
    assert.ok(Math.abs(restored.lat - point.lat) < 1e-7);
    assert.ok(minimumZoomForSize({ width: 1920, height: 1080 }) > 2.9);
    assert.ok(clampViewport({ center: { lat: 0, lon: 0 }, zoom: 1, size: { width: 1920, height: 1080 } }).zoom > 2.9);
});
test('browser viewport model pans, zooms and projects', () => {
    const viewport = new ViewportModel({ center: { lat: 0, lon: 0 }, zoom: 4, width: 800, height: 600 });
    const before = viewport.snapshot();
    viewport.panBy({ x: 100, y: 0 });
    assert.notEqual(viewport.snapshot().center.lon, before.center.lon);
    viewport.zoomAround(6, { x: 400, y: 300 });
    assert.equal(viewport.snapshot().zoom, 6);
});
test('browser labels and popup placement remain readable in the viewport', () => {
    assert.deepEqual(labelLines({ nameEnglish: 'Damascus', nameLocal: 'دمشق' }), ['Damascus', '(دمشق)']);
    assert.deepEqual(placeFloatingPanel({ x: 790, y: 590 }, { width: 240, height: 140 }, { width: 800, height: 600 }), { left: 536, top: 436 });
});
