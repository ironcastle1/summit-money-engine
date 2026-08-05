import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHazardEvent
}
from '../../src/hazards/event-normalizer.js';
import {
  evaluateMateriality
}
from '../../src/hazards/materiality-policy.js';
test('retains major earthquakes', ()=> {
  const event=normalizeHazardEvent( {
    id:'eq-1', source:'USGS', sourceId:'x', title:'M 7.1 earthquake', category:'earthquake', lat:35, lon:36, time:new Date().toISOString(), severity:4.5, magnitude:7.1, attributes: {
      depthKm:15, significance:900, tsunami:false, status:'reviewed'
    }
  });
  const result=evaluateMateriality(event);
  assert.equal(result.material, true);
  assert.ok(result.reasons.includes('MAGNITUDE_THRESHOLD'));
});
test('suppresses routine earthquakes', ()=> {
  const event=normalizeHazardEvent( {
    id:'small', source:'USGS', title:'M 2.1', category:'earthquake', lat:35, lon:36, time:new Date().toISOString(), severity:1, magnitude:2.1, attributes: {
      significance:20
    }
  });
  assert.equal(evaluateMateriality(event).material, false);
});
