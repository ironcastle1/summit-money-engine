import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runHazardScenario
}
from '../../src/hazards/scenario-engine.js';
test('scenario produces exposure, economics and response priority', ()=> {
  const result=runHazardScenario( {
    event: {
      id:'s', title:'Scenario', category:'earthquake', lat:35, lon:36, time:new Date().toISOString(), severity:4.8, magnitude:7.3, attributes: {
        material:true
      }
    }, places:[ {
      id:'city', name:'City', lat:35.1, lon:36.1, population:2000000
    }], assets:[ {
      id:'grid', name:'Grid', type:'POWER', lat:35.2, lon:36.2, criticality:90
    }], logistics: {
      ports:[ {
        id:'p', name:'Port', lat:35.3, lon:36.2, importance:90
      }]
    }
  });
  assert.ok(result.priority.score>0);
  assert.ok(result.economics.estimatedTotalUsd>=0);
  assert.ok(result.exposure.population.estimatedPopulation>0);
});
