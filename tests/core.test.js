import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {SOURCES} from '../src/source-catalog.js';
import {buildSnapshot} from '../src/analysis/pipeline.js';
import {classifyRecord} from '../src/analysis/classify.js';
import {REGIONS} from '../src/catalog/regions.js';
import {PUBLIC_SIGNAL_INDICATORS} from '../src/catalog/public-signal-indicators.js';
import {TRANSMISSION_RULES} from '../src/catalog/market-transmission.js';

const read=async p=>JSON.parse(await fs.readFile(new URL(p,import.meta.url),'utf8'));
const countriesRaw=await read('../public/data/countries.json');
const citiesRaw=await read('../public/data/cities.json');
const portsRaw=await read('../public/data/ports.json');
const routesRaw=await read('../public/data/routes.json');
const lines=await read('../public/data/tech-base-lines.json');
const polys=await read('../public/data/country-polygons.geojson');
const seed=await read('../seed/build-snapshot.json');
const countries=countriesRaw.countries||countriesRaw;
const cities=citiesRaw.cities||citiesRaw;
const ports=portsRaw.ports||portsRaw;
const routes=routesRaw.routes||routesRaw;
const reference={countries,cities,ports,routes,strategicNodes:[]};

function seedSnapshot(){
  const statuses=SOURCES.map(s=>({id:s.id,name:s.name,kind:s.kind,lane:s.lane,region:s.region,status:'seed',itemCount:0}));
  return buildSnapshot({records:seed.records.map(r=>({...r,fallback:true})),markets:seed.markets.map(m=>({...m,fallback:true})),sourceStatuses:statuses,countries,reference,seedMeta:{capturedAt:seed.capturedAt}});
}

test('source catalogue is focused and substantial',()=>{
  assert.equal(SOURCES.length,44);
  assert.equal(new Set(SOURCES.map(s=>s.id)).size,SOURCES.length);
  assert.ok(SOURCES.filter(s=>s.kind==='gdelt').length>=20);
  assert.ok(SOURCES.filter(s=>s.kind==='market').length>=8);
});

test('reference geography is populated',()=>{
  assert.equal(countries.length,232);
  assert.equal(cities.length,259);
  assert.equal(ports.length,75);
  assert.ok((routes.features||routes).length>=15);
  assert.ok(lines.features.length>=900);
  assert.ok(polys.features.length>=170);
});

test('analysis catalogues are non-trivial',()=>{
  assert.ok(REGIONS.length>=6);
  assert.ok(PUBLIC_SIGNAL_INDICATORS.length>=40);
  assert.equal(TRANSMISSION_RULES.length,34);
});

test('build snapshot remains populated when live upstreams are unavailable',()=>{
  const s=seedSnapshot();
  assert.equal(s.dataMode,'BUILD_SNAPSHOT');
  assert.equal(s.signals.length,14);
  assert.equal(s.markets.length,7);
  assert.ok(s.opportunities.length>=10);
  assert.ok(s.conflicts.length>=3);
  assert.equal(s.sourceCoverage.total,44);
  assert.equal(s.sourceCoverage.responded,0);
  assert.equal(s.metrics.liveRecords,0);
  assert.equal(s.metrics.fallbackRecords,14);
  assert.ok(s.signals.every(x=>x.fallback));
});

test('refinery strike is linked to energy infrastructure without earthquake false positive',()=>{
  const s=seedSnapshot().signals.find(x=>/Orsk refinery/i.test(x.title));
  assert.ok(s);
  assert.ok(s.publicIndicators.some(i=>/Energy infrastructure strike/i.test(i.label)));
  assert.ok(s.marketTransmission.some(t=>/Russian energy infrastructure disruption/i.test(t.name)));
  assert.ok(!s.marketTransmission.some(t=>/earthquake/i.test(t.name)));
});

test('port attack is recognized without earthquake false positive',()=>{
  const s=seedSnapshot().signals.find(x=>/Izmail/i.test(x.title));
  assert.ok(s);
  assert.ok(s.publicIndicators.some(i=>/Port attack/i.test(i.label)));
  assert.ok(!s.marketTransmission.some(t=>/earthquake/i.test(t.name)));
});

test('Taiwan hacking is cyber and blockade drill is conflict',()=>{
  const s=seedSnapshot();
  assert.equal(s.signals.find(x=>/hacking campaign/i.test(x.title))?.category,'cyber');
  assert.equal(s.signals.find(x=>/anti-blockade naval drill/i.test(x.title))?.category,'conflict');
});

test('tariff event is policy and Hormuz event is maritime with market transmission',()=>{
  const s=seedSnapshot();
  assert.equal(s.signals.find(x=>/tariff offer/i.test(x.title))?.category,'policy');
  const h=s.signals.find(x=>/Strait of Hormuz/i.test(x.title));
  assert.equal(h?.category,'maritime');
  assert.ok(h.marketTransmission.some(t=>/Hormuz escalation/i.test(t.name)));
});

test('substring regression: reported does not count as port',()=>{
  const r={title:'Government reported a policy change',summary:'Officials reported details to parliament.',url:'https://example.com/a',publishedAt:new Date().toISOString(),sourceDomain:'example.com'};
  const c=classifyRecord(r,{regionId:'europe',lat:50,lon:10});
  assert.notEqual(c.category,'maritime');
  assert.ok(!c.marketTransmission.some(t=>/earthquake/i.test(t.name)));
});

test('all seed market symbols are unique',()=>{
  assert.equal(new Set(seed.markets.map(m=>m.symbol)).size,seed.markets.length);
});
