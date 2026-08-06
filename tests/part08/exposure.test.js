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
import {
  populationExposure
}
from '../../src/hazards/population-exposure.js';
import {
  infrastructureExposure
}
from '../../src/hazards/infrastructure-exposure.js';
const event= {
  ...normalizeHazardEvent( {
    id:'eq-1', source:'USGS', sourceId:'x', title:'M 7.1 earthquake', category:'earthquake', lat:35, lon:36, time:new Date().toISOString(), severity:4.5, magnitude:7.1, attributes: {
      depthKm:15, significance:900, tsunami:false, status:'reviewed'
    }
  })
};
event.materiality=evaluateMateriality(event);
test('population exposure uses catalogue distance attenuation', ()=> {
  const result=populationExposure(event, [ {
    id:'city', name:'City', lat:35.1, lon:36.1, population:1000000
  }]);
  assert.ok(result.estimatedPopulation>0);
  assert.equal(result.places.length, 1);
});
test('infrastructure exposure ranks critical assets', ()=> {
  const result=infrastructureExposure(event, [ {
    id:'port', name:'Port', type:'PORT', lat:35.2, lon:36.1, criticality:90
  }]);
  assert.equal(result.count, 1);
  assert.ok(result.aggregateScore>0);
});
