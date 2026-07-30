import test from 'node:test';
import assert from 'node:assert/strict';
import { LocationService } from '../../src/services/location-service.js';

const places = [
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  { name: 'Paignton', country: 'United Kingdom', lat: 50.4356, lon: -3.5679 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 }
];
const offlineHttp = { json: async () => { throw new Error('offline'); } };

test('local search resolves common misspellings', () => {
  const service = new LocationService({ places, http: offlineHttp });
  assert.equal(service.localSearch('Londn')[0].name, 'London');
  assert.equal(service.localSearch('Paigntn')[0].name, 'Paignton');
});

test('reverse lookup falls back to nearest local place', async () => {
  const service = new LocationService({ places, http: offlineHttp });
  const result = await service.reverse(50.44, -3.56);
  assert.equal(result.name, 'Paignton');
  assert.equal(result.source, 'LOCAL');
});
