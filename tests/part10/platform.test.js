import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CountryRiskPlatformService
}
from '../../src/services/country-risk-platform-service.js';
import {
  country,
  profileInput
}
from './test-fixtures.js';
function service(){
  return new CountryRiskPlatformService({
    countryCatalog:{
      countries:[country],listCountries:()=>[country]
    },countryIntelligence:{
      overview:async()=>({
        countries:[{
          country,metrics:{
            composite:{
              score:50
            }
          }
        }],eventSources:{
        },newsSources:{
        },intelligenceSources:[]
      }),countryDetail:async()=>profileInput
    },intelligenceRegistry:{
      health:()=>[]
    }
  });
}
test('platform snapshot ranks country profiles',async()=>{
  const result=await service().snapshot({
    includeNews:false
  });
  assert.equal(result.profiles.length,1);
  assert.equal(result.features.features.length,1);
});
test('platform country detail and scenario are available',async()=>{
  const platform=service();
  const profile=await platform.country('GB');
  assert.equal(profile.country.iso2,'GB');
  const scenario=await platform.scenario({
    countryId:'GB',type:'POLICY_SHOCK',severity:50
  });
  assert.equal(scenario.scenario,'POLICY_SHOCK');
});
