import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compositeCountryRisk
}
from '../../src/country-risk/composite-risk.js';
import {
  factor
}
from '../../src/country-risk/factor.js';
test('composite risk weights measured factors and reports coverage',()=>{
  const result=compositeCountryRisk({
    conflict:factor('conflict',80,{
      confidence:90,state:'MEASURED'
    }),governance:factor('governance',40,{
      confidence:80,state:'MEASURED'
    }),sanctions:factor('sanctions',0,{
      state:'UNAVAILABLE'
    })
  });
  assert.ok(result.score>40);
  assert.ok(result.coverage>0);
  assert.equal(result.band.id,'ELEVATED');
});
