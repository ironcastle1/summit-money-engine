import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildElectionCalendar
}
from '../../src/country-risk/election-calendar.js';
test('election calendar labels imminent elections',()=>{
  const result=buildElectionCalendar([{
    iso2:'AA',name:'A'
  }],[{
    countryCode:'AA',date:new Date(Date.now()+10*86400000).toISOString()
  }]);
  assert.equal(result[0].phase,'IMMINENT');
  assert.equal(result[0].countryName,'A');
});
