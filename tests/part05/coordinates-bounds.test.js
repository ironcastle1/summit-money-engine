import test from 'node:test';
import assert from 'node:assert/strict';
import { coordinate, coordinateFromGeoJson, coordinateKey } from '../../src/geospatial/coordinate.js';
import { normalizeLongitude, shortestLongitudeDelta, unwrapLongitude } from '../../src/geospatial/longitude.js';
import { bbox, bboxContains, bboxIntersects, bboxUnion } from '../../src/geospatial/bbox.js';
test('coordinates clamp latitude and normalize longitude', () => {
    assert.deepEqual(coordinate(95, 190), { lat: 85.0511288, lon: -170 });
    assert.deepEqual(coordinateFromGeoJson([-3.2, 51.5]), { lat: 51.5, lon: -3.2 });
    assert.equal(coordinateKey({ lat: 51.5, lon: -3.2 }, 2), '51.50,-3.20');
});
test('longitude helpers choose the shortest dateline path', () => {
    assert.equal(normalizeLongitude(540), 180);
    assert.equal(shortestLongitudeDelta(179, -179), 2);
    assert.equal(unwrapLongitude(-179, 179), 181);
});
test('bounding boxes contain and intersect across normalized longitudes', () => {
    const left = bbox(170, -10, 190, 10);
    const right = bbox(-179, -5, -175, 5);
    assert.equal(bboxContains(left, { lat: 0, lon: -179 }), true);
    assert.equal(bboxIntersects(left, right), true);
    assert.equal(bboxUnion(left, right).east >= 181, true);
});
