import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyHazard
}
from '../../src/hazards/hazard-classifier.js';
import {
  normalizeHazardEvent
}
from '../../src/hazards/event-normalizer.js';
test('classifies major hazard families', ()=> {
  assert.equal(classifyHazard( {
    category:'earthquake'
  }), 'EARTHQUAKE');
  assert.equal(classifyHazard( {
    title:'Typhoon crossing coast'
  }), 'TROPICAL_CYCLONE');
  assert.equal(classifyHazard( {
    title:'Large bushfire'
  }), 'WILDFIRE');
});
test('normalizes a source event', ()=> {
  const event=normalizeHazardEvent( {
    id:'eq-1', source:'USGS', sourceId:'x', title:'M 7.1 earthquake', category:'earthquake', lat:35, lon:36, time:new Date().toISOString(), severity:4.5, magnitude:7.1, attributes: {
      depthKm:15, significance:900, tsunami:false, status:'reviewed'
    }
  });
  assert.equal(event.type, 'EARTHQUAKE');
  assert.equal(event.point.lat, 35);
  assert.ok(event.severityScore>0);
});
