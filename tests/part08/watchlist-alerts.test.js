import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HazardWatchlist
}
from '../../src/hazards/watchlist.js';
import {
  normalizeHazardEvent
}
from '../../src/hazards/event-normalizer.js';
import {
  evaluateMateriality
}
from '../../src/hazards/materiality-policy.js';
test('watchlist produces geofenced alerts', async()=> {
  const watchlist=new HazardWatchlist();
  await watchlist.add('u', {
    name:'Area', minimumScore:50, geofence: {
      center: {
        lat:35, lon:36
      }, radiusKm:200
    }
  });
  const event= {
    ...normalizeHazardEvent( {
      id:'eq-1', source:'USGS', sourceId:'x', title:'M 7.1 earthquake', category:'earthquake', lat:35, lon:36, time:new Date().toISOString(), severity:4.5, magnitude:7.1, attributes: {
        depthKm:15, significance:900, tsunami:false, status:'reviewed'
      }
    })
  };
  event.materiality=evaluateMateriality(event);
  const alerts=await watchlist.evaluate('u', [event]);
  assert.equal(alerts.length, 1);
});
