import { TRANSMISSION_RULES } from '../catalog/market-transmission.js';
import { cleanText } from './text.js';
const uniq=a=>[...new Set(a.filter(Boolean))];
export function marketReadThrough(cluster){
  const text=cleanText(cluster.records.map(r=>`${r.title} ${r.summary}`).join(' ')).toLowerCase(); const regionIds=[...cluster.regionIds]; const matches=[];
  for(const rule of TRANSMISSION_RULES){
    const termHits=rule.terms.filter(t=>text.includes(t.toLowerCase())); if(!termHits.length)continue;
    const regionHit=rule.regions.includes('world')||rule.regions.some(r=>regionIds.includes(r)); if(!regionHit)continue;
    const uniqueAnchors=['hormuz','bab el-mandeb','suez','malacca','opec','iaea','north korea','federal reserve','bank of japan','ecb','port strike','capital controls'];
    const hasUniqueAnchor=termHits.some(t=>uniqueAnchors.some(a=>t.toLowerCase().includes(a)));
    const specialEarthquake=rule.name.includes('earthquake')&&cluster.primary==='natural-hazard';
    if(termHits.length<2&&!hasUniqueAnchor&&!specialEarthquake)continue;
    matches.push({...rule,termHits,matchScore:Math.min(100,Math.round(termHits.length*18+rule.baseConfidence*55))});
  }
  matches.sort((a,b)=>b.matchScore-a.matchScore); const top=matches.slice(0,4);
  return {rules:top,assets:uniq(top.flatMap(r=>r.assetImpacts)),potentialBeneficiaries:uniq(top.flatMap(r=>r.potentialBeneficiaries)),potentialLosers:uniq(top.flatMap(r=>r.potentialLosers)),horizons:uniq(top.map(r=>r.horizon)),rationales:top.map(r=>r.rationale)};
}
