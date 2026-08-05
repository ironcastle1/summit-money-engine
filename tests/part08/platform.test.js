import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HazardPlatform
}
from '../../src/hazards/hazard-platform.js';
const events= {
  globalSnapshot:async()=>( {
    events:[ {
      id:'eq-1', source:'USGS', sourceId:'x', title:'M 7.1 earthquake', category:'earthquake', lat:35, lon:36, time:new Date().toISOString(), severity:4.5, magnitude:7.1, attributes: {
        depthKm:15, significance:900, tsunami:false, status:'reviewed'
      }
    }], sources:[], generatedAt:new Date().toISOString()
  })
};
const intelligenceCatalog= {
  listCities:()=>[ {
    id:'c', name:'City', lat:35.1, lon:36.1, population:1000000
  }], listCountries:()=>[]
};
const shippingCatalog= {
  listPorts:()=>[ {
    id:'p', name:'Port', lat:35.2, lon:36.2, importance:80
  }], listChokepoints:()=>[]
};
test('platform exposes material snapshot and scenario', async()=> {
  const platform=new HazardPlatform( {
    events, intelligenceCatalog, shippingCatalog
  });
  const snapshot=await platform.snapshot();
  assert.equal(snapshot.events.length, 1);
  const scenario=await platform.scenario( {
    event: {
      id:'eq-1', source:'USGS', sourceId:'x', title:'M 7.1 earthquake', category:'earthquake', lat:35, lon:36, time:new Date().toISOString(), severity:4.5, magnitude:7.1, attributes: {
        depthKm:15, significance:900, tsunami:false, status:'reviewed'
      }
    }
  });
  assert.ok(scenario.priority.score>0);
  assert.equal(platform.diagnostics().ready, true);
});
