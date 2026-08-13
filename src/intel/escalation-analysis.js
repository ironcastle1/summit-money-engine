import { ESCALATION_INDICATORS } from '../catalog/escalation-indicators.js';
import { cleanText } from './text.js';

export function assessEscalation(cluster){
  const text=cleanText(cluster.records.map(r=>`${r.title} ${r.summary}`).join(' ')).toLowerCase();
  const regions=[...cluster.regionIds]; const matched=[];
  for(const indicator of ESCALATION_INDICATORS){
    if(!indicator.regions.includes('world')&&!indicator.regions.some(r=>regions.includes(r)))continue;
    const hits=indicator.terms.filter(t=>text.includes(t.toLowerCase()));
    if(!hits.length)continue;
    const confirmations=(indicator.confirmationTerms||[]).filter(t=>text.includes(t.toLowerCase()));
    const strength=Math.min(100,Math.abs(indicator.weight)*2.5+hits.length*12+confirmations.length*10);
    matched.push({...indicator,hits,confirmations,strength});
  }
  matched.sort((a,b)=>b.strength-a.strength);
  const signed=matched.reduce((sum,x)=>sum+x.weight*Math.min(1,x.strength/70),0);
  const score=Math.max(-100,Math.min(100,Math.round(signed)));
  const direction=score>=18?'ESCALATING':score<=-12?'DE-ESCALATING':matched.length?'MIXED / WATCH':'NEUTRAL';
  return {score,direction,indicators:matched.slice(0,8)};
}
