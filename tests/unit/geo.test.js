import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm, destinationPoint, initialBearing, circleAreaKm2, validCoordinate } from '../../src/domain/geo/distance.js';
import { circlePolygon } from '../../src/domain/geo/circle.js';

const london = { lat: 51.5074, lon: -0.1278 };
const paris = { lat: 48.8566, lon: 2.3522 };

test('haversine distance is accurate for London to Paris', () => {
  const distance = haversineKm(london.lat, london.lon, paris.lat, paris.lon);
  assert.ok(distance > 338 && distance < 350);
});

test('destination point approximately reverses distance', () => {
  const bearing = initialBearing(london.lat, london.lon, paris.lat, paris.lon);
  const point = destinationPoint(london.lat, london.lon, bearing, haversineKm(london.lat, london.lon, paris.lat, paris.lon));
  assert.ok(Math.abs(point.lat - paris.lat) < 0.03);
  assert.ok(Math.abs(point.lon - paris.lon) < 0.03);
});

test('circle polygon is closed and contains configured radius', () => {
  const feature = circlePolygon(london.lat, london.lon, 250, 32);
  assert.equal(feature.geometry.coordinates[0].length, 33);
  assert.deepEqual(feature.geometry.coordinates[0][0], feature.geometry.coordinates[0].at(-1));
  assert.equal(feature.properties.radiusKm, 250);
});

test('coordinate and area validation reject invalid values', () => {
  assert.equal(validCoordinate(91, 0), false);
  assert.equal(validCoordinate(0, 181), false);
  assert.ok(circleAreaKm2(100) > 31_000 && circleAreaKm2(100) < 31_500);
});
