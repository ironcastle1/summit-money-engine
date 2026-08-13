import { EXPOSURE_MATRIX } from '../catalog/exposure-matrix.js';
import { cleanText } from './text.js';

export function mapExposures(cluster,market){
  const text=cleanText(cluster.records.map(r=>`${r.title} ${r.summary}`).join(' ')).toLowerCase();
  const regions=[...cluster.regionIds]; const marketNames=new Set([...(market.assets||[]),...(market.potentialBeneficiaries||[]),...(market.potentialLosers||[])].map(x=>String(x).toLowerCase()));
  const rows=[];
  for(const exposure of EXPOSURE_MATRIX){
    if(!exposure.regions.includes('world')&&!exposure.regions.some(r=>regions.includes(r)))continue;
    const driverHits=exposure.drivers.filter(d=>text.includes(d.toLowerCase()));
    const symbolHit=exposure.symbols.some(s=>marketNames.has(String(s).toLowerCase())||text.includes(String(s).toLowerCase()));
    const nameHit=marketNames.has(exposure.name.toLowerCase());
    if(!driverHits.length&&!symbolHit&&!nameHit)continue;
    const relevance=Math.min(100,35+driverHits.length*14+(symbolHit?18:0)+(nameHit?20:0));
    rows.push({...exposure,driverHits,relevance});
  }
  return rows.sort((a,b)=>b.relevance-a.relevance).slice(0,10);
}
