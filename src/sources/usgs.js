import { fetchJson } from '../core/http.js';
import { stableId } from '../core/hash.js';
export async function runUsgs(source){
  const started=Date.now(); const {json}=await fetchJson(source.url); const features=Array.isArray(json?.features)?json.features:[];
  const items=features.flatMap(feature=>{
    const p=feature.properties||{}; const coords=feature.geometry?.coordinates||[]; const mag=Number(p.mag||0); const sig=Number(p.sig||0);
    if(!(mag>=6.5||sig>=800))return [];
    return [{id:stableId('usgs',feature.id||p.url),kind:'hazard',title:p.title||`Magnitude ${mag} earthquake`,summary:`Magnitude ${mag.toFixed(1)} · significance ${sig} · depth ${Number(coords[2]||0).toFixed(0)} km`,url:p.url,publishedAt:p.time?new Date(p.time).toISOString():new Date().toISOString(),sourceId:source.id,sourceName:source.name,sourceType:'official',sourceQuality:1,categoryHint:'natural-hazard',locationHint:{name:p.place||'Earthquake',lat:Number(coords[1]),lon:Number(coords[0])},magnitude:mag,significance:sig}];
  });
  return {items,markets:[],predictions:[],durationMs:Date.now()-started};
}
