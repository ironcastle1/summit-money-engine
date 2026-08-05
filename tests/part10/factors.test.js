import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessConflictExposure
}
from '../../src/country-risk/conflict-exposure.js';
import {
  assessElectionRisk
}
from '../../src/country-risk/election-risk.js';
import {
  assessSanctionsExposure
}
from '../../src/country-risk/sanctions-exposure.js';
test('conflict exposure responds to severe conflict events',()=>{
  const result=assessConflictExposure({
    events:[{
      category:'war',severity:90
    },{
      category:'conflict',severity:70
    }]
  });
  assert.ok(result.score>20);
  assert.equal(result.id,'conflict');
});
test('election risk rises as election approaches',()=>{
  const near=assessElectionRisk({
    elections:[{
      date:new Date(Date.now()+5*86400000).toISOString()
    }]
  });
  const far=assessElectionRisk({
    elections:[{
      date:new Date(Date.now()+300*86400000).toISOString()
    }]
  });
  assert.ok(near.score>far.score);
});
test('comprehensive sanctions weigh more than targeted restrictions',()=>{
  const broad=assessSanctionsExposure({
    sanctions:[{
      scope:'COMPREHENSIVE'
    }]
  });
  const narrow=assessSanctionsExposure({
    sanctions:[{
      scope:'TARGETED'
    }]
  });
  assert.ok(broad.score>narrow.score);
});
