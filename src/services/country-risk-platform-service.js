import {
  buildCountryRiskProfile,
  compareCountries,
  CountryRiskExportService,
  CountryRiskWatchlist,
  countryRiskCatalog,
  countryRiskFeatures,
  evaluateCountryAlerts,
  rankCountries,
  runCountryScenario
}
from '../country-risk/index.js';
import {
  countryRiskDiagnostics
}
from '../country-risk/diagnostics.js';
import {
  normalizedRiskRequest,
  normalizedScenario
}
from '../country-risk/validation.js';
function withDeadline(promise,milliseconds,fallback){
  let timer;
  return Promise.race([Promise.resolve(promise),new Promise(resolve=>{
    timer=setTimeout(()=>resolve(fallback),milliseconds);
    timer.unref?.();
  })]).finally(()=>clearTimeout(timer));
}
export class CountryRiskPlatformService {
  constructor(options={
  }){
    this.countryIntelligence=options.countryIntelligence;
    this.countryCatalog=options.countryCatalog;
    this.eventService=options.eventService;
    this.intelligenceRegistry=options.intelligenceRegistry;
    this.watchlist=options.watchlist||new CountryRiskWatchlist();
    this.exporter=options.exporter||new CountryRiskExportService();
    this.snapshotCache=new Map();
    this.cacheTtlMs=Math.max(5000,Number(options.cacheTtlMs)||60000);
  }
  catalog(){
    return Object.freeze({
      ...countryRiskCatalog(),countries:this.countryCatalog?.listCountries?.({
        limit:500
      })||[]
    });
  }
  diagnostics(){
    return Object.freeze({
      ...countryRiskDiagnostics(this),sources:this.intelligenceRegistry?.health?.()||[]
    });
  }
  cacheKey(request){
    return JSON.stringify(request);
  }
  cached(request){
    const item=this.snapshotCache.get(this.cacheKey(request));
    return item&&Date.now()-item.createdAt<this.cacheTtlMs?item.value:null;
  }
  remember(request,value){
    this.snapshotCache.set(this.cacheKey(request),{
      createdAt:Date.now(),value
    });
    if(this.snapshotCache.size>20)this.snapshotCache.delete(this.snapshotCache.keys().next().value);
    return value;
  }
  async overviewInput(request){
    return withDeadline(this.countryIntelligence.overview({
      hours:request.hours,includeNews:request.includeNews,minimumRisk:0,limit:500
    }),12000,{
      countries:[],generatedAt:new Date().toISOString(),eventSources:{
      },newsSources:{
      },intelligenceSources:[]
    });
  }
  async snapshot(input={
  }){
    const request=normalizedRiskRequest(input);
    if(!request.force){
      const cached=this.cached(request);
      if(cached)return Object.freeze({
        ...cached,cache:'HIT'
      });
    }
    const overview=input.overview||await this.overviewInput(request);
    const profiles=(input.profiles||overview.countries||[]).map(item=>item.risk?item:buildCountryRiskProfile({
      country:item.country||item,metrics:item.metrics,events:item.events||[],sources:{
        events:overview.eventSources,news:overview.newsSources,intelligence:overview.intelligenceSources
      },indicators:item.indicators||{
      }
    })).filter(profile=>profile.risk.score>=request.minimumRisk&&profile.risk.score<=request.maximumRisk).filter(profile=>!request.region||[profile.country.region,profile.country.subregion].includes(request.region)).filter(profile=>!request.query||`${profile.country.name} ${profile.country.nativeName||''} ${profile.country.iso2}`.toLowerCase().includes(request.query.toLowerCase()));
    const ranked=rankCountries(profiles).slice(0,request.limit);
    const result=Object.freeze({
      profiles:ranked,features:countryRiskFeatures(ranked),summary:Object.freeze({
        countries:ranked.length,high:ranked.filter(p=>p.risk.score>=65).length,severe:ranked.filter(p=>p.risk.score>=80).length,average:ranked.length?Math.round(ranked.reduce((s,p)=>s+p.risk.score,0)/ranked.length*10)/10:0
      }),sources:Object.freeze({
        events:overview.eventSources||{
        },news:overview.newsSources||{
        },intelligence:overview.intelligenceSources||[]
      }),generatedAt:new Date().toISOString(),cache:'MISS'
    });
    return input.profiles?result:this.remember(request,result);
  }
  async country(id,input={
  }){
    const detail=input.detail||await this.countryIntelligence.countryDetail(id,{
      hours:input.hours||168
    });
    return buildCountryRiskProfile({
      ...detail,country:detail.country,events:detail.events,elections:detail.electionData?.elections||[],sources:detail.sources
    });
  }
  async compare(input={
  }){
    const ids=(input.countryIds||input.ids||[]).slice(0,20);
    const profiles=input.profiles||await Promise.all(ids.map(id=>this.country(id,input)));
    return compareCountries(profiles);
  }
  async scenario(input={
  }){
    const request=normalizedScenario(input);
    const profile=input.profile||await this.country(request.countryId,input);
    return runCountryScenario(profile,request);
  }
  async alerts(owner,input={
  }){
    const watches=await this.watchlist.list(owner);
    const ids=[...new Set(watches.map(item=>item.iso2))];
    const profiles=input.profiles||await Promise.all(ids.map(id=>this.country(id,input).catch(()=>null))).then(items=>items.filter(Boolean));
    return evaluateCountryAlerts(watches,profiles);
  }
}
export function createCountryRiskPlatformService(options){
  return new CountryRiskPlatformService(options);
}
