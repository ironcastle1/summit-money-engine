import { fetchJson } from '../core/http.js';
import { isAllowedReportingDomain, sourcePolicyForUrl } from '../catalog/source-policy.js';
import { stableId } from '../core/hash.js';

export function gdeltUrl(source){
  const p=new URLSearchParams({query:source.query,mode:'ArtList',maxrecords:'250',format:'json',sort:'HybridRel',formatdatetime:'1'});
  return `https://api.gdeltproject.org/api/v2/doc/doc?${p}`;
}
export async function runGdelt(source){
  const started=Date.now(); const {json}=await fetchJson(gdeltUrl(source));
  const rows=Array.isArray(json?.articles)?json.articles:[];
  const items=rows.flatMap(article=>{
    if(!article?.url||!article?.title||!isAllowedReportingDomain(article.url))return [];
    const policy=sourcePolicyForUrl(article.url);
    const publishedAt=parseGdeltDate(article.seendate); if(!publishedAt)return [];
    return [{
      id:stableId('gdelt',article.url,article.title),kind:'article',title:String(article.title).trim(),
      summary:'',url:article.url,publishedAt,sourceId:`gdelt:${policy.domain}`,sourceName:policy.name,
      sourceDomain:policy.domain,sourceType:policy.class,sourceQuality:policy.quality,sourceMode:policy.mode,
      sourceAlignment:policy.alignment,sourceNote:policy.note,regionHint:source.regionId||null,
      gdelt:{language:article.language||null,sourceCountry:article.sourcecountry||null}
    }];
  });
  return {items,markets:[],predictions:[],durationMs:Date.now()-started};
}
function parseGdeltDate(value){
  const text=String(value||''); const m=text.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})Z?$/);
  if(m)return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`).toISOString();
  const t=Date.parse(text); return Number.isFinite(t)?new Date(t).toISOString():null;
}
