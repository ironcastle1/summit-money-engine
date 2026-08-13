import { DECISION_PLAYBOOKS } from '../catalog/decision-playbooks.js';
import { cleanText } from './text.js';

export function matchPlaybooks(cluster,{institutions=[],escalation=null}={}){
  const text=cleanText(cluster.records.map(r=>`${r.title} ${r.summary}`).join(' ')).toLowerCase(); const regions=[...cluster.regionIds];
  const institutionIds=new Set(institutions.map(x=>x.id)); const anchor=cluster.records.find(r=>r.materiality?.nearestNode||r.materiality?.nearestArea); const nodeIds=new Set([anchor?.materiality?.nearestNode?.id,anchor?.materiality?.nearestArea?.id].filter(Boolean));
  const rows=[];
  for(const book of DECISION_PLAYBOOKS){
    if(!book.regions.some(r=>r==='world'||regions.includes(r)))continue;
    const hits=book.triggerConcepts.filter(t=>text.includes(t.toLowerCase()));
    const institutionHits=book.priorityInstitutions.filter(id=>institutionIds.has(id));
    const nodeHit=book.strategicNodes.some(id=>nodeIds.has(id));
    if(!hits.length&&!institutionHits.length&&!nodeHit)continue;
    const score=Math.min(100,hits.length*20+institutionHits.length*11+(nodeHit?18:0)+(escalation?.direction==='ESCALATING'?8:0));
    const phase=score>=78?'ACTIVE / ESCALATING':score>=52?'ESCALATING':'WATCH';
    rows.push({...book,hits,institutionHits,nodeHit:Boolean(nodeHit),matchScore:score,phase});
  }
  return rows.sort((a,b)=>b.matchScore-a.matchScore).slice(0,4);
}
