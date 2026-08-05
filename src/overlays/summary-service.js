export class OverlaySummaryService {
  summarize(results, unavailable=[]) {
    const byGroup={}; let featureCount=0;
    for(const result of results||[]){ const count=result.collection?.features?.length||0; featureCount+=count; byGroup[result.layer.group]=(byGroup[result.layer.group]||0)+count; }
    return Object.freeze({requested:(results?.length||0)+(unavailable?.length||0),returned:results?.length||0,unavailable:unavailable?.length||0,featureCount,byGroup:Object.freeze(byGroup),generatedAt:new Date().toISOString()});
  }
}
