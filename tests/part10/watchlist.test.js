import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CountryRiskWatchlist
}
from '../../src/country-risk/watchlist.js';
import {
  evaluateCountryAlerts
}
from '../../src/country-risk/alert-evaluator.js';
test('watchlist stores country thresholds and evaluates alerts',async()=>{
  const watchlist=new CountryRiskWatchlist();
  const watch=await watchlist.add('u1',{
    iso2:'GB',threshold:60
  });
  const alerts=evaluateCountryAlerts([watch],[{
    country:{
      iso2:'GB',name:'United Kingdom'
    },risk:{
      score:70
    },factors:{
    }
  }]);
  assert.equal(alerts.length,1);
  assert.equal((await watchlist.list('u1')).length,1);
  assert.equal(await watchlist.remove('u1',watch.id),true);
});
