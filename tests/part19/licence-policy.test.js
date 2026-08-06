import test from'node:test';import assert from'node:assert/strict';import{licenceDecision}from'../../src/live-data/licence-policy.js';import{publicSource}from'../../src/live-data/public-source-catalog.js';
test('keyless sources are allowed without credentials',()=>assert.equal(licenceDecision(publicSource('usgs')).allowed,true));
test('global AIS remains an optional licensed enhancement',()=>assert.equal(licenceDecision(publicSource('global-ais')).state,'LICENSE_REQUIRED'));
