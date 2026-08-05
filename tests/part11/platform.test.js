import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ConflictIntelligencePlatformService
}
from '../../src/services/conflict-intelligence-platform-service.js';
import {
  rawEvents
}
from './fixtures.js';
function service() {
  return new ConflictIntelligencePlatformService({
    eventService: {
      globalSnapshot: async () => ({
        events: rawEvents
      }),
      registry: {
        health: () => ({
          acled: {
            state: 'ONLINE'
          }
        })
      }
    },
    countryCatalog: {
      listCountries: () => []
    },
    shippingCatalog: {
      listPorts: () => []
    }
  });
}
test('platform builds snapshot and theatre detail',
async () => {
  const platform = service(),
  snapshot = await platform.snapshot({
    force: true
  });
  assert.equal(snapshot.theatres.length,
  2);
  assert.equal((await platform.theatre('example-war',
  {
    snapshot
  })).id,
  'example-war');
});
test('platform compares theatres and runs scenarios',
async () => {
  const platform = service(),
  snapshot = await platform.snapshot({
    force: true
  }),
  comparison = await platform.compare({
    snapshot
  }),
  scenario = await platform.scenario({
    snapshot,
    theatre: snapshot.theatres[0],
    theatreId: snapshot.theatres[0].id,
    type: 'CEASEFIRE'
  });
  assert.equal(comparison.matrix.length,
  2);
  assert.ok(scenario.delta < 0);
});
