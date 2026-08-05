import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countryRiskCatalog
}
from '../../src/country-risk/catalog.js';
test('catalog exposes factors, scenarios and source policy',()=>{
  const catalog=countryRiskCatalog();
  assert.ok(catalog.factors.length>=10);
  assert.ok(catalog.scenarios.length>=6);
  assert.match(catalog.sourcePolicy,/labelled explicitly/);
});
