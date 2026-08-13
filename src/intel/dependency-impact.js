import { DEPENDENCY_GRAPH } from '../catalog/dependency-graph.js';
import { cleanText } from './text.js';

export function affectedDependencies(cluster,{market,exposures=[]}={}){
  const text=cleanText(cluster.records.map(r=>`${r.title} ${r.summary}`).join(' ')).toLowerCase(); const regions=[...cluster.regionIds];
  const nodes=new Set(cluster.records.map(r=>r.materiality?.nearestNode?.id).filter(Boolean));
  const exposureIds=new Set(exposures.map(x=>x.id));
  const marketTerms=new Set([...(market?.assets||[]),...(market?.potentialBeneficiaries||[]),...(market?.potentialLosers||[])].map(x=>String(x).toLowerCase()));
  const rows=[];
  for(const d of DEPENDENCY_GRAPH){
    if(!d.regions.some(r=>r==='world'||regions.includes(r)))continue;
    const textHit=[d.origin,d.destination,d.flow].some(x=>x&&text.includes(String(x).toLowerCase()));
    const nodeHits=d.strategicNodes.filter(n=>nodes.has(n)); const exposureHits=d.financialExposures.filter(x=>exposureIds.has(x)||marketTerms.has(String(x).toLowerCase()));
    if(!textHit&&!nodeHits.length&&!exposureHits.length)continue;
    const relevance=Math.min(100,(textHit?28:0)+nodeHits.length*24+exposureHits.length*18+15);
    rows.push({...d,nodeHits,exposureHits,relevance});
  }
  return rows.sort((a,b)=>b.relevance-a.relevance).slice(0,8);
}
