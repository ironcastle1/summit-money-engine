import test from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../../src/infra/cache/ttl-cache.js';
import { WorldBankSource } from '../../src/intelligence-sources/world-bank-source.js';
import { UkPoliceSource } from '../../src/intelligence-sources/uk-police-source.js';
import { ReliefWebSource } from '../../src/intelligence-sources/reliefweb-source.js';
import { GoogleCivicSource } from '../../src/intelligence-sources/google-civic-source.js';
import { IntelligenceSourceRegistry } from '../../src/intelligence-sources/registry.js';

const cache=()=>new TtlCache({maxEntries:50});
const logger={child(){return this;},warn(){}};

test('World Bank source parses latest value and year', async () => {
  let requested='';
  const http={async json(url){requested=String(url);return [{},[{indicator:{id:'SP.POP.TOTL'},date:'2024',value:100},{indicator:{id:'SP.POP.TOTL'},date:'2023',value:90},{indicator:{id:'FP.CPI.TOTL.ZG'},date:'2024',value:4.2}]];}};
  const source=new WorldBankSource({http,cache:cache(),logger,enabled:true,baseUrl:'https://example.test/v2'});
  const result=await source.countryIndicators('GB');
  assert.equal(result.data.indicators.population.value,100); assert.equal(result.data.indicators.population.year,2024); assert.match(requested,/country\/GB\/indicator/); assert.match(requested,/format=json/);
});

test('UK Police source refuses unsupported countries without HTTP', async () => {
  let calls=0; const source=new UkPoliceSource({http:{async json(){calls+=1;return[];}},cache:cache(),logger,enabled:true,baseUrl:'https://example.test/api'});
  const result=await source.crimesAt({lat:48.8,lon:2.3},{countryCode:'FR'});
  assert.equal(result.unavailable,'UNSUPPORTED'); assert.equal(calls,0);
});

test('UK Police source aggregates crime categories', async () => {
  const payload=[{id:1,category:'robbery',month:'2026-05',location:{latitude:'51.5',longitude:'-0.1',street:{name:'A'}}},{id:2,category:'robbery',month:'2026-05',location:{latitude:'51.5',longitude:'-0.1',street:{name:'B'}}}];
  const source=new UkPoliceSource({http:{async json(){return payload;}},cache:cache(),logger,enabled:true,baseUrl:'https://example.test/api'});
  const result=await source.crimesAt({lat:51.5,lon:-0.1},{countryCode:'GB',date:'2026-05'});
  assert.equal(result.data.recordCount,2); assert.equal(result.data.categories.robbery,2);
});

test('credential-gated sources report NOT_CONFIGURED', () => {
  const relief=new ReliefWebSource({http:{},cache:cache(),logger,appName:'',baseUrl:'https://example.test'});
  const civic=new GoogleCivicSource({http:{},cache:cache(),logger,apiKey:'',baseUrl:'https://example.test'});
  assert.equal(relief.health().state,'NOT_CONFIGURED'); assert.equal(civic.health().state,'NOT_CONFIGURED');
});

test('registry rejects duplicate source IDs', () => {
  const registry=new IntelligenceSourceRegistry(); const source={id:'x',health(){return{state:'ONLINE'};}}; registry.register(source); assert.throws(()=>registry.register(source)); assert.equal(registry.health().x.state,'ONLINE');
});
