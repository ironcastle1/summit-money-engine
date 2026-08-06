import { filterOverlayRecords } from './filter-engine.js';
import { normalizeOverlayFeature, featureCollection } from './feature-normalizer.js';
import { freshnessState } from './freshness.js';
import { buildOverlayLegend } from './legend-builder.js';
export class OverlayPlatform {
  constructor(options){ Object.assign(this,options); }
  async query(request={}){
    const started=performance.now(); const plan=this.planner.plan(request); const results=[];
    for(const task of plan.tasks){ const loaded=await this.providers.load(task,{request}); const filtered=filterOverlayRecords(loaded.records||[],task.filters,{limit:task.limit}); const features=filtered.map((record,index)=>normalizeOverlayFeature(record,task.layer,index)).filter(Boolean); const collection=featureCollection(features,{layerId:task.id,source:loaded.source,sourceMode:loaded.mode||task.layer.sourceMode,generatedAt:loaded.generatedAt}); results.push(Object.freeze({layerId:task.id,layer:task.layer,collection,legend:buildOverlayLegend(task.layer,features),freshness:freshnessState(task.layer,loaded.generatedAt),source:loaded.source,sourceMode:loaded.mode||task.layer.sourceMode})); }
    this.metrics.increment('queries'); this.metrics.increment('features',results.reduce((sum,result)=>sum+result.collection.features.length,0)); this.metrics.observe('queryMs',performance.now()-started);
    return Object.freeze({results:Object.freeze(results),unavailable:plan.unavailable,summary:this.summary.summarize(results,plan.unavailable),generatedAt:new Date().toISOString()});
  }
  async layer(id,options={}){ const response=await this.query({...options,layerIds:[id]}); return response.results[0]||Object.freeze({layerId:id,collection:featureCollection([]),unavailable:response.unavailable[0]||null}); }
  catalogSnapshot(){ return this.catalog.snapshot(); }
  diagnostics(){ return Object.freeze({catalogSize:this.catalog.list().length,providers:this.providers.list(),metrics:this.metrics.snapshot()}); }
}
