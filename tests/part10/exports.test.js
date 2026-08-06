import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CountryRiskExportService
}
from '../../src/country-risk/export-service.js';
test('country risk exports CSV and summary',()=>{
  const exporter=new CountryRiskExportService();
  const profiles=[{
    country:{
      iso2:'GB',name:'United Kingdom'
    },risk:{
      score:55,band:{
        id:'ELEVATED'
      },confidence:70,coverage:80,components:[]
    }
  }];
  assert.match(exporter.toCsv(profiles),/United Kingdom/);
  assert.equal(exporter.summary({
    profiles
  }).countries,1);
});
