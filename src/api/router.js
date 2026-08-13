import { json } from '../core/response.js';
import { REGIONS } from '../catalog/regions.js';
import { STRATEGIC_NODES } from '../catalog/strategic-nodes.js';
import { STRATEGIC_AREAS } from '../catalog/strategic-areas.js';
import { COUNTRY_PRIORITY_PROFILES } from '../catalog/country-priority-profiles.js';
import { SCENARIOS } from '../catalog/scenarios.js';
import { reference } from '../catalog/reference.js';
import { SOURCE_POLICY, BLOCKED_DOMAINS } from '../catalog/source-policy.js';

export function createApiRouter(service){
  return async function route(req,res,url){
    if(url.pathname==='/api/health')return json(res,200,{ready:true,version:'7.0.0',startedAt:service.startedAt,refreshing:service.refreshing,generatedAt:service.snapshot?.generatedAt||null,signals:service.snapshot?.signals?.length||0,sources:service.sources.length});
    if(url.pathname==='/api/reference')return json(res,200,{regions:REGIONS,strategicNodes:STRATEGIC_NODES,strategicAreas:STRATEGIC_AREAS,countryPriorityProfiles:COUNTRY_PRIORITY_PROFILES,scenarios:SCENARIOS,countries:reference.countries,cities:reference.cities,ports:reference.ports,routes:reference.routes,chokepoints:reference.chokepoints});
    if(url.pathname==='/api/source-policy')return json(res,200,{sources:SOURCE_POLICY,blockedDomains:BLOCKED_DOMAINS});
    if(url.pathname==='/api/snapshot')return json(res,200,filterSnapshot(service.snapshot,url.searchParams));
    if(url.pathname==='/api/signals')return json(res,200,{generatedAt:service.snapshot.generatedAt,signals:filterSignals(service.snapshot.signals,url.searchParams)});
    if(url.pathname==='/api/sources')return json(res,200,{refreshing:service.refreshing,coverage:service.snapshot.sourceCoverage||{},sources:service.snapshot.sourceStatuses||[]});
    if(url.pathname==='/api/refresh'&&['POST','GET'].includes(req.method)){const snapshot=await service.refresh('api');return json(res,200,{ok:true,generatedAt:snapshot.generatedAt,signals:snapshot.signals.length,successfulSources:snapshot.successfulSources??null,totalSources:snapshot.totalSources??service.sources.length});}
    return json(res,404,{error:'not_found'});
  };
}
function filterSnapshot(snapshot,params){
  const signals=filterSignals(snapshot.signals||[],params);const region=params.get('region')||'world';const hours=clamp(Number(params.get('hours')||48),1,72);const cutoff=Date.now()-hours*3600000;
  const records=(snapshot.records||[]).filter(r=>Date.parse(r.publishedAt)>=cutoff&&(region==='world'||r.regionIds.includes(region))).slice(0,400);
  return {...snapshot,signals,records,filter:{region,hours,minScore:Number(params.get('minScore')||48),category:params.get('category')||'all'}};
}
function filterSignals(rows,params){
  const region=params.get('region')||'world',category=params.get('category')||'all',minScore=clamp(Number(params.get('minScore')||48),0,100),hours=clamp(Number(params.get('hours')||48),1,72),cutoff=Date.now()-hours*3600000;
  return rows.filter(s=>s.signalScore>=minScore&&Date.parse(s.publishedAt)>=cutoff&&(region==='world'||s.regionIds.includes(region))&&(category==='all'||s.category===category));
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
