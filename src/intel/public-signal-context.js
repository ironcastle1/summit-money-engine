import { PUBLIC_SIGNAL_INDICATORS } from '../catalog/public-signal-indicators.js';

export function matchPublicSignalIndicators(cluster){
  const text=(cluster.records||[]).map(r=>`${r.title||''} ${r.summary||''} ${r.classification?.eventType?.name||''}`).join(' ').toLowerCase();
  const hits=[];
  for(const rule of PUBLIC_SIGNAL_INDICATORS){
    const matched=rule.patterns.filter(pattern=>text.includes(pattern.toLowerCase()));
    if(!matched.length)continue;
    hits.push({id:rule.id,lane:rule.lane,label:rule.label,weight:rule.weight,why:rule.why,verify:[...rule.verify],matched:matched.slice(0,4)});
  }
  return hits.sort((a,b)=>b.weight-a.weight||a.label.localeCompare(b.label)).slice(0,12);
}
