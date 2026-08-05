import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countryRiskFeatures
}
from '../../src/country-risk/map-features.js';
test('country risk map features are interactive and bilingual',()=>{
  const data=countryRiskFeatures([{
    country:{
      iso2:'JP',name:'Japan',nativeName:'日本',lat:36,lon:138
    },risk:{
      score:22,band:{
        id:'LOW'
      },confidence:80,coverage:90
    }
  }]);
  assert.equal(data.features[0].properties.interactive,true);
  assert.equal(data.features[0].properties.localName,'日本');
});
