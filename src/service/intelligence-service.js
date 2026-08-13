import { config } from '../config.js';
import { sourceCatalog, runnerFor } from '../sources/registry.js';
import { runPool } from '../core/http.js';
import { runIntelligencePipeline } from '../intel/pipeline.js';
import { fixtureResults } from '../sources/fixture.js';
import { loadSnapshot, saveSnapshot } from '../storage/snapshot-store.js';
import { log } from '../core/log.js';
import { planFollowUps } from '../intel/follow-up-planner.js';
import { runGdelt } from '../sources/gdelt.js';

export class IntelligenceService{
  #sources=sourceCatalog(); #snapshot=null; #refreshPromise=null; #startedAt=new Date().toISOString(); #timer=null;
  async init(){
    const stored=await loadSnapshot(); if(stored)this.#snapshot=stored;
    if(config.fixtureMode){this.#snapshot=this.#buildFixture();await saveSnapshot(this.#snapshot).catch(()=>{});return this;}
    if(!this.#snapshot)this.#snapshot=runIntelligencePipeline({sourceStatuses:this.#sources.map(s=>status(s,'waiting'))});
    if(!config.disableLiveRefresh){this.refresh('startup').catch(e=>log.warn('startup-refresh-failed',{message:e.message}));this.#timer=setInterval(()=>this.refresh('interval').catch(e=>log.warn('interval-refresh-failed',{message:e.message})),config.refreshMs);this.#timer.unref?.();}
    return this;
  }
  get snapshot(){return this.#snapshot;} get sources(){return this.#sources;} get startedAt(){return this.#startedAt;} get refreshing(){return Boolean(this.#refreshPromise);}
  async refresh(reason='manual'){
    if(config.fixtureMode){this.#snapshot=this.#buildFixture();return this.#snapshot;}
    if(this.#refreshPromise)return this.#refreshPromise;
    this.#refreshPromise=this.#doRefresh(reason).finally(()=>{this.#refreshPromise=null}); return this.#refreshPromise;
  }
  #buildFixture(){const f=fixtureResults();const statuses=this.#sources.map(s=>status(s,'ok',{checkedAt:new Date().toISOString(),itemCount:s.kind==='gdelt'?4:1,durationMs:12}));const snapshot=runIntelligencePipeline({rawItems:f.items,markets:f.markets,predictions:f.predictions,sourceStatuses:statuses});snapshot.demoMode=true;snapshot.demoNotice='Deterministic demo dataset for interface testing; not live reporting.';return snapshot;}
  async #doRefresh(reason){
    const started=Date.now(); log.info('refresh-start',{reason,sources:this.#sources.length});
    const results=await runPool(this.#sources.map(source=>()=>runnerFor(source)()),config.concurrency);
    let rawItems=[],markets=[],predictions=[];const statuses=[];let successful=0;
    for(let i=0;i<this.#sources.length;i++){
      const source=this.#sources[i],result=results[i];
      if(result?.ok){successful++; const v=result.value||{};rawItems.push(...(v.items||[]));markets.push(...(v.markets||[]));predictions.push(...(v.predictions||[]));statuses.push(status(source,'ok',{checkedAt:new Date().toISOString(),itemCount:(v.items?.length||0)+(v.markets?.length||0)+(v.predictions?.length||0),durationMs:result.durationMs}));}
      else statuses.push(status(source,'error',{checkedAt:new Date().toISOString(),error:String(result?.error?.message||'source_failed'),durationMs:result?.durationMs||null}));
    }
    if(successful===0&&this.#snapshot?.signals?.length){this.#snapshot={...this.#snapshot,sourceStatuses:statuses,lastRefreshAttempt:new Date().toISOString(),refreshError:'All live sources failed; retaining last successful intelligence snapshot.'};return this.#snapshot;}
    rawItems=retainRecentRaw(rawItems,this.#snapshot?.records||[],statuses); markets=mergeMarkets(markets,this.#snapshot?.markets||[]); predictions=mergePredictions(predictions,this.#snapshot?.predictions||[]);
    let preliminary=runIntelligencePipeline({rawItems,markets,predictions,sourceStatuses:statuses,previousSignals:this.#snapshot?.signals||[]});
    const followUps=planFollowUps(preliminary.signals,{max:config.followUpMax,minScore:config.followUpMinScore});
    if(followUps.length){
      const followResults=await runPool(followUps.map(source=>()=>runGdelt(source)),Math.min(config.concurrency,4));
      for(let i=0;i<followUps.length;i++){const source=followUps[i],result=followResults[i];if(result?.ok){rawItems.push(...(result.value?.items||[]));statuses.push(status(source,'ok',{checkedAt:new Date().toISOString(),itemCount:result.value?.items?.length||0,durationMs:result.durationMs,adaptive:true}));}else statuses.push(status(source,'error',{checkedAt:new Date().toISOString(),error:String(result?.error?.message||'followup_failed'),durationMs:result?.durationMs||null,adaptive:true}));}
    }
    const next=runIntelligencePipeline({rawItems,markets,predictions,sourceStatuses:statuses,previousSignals:this.#snapshot?.signals||[]}); next.followUpQueries=followUps.length; next.refreshReason=reason; next.refreshDurationMs=Date.now()-started; next.successfulSources=successful; next.totalSources=this.#sources.length;
    this.#snapshot=next; await saveSnapshot(next).catch(e=>log.warn('snapshot-save-failed',{message:e.message})); log.info('refresh-complete',{durationMs:next.refreshDurationMs,signals:next.signals.length,successful}); return next;
  }
}
function status(source,status_,extra={}){return {id:source.id,name:source.name,kind:source.kind,type:source.type,lane:source.lane||null,regionId:source.regionId||null,status:status_,...extra};}
function retainRecentRaw(current,previous,statuses){
  const failed=new Set(statuses.filter(s=>s.status==='error').map(s=>s.id));const seen=new Set(current.map(x=>x.url));const cutoff=Date.now()-config.sourceRetentionHours*3600000;
  for(const row of previous){if(Date.parse(row.publishedAt||'')<cutoff||seen.has(row.url))continue;if(failed.has(row.sourceId)||[...failed].some(id=>row.sourceId?.includes(id))){current.push({...row,retainedFromLastSnapshot:true});seen.add(row.url);}}
  return current;
}
function mergeMarkets(current,previous){const by=new Map(current.map(x=>[x.id,x]));const cutoff=Date.now()-config.marketRetentionHours*3600000;for(const row of previous){if(!by.has(row.id)&&Date.parse(row.updatedAt||'')>=cutoff)by.set(row.id,{...row,stale:true});}return [...by.values()];}
function mergePredictions(current,previous){const by=new Map(current.map(x=>[x.id,x]));const cutoff=Date.now()-12*3600000;for(const row of previous){if(!by.has(row.id)&&Date.parse(row.updatedAt||'')>=cutoff)by.set(row.id,{...row,stale:true});}return [...by.values()];}
