import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compareCountries
}
from '../../src/country-risk/comparison-engine.js';
test('country comparison identifies score leader',()=>{
  const result=compareCountries([{
    country:{
      iso2:'AA',name:'A'
    },risk:{
      score:20,band:{
        id:'LOW'
      },confidence:80,coverage:90,components:[]
    }
  },{
    country:{
      iso2:'BB',name:'B'
    },risk:{
      score:70,band:{
        id:'HIGH'
      },confidence:60,coverage:70,components:[]
    }
  }]);
  assert.equal(result.leaders.score.iso2,'BB');
});
