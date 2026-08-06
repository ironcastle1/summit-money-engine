import test from 'node:test';
import assert from 'node:assert/strict';
import { projectWorld, unprojectWorld, worldSize } from '../../src/geospatial/mercator.js';
import { minimumWorldZoom, clampViewportToWorld } from '../../src/geospatial/world-clamp.js';
import { visibleTiles } from '../../src/geospatial/tile-range.js';
test('mercator projection round trips representative coordinates', () => {
    const point = { lat: 51.5074, lon: -0.1278 };
    const projected = projectWorld(point, 7);
    const restored = unprojectWorld(projected, 7);
    assert.ok(Math.abs(restored.lat - point.lat) < 1e-7);
    assert.ok(Math.abs(restored.lon - point.lon) < 1e-7);
    assert.equal(worldSize(2), 1024);
});
test('minimum zoom prevents more than one world from fitting in the frame', () => {
    assert.ok(minimumWorldZoom(1920, 1080) > 2.9);
    const constrained = clampViewportToWorld({ center: { lat: 0, lon: 0 }, zoom: 1, width: 1920, height: 1080 });
    assert.ok(constrained.zoom >= constrained.minimumZoom);
    assert.ok(constrained.center.lon >= -180 && constrained.center.lon <= 180);
});
test('visible tile selection never wraps duplicate worlds', () => {
    const viewport = clampViewportToWorld({ center: { lat: 0, lon: 0 }, zoom: 3, width: 800, height: 600 });
    const tiles = visibleTiles(viewport);
    assert.equal(new Set(tiles.map(tile => `${tile.z}/${tile.x}/${tile.y}`)).size, tiles.length);
    assert.ok(tiles.every(tile => tile.x >= 0 && tile.x < 2 ** tile.z));
});
