import test from 'node:test';
import assert from 'node:assert/strict';
import { SpatialIndex } from '../../src/geospatial/spatial-index.js';
import { spatialHash, neighbouringHashes } from '../../src/geospatial/spatial-hash.js';
const feature = (id, lon, lat) => ({ type: 'Feature', id, geometry: { type: 'Point', coordinates: [lon, lat] }, properties: {} });
test('spatial hashes are stable and expose neighbouring cells', () => {
    const point = { lat: 51.5, lon: -0.1 };
    assert.equal(spatialHash(point, 7), spatialHash(point, 7));
    assert.equal(neighbouringHashes(point, 7, 1).length, 9);
});
test('spatial index performs radius and bounds queries', () => {
    const index = new SpatialIndex({ zoom: 7 }).load([feature('london', -0.1, 51.5), feature('paris', 2.35, 48.86), feature('tokyo', 139.69, 35.68)]);
    assert.equal(index.size, 3);
    assert.equal(index.withinRadius({ lat: 51.5, lon: -0.1 }, 400).length, 2);
    assert.deepEqual(index.withinBounds({ west: -5, south: 45, east: 5, north: 55 }).map(record => record.id).sort(), ['london', 'paris']);
    assert.equal(index.remove('tokyo'), true);
    assert.equal(index.size, 2);
});
