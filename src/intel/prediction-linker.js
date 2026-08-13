import { jaccard, tokenSet } from './text.js';
export function linkPredictions(cluster,predictions){
  const ct=tokenSet(cluster.records.map(r=>r.title).join(' ')); const rows=[];
  for(const p of predictions||[]){const sim=jaccard(ct,tokenSet(`${p.title} ${p.description||''}`)); if(sim<0.09)continue; rows.push({...p,relevance:Number(sim.toFixed(3))});}
  return rows.sort((a,b)=>b.relevance-a.relevance||b.volume-a.volume).slice(0,4);
}
