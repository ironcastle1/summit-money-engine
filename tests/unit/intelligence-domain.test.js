import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCountryLookup, countryForEvent, nearestCity, normalizePlaceText } from '../../src/domain/intelligence/match.js';
import { eventRisk, conflictRisk, disasterRisk } from '../../src/domain/intelligence/event-risk.js';
import { analyseCrime } from '../../src/domain/intelligence/crime.js';
import { analyseElections } from '../../src/domain/intelligence/elections.js';
import { compositeSafetyRisk } from '../../src/domain/intelligence/safety.js';
import { economicProfile } from '../../src/domain/intelligence/economic.js';
import { intelligenceGeoJson } from '../../src/domain/intelligence/layers.js';

const countries = [
  { id:'gb',iso2:'GB',iso3:'GBR',name:'United Kingdom',nativeName:'United Kingdom',lat:54,lon:-2,areaKm2:243610,aliases:['UK','Great Britain'] },
  { id:'fr',iso2:'FR',iso3:'FRA',name:'France',nativeName:'France',lat:46,lon:2,areaKm2:551695,aliases:['French Republic'] }
];
const cities = [{ id:'london-gb',name:'London',country:'United Kingdom',countryCode:'GB',lat:51.5,lon:-0.1 }];
const now = Date.now();
function event(overrides={}) { return { id:'e1',country:'United Kingdom',category:'conflict',severity:4,time:new Date(now-3_600_000).toISOString(),lat:51.5,lon:-0.1,...overrides }; }

test('place text normalization removes punctuation and accents', () => { assert.equal(normalizePlaceText('République  Française'), 'republique francaise'); });
test('country lookup resolves ISO and aliases', () => { const lookup=buildCountryLookup(countries); assert.equal(lookup.get('uk').iso2,'GB'); assert.equal(lookup.get('french republic').iso2,'FR'); });
test('events use explicit country before geographic fallback', () => { const lookup=buildCountryLookup(countries); const result=countryForEvent(event({lat:0,lon:0}),countries,lookup); assert.equal(result.country.iso2,'GB'); assert.equal(result.method,'COUNTRY_FIELD'); });
test('events without country use nearest credible centroid', () => { const lookup=buildCountryLookup(countries); const result=countryForEvent(event({country:null,lat:48.8,lon:2.3}),countries,lookup); assert.equal(result.country.iso2,'FR'); });
test('nearest city applies a maximum distance', () => { assert.equal(nearestCity({lat:51.6,lon:-0.2},cities,100).city.id,'london-gb'); assert.equal(nearestCity({lat:-30,lon:120},cities,100),null); });
test('event risk increases with severity and recency', () => { const low=eventRisk([event({severity:1,time:new Date(now-7*86_400_000).toISOString()})],{now}); const high=eventRisk([event({severity:5})],{now}); assert.ok(high.score>low.score); });
test('conflict and disaster risk separate categories', () => { const events=[event(),event({id:'e2',category:'earthquake'}),event({id:'e3',category:'terror'})]; assert.equal(conflictRisk(events,{now}).count,2); assert.equal(disasterRisk(events,{now}).count,1); });
test('crime analysis is unavailable without provider data', () => { const result=analyseCrime(null); assert.equal(result.available,false); assert.equal(result.score,null); });
test('crime analysis weights violent categories above low-severity categories', () => { const violent=analyseCrime({records:Array(20).fill({}),recordCount:20,period:'2026-05',categories:{'violence-and-sexual-offences':20}}); const nuisance=analyseCrime({records:Array(20).fill({}),recordCount:20,period:'2026-05',categories:{'anti-social-behaviour':20}}); assert.ok(violent.score>nuisance.score); assert.equal(violent.categories[0].count,20); });
test('election proximity decays with time', () => { const soon=new Date(now+10*86_400_000).toISOString().slice(0,10); const later=new Date(now+180*86_400_000).toISOString().slice(0,10); const a=analyseElections({elections:[{id:'1',name:'Soon',electionDay:soon,ocdDivisionId:'ocd-division/country:us'}]},{countryCode:'US',now}); const b=analyseElections({elections:[{id:'2',name:'Later',electionDay:later,ocdDivisionId:'ocd-division/country:us'}]},{countryCode:'US',now}); assert.ok(a.proximityScore>b.proximityScore); });
test('election analysis filters country divisions', () => { const date=new Date(now+10*86_400_000).toISOString().slice(0,10); const result=analyseElections({elections:[{id:'1',name:'US',electionDay:date,ocdDivisionId:'ocd-division/country:us'},{id:'2',name:'CA',electionDay:date,ocdDivisionId:'ocd-division/country:ca'}]},{countryCode:'US',now}); assert.equal(result.count,1); });
test('composite safety reweights available evidence and reports coverage', () => { const partial=compositeSafetyRisk({conflictScore:80,disasterScore:20,eventConfidence:70}); assert.ok(partial.score>40); assert.ok(partial.coveragePct<100); assert.ok(partial.confidence<70); });
test('economic profile keeps missing indicators unavailable', () => { const result=economicProfile({inflationPct:{value:10},unemploymentPct:{value:5},internetPct:null}); assert.ok(Number.isFinite(result.stressScore)); assert.equal(result.digitalScore,null); });
test('intelligence GeoJSON retains separate layer values', () => { const metrics=new Map([['GB',{composite:{score:50,confidence:60},conflict:{score:70},disaster:{score:10},crime:{score:null},elections:{proximityScore:20},economic:{stressScore:30}}]]); const geo=intelligenceGeoJson(countries,cities,metrics,new Map()); assert.equal(geo.countries.features[0].properties.conflict,70); assert.equal(geo.countries.features[0].properties.crime,null); });
