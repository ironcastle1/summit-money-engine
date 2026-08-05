import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeHazardEvent
}
from '../../src/hazards/event-normalizer.js';
import {
  hazardImpact
}
from '../../src/hazards/hazard-impact.js';
test('hazard-specific models produce bounded scores', ()=> {
  for(const input of [ {
    id:'eq-1', source:'USGS', sourceId:'x', title:'M 7.1 earthquake', category:'earthquake', lat:35, lon:36, time:new Date().toISOString(), severity:4.5, magnitude:7.1, attributes: {
      depthKm:15, significance:900, tsunami:false, status:'reviewed'
    }
  }, {
    id:'f', title:'Flood', category:'flood', lat:1, lon:1, time:new Date().toISOString(), severity:3, attributes: {
      depthMetres:3, displaced:10000
    }
  }, {
    id:'w', title:'Wildfire', category:'wildfire', lat:1, lon:1, time:new Date().toISOString(), severity:3, attributes: {
      areaHectares:20000
    }
  }]) {
    const score=hazardImpact(normalizeHazardEvent(input)).score;
    assert.ok(score>=0&&score<=100);
  }
});
