import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TtlCache } from '../../src/infra/cache/ttl-cache.js';
import { IntelligenceCatalogService } from '../../src/services/intelligence-catalog-service.js';
import { CountryIntelligenceService } from '../../src/services/country-intelligence-service.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
let catalog;
test.before(async()=>{catalog=await IntelligenceCatalogService.create({countriesPath:path.join(root,'data/countries.json'),citiesPath:path.join(root,'data/cities.json')});});

test('intelligence catalogue loads global countries and cities',()=>{const summary=catalog.summary();assert.ok(summary.countries>=225);assert.ok(summary.cities>=240);assert.ok(summary.regions>=5);assert.equal(catalog.country('GB').name,'United Kingdom');});
test('catalogue search resolves aliases and city country filters',()=>{assert.equal(catalog.country('UK').iso2,'GB');assert.ok(catalog.listCountries({query:'United King'}).some(item=>item.iso2==='GB'));assert.ok(catalog.listCities({countryCode:'GB'}).some(item=>item.name==='London'));});
test('catalogue emits separate country and city feature collections',()=>{const geo=catalog.geojson(new Map(),new Map());assert.equal(geo.countries.type,'FeatureCollection');assert.equal(geo.countries.features.length,catalog.countries.length);assert.equal(geo.cities.features.length,catalog.cities.length);});
test('nearest city and country use coordinates',()=>{assert.equal(catalog.nearestCity({lat:51.5,lon:-0.1},100).city.name,'London');assert.equal(catalog.nearestCountry({lat:51.5,lon:-0.1}).country.iso2,'GB');});

function serviceFixture(){
  const now=new Date().toISOString();
  const events={
    async globalSnapshot(){return{events:[{id:'gb1',country:'United Kingdom',category:'conflict',severity:4,time:now,lat:51.5,lon:-0.1},{id:'fr1',country:'France',category:'earthquake',severity:2,time:now,lat:48.8,lon:2.3}],sources:{a:{state:'ONLINE'},b:{state:'OFFLINE'}}};},
    async scanRadius(){return{events:[{id:'local',country:'United Kingdom',category:'crime',severity:3,time:now,lat:51.5,lon:-0.1}],sourceStatus:{a:{state:'ONLINE'}}};}
  };
  const news={async search(options){return{stories:options.query?[{id:'s1',title:`${options.query} disruption`,countries:['GB'],verification:{score:80},impacts:[{direction:'NEGATIVE',confidence:70}],articleIds:['a']}]:[],sources:{n:{state:'ONLINE'}}};}};
  const sourceMap={
    'world-bank':{async countryIndicators(){return{data:{indicators:{inflationPct:{value:5,year:2025},unemploymentPct:{value:4,year:2025}}}};}},
    'uk-police':{async crimesAt(point,{countryCode}){return countryCode==='GB'?{data:{records:[{}],recordCount:1,period:'2026-05',categories:{robbery:1}}}:{data:null};}},
    reliefweb:{async reports(){return{data:{reports:[],recordCount:0}};}},
    'google-civic':{async elections(){return{data:null};}}
  };
  const sources={get(id){return sourceMap[id];},health(){return{worldBank:{state:'ONLINE'},police:{state:'ONLINE'}};}};
  return new CountryIntelligenceService({catalog,events,news,sources,cache:new TtlCache({maxEntries:100})});
}

test('country overview assigns different evidence to different countries',async()=>{const result=await serviceFixture().overview({hours:168});const gb=result.countries.find(item=>item.country.iso2==='GB');const fr=result.countries.find(item=>item.country.iso2==='FR');assert.equal(gb.eventCount,1);assert.equal(fr.eventCount,1);assert.notEqual(gb.metrics.conflict.score,fr.metrics.conflict.score);});
test('country detail fuses event, crime, economic, and news evidence',async()=>{const result=await serviceFixture().countryDetail('GB',{hours:168});assert.equal(result.country.iso2,'GB');assert.equal(result.metrics.crime.available,true);assert.ok(Number.isFinite(result.metrics.economic.stressScore));assert.equal(result.stories.length,1);});
test('city detail uses a real radius scan and supported crime provider',async()=>{const result=await serviceFixture().cityDetail('london-gb',{radiusKm:100,lookbackDays:7});assert.equal(result.city.name,'London');assert.equal(result.events[0].id,'local');assert.equal(result.metrics.crime.available,true);});
test('point detail preserves requested coordinates and nearest place',async()=>{const result=await serviceFixture().pointDetail({lat:51.5,lon:-0.1},{radiusKm:75,lookbackDays:7});assert.equal(result.point.radiusKm,75);assert.equal(result.nearestCity.name,'London');assert.equal(result.country.iso2,'GB');});
test('unknown country and city fail explicitly',async()=>{await assert.rejects(()=>serviceFixture().countryDetail('ZZ'),error=>error.code==='COUNTRY_NOT_FOUND');await assert.rejects(()=>serviceFixture().cityDetail('missing'),error=>error.code==='CITY_NOT_FOUND');});
