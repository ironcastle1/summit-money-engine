import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineDistance } from '../../src/geospatial/distance.js';
import { initialBearing } from '../../src/geospatial/bearing.js';
import { destinationPoint } from '../../src/geospatial/destination.js';
import { polylineLength, pointAlongPolyline } from '../../src/geospatial/polyline.js';
import { routeCorridor, pointInRouteCorridor } from '../../src/geospatial/route-corridor.js';
test('distance and bearing produce realistic London to Paris values', () => {
    const london = { lat: 51.5074, lon: -0.1278 };
    const paris = { lat: 48.8566, lon: 2.3522 };
    const distance = haversineDistance(london, paris);
    assert.ok(distance > 340 && distance < 350);
    assert.ok(initialBearing(london, paris) > 140 && initialBearing(london, paris) < 160);
});
test('destination and polyline helpers preserve route geometry', () => {
    const origin = { lat: 0, lon: 0 };
    const destination = destinationPoint(origin, 111.2, 90);
    assert.ok(Math.abs(destination.lon - 1) < 0.02);
    const line = [origin, { lat: 0, lon: 1 }, { lat: 0, lon: 2 }];
    assert.ok(polylineLength(line) > 220);
    assert.ok(Math.abs(pointAlongPolyline(line, 0.5).lon - 1) < 0.01);
});
test('route corridors include nearby points and reject distant points', () => {
    const corridor = routeCorridor([{ lat: 0, lon: 0 }, { lat: 0, lon: 10 }], 75);
    assert.equal(pointInRouteCorridor({ lat: 0.4, lon: 5 }, corridor), true);
    assert.equal(pointInRouteCorridor({ lat: 3, lon: 5 }, corridor), false);
});
