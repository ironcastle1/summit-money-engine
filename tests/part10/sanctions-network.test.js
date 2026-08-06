import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSanctionsNetwork
}
from '../../src/country-risk/sanctions-network.js';
test('sanctions network maps issuers, targets and exposure',()=>{
  const result=buildSanctionsNetwork([{
    iso2:'AA',name:'A'
  },{
    iso2:'BB',name:'B'
  }],[{
    issuer:'AA',target:'BB',scope:'COMPREHENSIVE'
  }]);
  assert.equal(result.edges.length,1);
  assert.equal(result.exposure[0].country,'BB');
  assert.equal(result.exposure[0].score,100);
});
