import test from 'node:test';
import assert from 'node:assert/strict';
import { closeRing, polygonArea, ringCentroid } from '../../src/geospatial/polygon.js';
import { pointInPolygon } from '../../src/geospatial/point-in-polygon.js';
import { validateFeature, validateFeatureCollection } from '../../src/geospatial/geojson-validator.js';
import { normalizeFeature } from '../../src/geospatial/geojson-normalizer.js';
import { featureBounds } from '../../src/geospatial/geojson-bounds.js';
test('polygon operations close rings, measure area and locate centroids', () => {
    const ring = [[0, 0], [4, 0], [4, 4], [0, 4]];
    assert.equal(closeRing(ring).length, 5);
    assert.equal(polygonArea([ring]), 16);
    assert.deepEqual(ringCentroid(ring), { lon: 2, lat: 2 });
    assert.equal(pointInPolygon({ lon: 2, lat: 2 }, [ring]), true);
    assert.equal(pointInPolygon({ lon: 5, lat: 2 }, [ring]), false);
});
test('GeoJSON validation and normalization reject malformed geometry', () => {
    const feature = { type: 'Feature', geometry: { type: 'Point', coordinates: [-3, 51] }, properties: { name: 'Test' } };
    assert.deepEqual(validateFeature(feature), []);
    const normalized = normalizeFeature(feature, { namespace: 'test' });
    assert.match(String(normalized.id), /^test:/);
    assert.deepEqual(featureBounds(normalized), { west: -3, south: 51, east: -3, north: 51 });
    assert.ok(validateFeatureCollection({ type: 'FeatureCollection', features: [{ bad: true }] }).length > 0);
});
