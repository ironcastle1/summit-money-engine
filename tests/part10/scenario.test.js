import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCountryRiskProfile
}
from '../../src/country-risk/profile-builder.js';
import {
  runCountryScenario
}
from '../../src/country-risk/scenario-engine.js';
import {
  profileInput
}
from './test-fixtures.js';
test('adverse political scenarios increase risk',()=>{
  const profile=buildCountryRiskProfile(profileInput);
  const result=runCountryScenario(profile,{
    type:'COUP_ATTEMPT',severity:80,horizonDays:30
  });
  assert.ok(result.after>result.before);
  assert.ok(result.componentImpacts.length>=3);
});
test('de-escalation can reduce risk',()=>{
  const profile=buildCountryRiskProfile(profileInput);
  const result=runCountryScenario(profile,{
    type:'DEESCALATION',severity:100
  });
  assert.ok(result.after<result.before);
});
