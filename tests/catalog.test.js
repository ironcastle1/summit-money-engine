import test from 'node:test';import assert from 'node:assert/strict';
import { REGIONS, PRIORITY_REGION_IDS, regionForCountry } from '../src/catalog/regions.js';
import { collectionStreams } from '../src/catalog/collection-plans.js';
import { sourceCatalog } from '../src/sources/registry.js';
import { STRATEGIC_NODES } from '../src/catalog/strategic-nodes.js';
import { TRANSMISSION_RULES } from '../src/catalog/market-transmission.js';
import { SCENARIOS } from '../src/catalog/scenarios.js';
import { reference } from '../src/catalog/reference.js';
import { INSTITUTIONS } from '../src/catalog/institutions.js';
import { ESCALATION_INDICATORS } from '../src/catalog/escalation-indicators.js';
import { STRATEGIC_AREAS } from '../src/catalog/strategic-areas.js';
import { EXPOSURE_MATRIX } from '../src/catalog/exposure-matrix.js';
import { DECISION_PLAYBOOKS } from '../src/catalog/decision-playbooks.js';
import { DEPENDENCY_GRAPH } from '../src/catalog/dependency-graph.js';
import { COUNTRY_PRIORITY_PROFILES } from '../src/catalog/country-priority-profiles.js';
import { EVENT_TAXONOMY } from '../src/catalog/event-taxonomy.js';

test('five priority collection zones plus world',()=>{assert.equal(PRIORITY_REGION_IDS.length,5);assert.equal(REGIONS.length,6)});
test('collection plan has ten focused streams per priority region',()=>{assert.equal(collectionStreams().length,50);for(const id of PRIORITY_REGION_IDS)assert.equal(collectionStreams().filter(x=>x.regionId===id).length,10)});
test('live source catalog is deep enough for multiple acquisition paths',()=>{const rows=sourceCatalog();assert.ok(rows.length>=40);assert.equal(rows.filter(x=>x.kind==='gdelt').length,50);assert.ok(rows.some(x=>x.id==='ofac-actions'));assert.ok(rows.some(x=>x.id==='fed-monetary'));assert.ok(rows.some(x=>x.id==='polymarket'))});
test('strategic nodes cover core chokepoints',()=>{const ids=new Set(STRATEGIC_NODES.map(x=>x.id));for(const id of ['hormuz','bab-el-mandeb','suez','taiwan-strait','malacca','black-sea','korean-dmz'])assert.ok(ids.has(id))});
test('transmission model has substantial scenario coverage',()=>{assert.ok(TRANSMISSION_RULES.length>=30);assert.ok(TRANSMISSION_RULES.some(x=>x.name.includes('Taiwan')));assert.ok(TRANSMISSION_RULES.some(x=>x.name.includes('Hormuz')))});
test('watchbooks include high-value escalation cases',()=>{const ids=new Set(SCENARIOS.map(x=>x.id));for(const id of ['us-iran-escalation','taiwan-blockade-risk','ukraine-black-sea','korean-escalation'])assert.ok(ids.has(id))});
test('reference geography remains global',()=>{assert.equal(reference.countries.length,232);assert.ok(reference.cities.length>=250);assert.equal(reference.ports.length,75);assert.equal(reference.routes.length,15)});
test('country routing maps strategic states to the requested zones',()=>{assert.equal(regionForCountry('IR').id,'middle-east');assert.equal(regionForCountry('RU').id,'russia-eurasia');assert.equal(regionForCountry('TW').id,'strategic-asia');assert.equal(regionForCountry('US').id,'north-america');assert.equal(regionForCountry('DE').id,'europe')});

test('deep intelligence catalogs are populated',()=>{assert.ok(INSTITUTIONS.length>=55);assert.ok(ESCALATION_INDICATORS.length>=40);assert.ok(STRATEGIC_AREAS.length>=45);assert.ok(EXPOSURE_MATRIX.length>=20);assert.ok(DECISION_PLAYBOOKS.length>=30);assert.ok(DEPENDENCY_GRAPH.length>=40);assert.equal(COUNTRY_PRIORITY_PROFILES.length,80);assert.ok(EVENT_TAXONOMY.length>=65)});

test('V6 source catalogue includes deep public-signal lanes',()=>{
  const sources=sourceCatalog();
  assert.ok(sources.length>=100);
  const lanes=new Set(sources.map(s=>s.lane));
  for(const lane of ['defense','sanctions','maritime','cyber','markets','energy','nuclear','policy','discovery']) assert.ok(lanes.has(lane),`missing ${lane}`);
});
