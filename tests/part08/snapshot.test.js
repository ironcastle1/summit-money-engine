import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHazardSnapshot
}
from '../../src/hazards/snapshot-builder.js';
test('snapshot suppresses non-material earthquakes by default', ()=> {
  const snapshot=buildHazardSnapshot( {
    events:[ {
      id:'eq-1', source:'USGS', sourceId:'x', title:'M 7.1 earthquake', category:'earthquake', lat:35, lon:36, time:new Date().toISOString(), severity:4.5, magnitude:7.1, attributes: {
        depthKm:15, significance:900, tsunami:false, status:'reviewed'
      }
    }, {
      id:'small', source:'USGS', title:'M 1', category:'earthquake', lat:1, lon:1, time:new Date().toISOString(), severity:1, magnitude:1, attributes: {
        significance:1
      }
    }], sources:[], generatedAt:new Date().toISOString()
  });
  assert.equal(snapshot.events.length, 1);
  assert.equal(snapshot.events[0].id, 'eq-1');
});
