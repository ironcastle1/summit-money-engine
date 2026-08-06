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
  HazardExportService
}
from '../../src/hazards/export-service.js';
test('exports map-ready GeoJSON and CSV', ()=> {
  const event= {
    ...normalizeHazardEvent( {
      id:'eq-1', source:'USGS', sourceId:'x', title:'M 7.1 earthquake', category:'earthquake', lat:35, lon:36, time:new Date().toISOString(), severity:4.5, magnitude:7.1, attributes: {
        depthKm:15, significance:900, tsunami:false, status:'reviewed'
      }
    })
  };
  event.materiality=evaluateMateriality(event);
  const exporter=new HazardExportService();
  const geo=exporter.toGeoJson([event], {
    includeFootprints:true
  });
  assert.equal(geo.features.length, 2);
  assert.match(exporter.toCsv([event]), /EARTHQUAKE/);
});
