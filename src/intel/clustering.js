import { jaccard, tokenSet } from './text.js';

// Cluster different reports about the same development without collapsing every event in a hot country
// into one story. Shared geography is supporting evidence, never sufficient by itself.
export function cluster(records){
  const clusters=[];
  for(const row of records){
    let best=null,bestScore=0;
    const rowTokens=tokenSet(row.title);
    for(const c of clusters){
      if(Math.abs(Date.parse(c.latestAt)-Date.parse(row.publishedAt))>18*3600000)continue;
      const sim=jaccard(c.titleTokens,rowTokens);
      const sameTopic=c.primary===row.classification.primary;
      const sameEventType=Boolean(c.eventTypeId&&c.eventTypeId===row.classification?.eventType?.id);
      // Different event classes at the same location (e.g. sanctions vs nuclear vs force posture)
      // require strong lexical overlap before they may merge.
      if(!sameTopic&&!sameEventType&&sim<0.42)continue;
      const sameNode=Boolean(c.nodeId&&c.nodeId===row.materiality.nearestNode?.id);
      const sameLocation=Boolean(c.location?.name&&c.location.name===row.location?.name);
      const score=(sameTopic?.34:0)+(sameEventType?.22:0)+(sameNode?.14:0)+(sameLocation?.08:0)+sim*.62;
      if(score>bestScore){bestScore=score;best=c;}
    }
    if(best&&bestScore>=.55)add(best,row);else clusters.push(create(row));
  }
  return clusters.sort((a,b)=>b.maxMateriality-a.maxMateriality||Date.parse(b.latestAt)-Date.parse(a.latestAt));
}
function create(row){return{id:`cluster:${row.id}`,primary:row.classification.primary,eventTypeId:row.classification?.eventType?.id||null,topics:new Set(row.classification.topics.map(x=>x.topic)),nodeId:row.materiality.nearestNode?.id||null,location:row.location,regionIds:new Set(row.regionIds),tokens:tokenSet(`${row.title} ${row.summary}`),titleTokens:tokenSet(row.title),records:[row],latestAt:row.publishedAt,maxMateriality:row.materiality.score};}
function add(c,row){c.records.push(row);c.latestAt=Date.parse(row.publishedAt)>Date.parse(c.latestAt)?row.publishedAt:c.latestAt;c.maxMateriality=Math.max(c.maxMateriality,row.materiality.score);for(const t of row.classification.topics)c.topics.add(t.topic);for(const r of row.regionIds)c.regionIds.add(r);for(const t of tokenSet(`${row.title} ${row.summary}`))c.tokens.add(t);for(const t of tokenSet(row.title))c.titleTokens.add(t);if(!c.location&&row.location)c.location=row.location;}
