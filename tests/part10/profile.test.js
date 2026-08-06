import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCountryRiskProfile
}
from '../../src/country-risk/profile-builder.js';
import {
  profileInput
}
from './test-fixtures.js';
test('profile builder produces explainable country risk',()=>{
  const profile=buildCountryRiskProfile(profileInput);
  assert.equal(profile.country.iso2,'GB');
  assert.ok(profile.risk.components.length>=10);
  assert.ok(profile.briefing.assessment.includes('United Kingdom'));
  assert.ok(Array.isArray(profile.timeline));
});
