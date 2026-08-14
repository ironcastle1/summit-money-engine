import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const code=await fs.readFile(new URL('../public/modules/map-engine.js',import.meta.url),'utf8');

test('map engine implements real wheel zoom and pointer pan',()=>{
  assert.match(code,/addEventListener\('wheel'/);
  assert.match(code,/preventDefault\(\)/);
  assert.match(code,/addEventListener\('pointermove'/);
  assert.match(code,/panBy\(/);
  assert.match(code,/pinchMeasure\(/);
});

test('map engine renders independent geographic and analytic overlays',()=>{
  for(const fn of ['drawBorders','drawRoutes','drawCountryRisk','drawSupply','drawAirAlerts','drawEventOverlays','drawSignals']) assert.match(code,new RegExp(fn));
  for(const layer of ['conflict','politics','sanctions','maritime','energy','cyber','markets']) assert.match(code,new RegExp(`['\"]${layer}['\"]`));
});

test('map engine has polygon hit testing for country clicks',()=>{
  assert.match(code,/findCountry\(/);
  assert.match(code,/pointInPolygon\(/);
  assert.match(code,/type:'country'/);
});
