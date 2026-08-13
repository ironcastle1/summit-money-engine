import { fetchText } from '../core/http.js';
import { parseFeed } from '../core/xml.js';
import { stableId } from '../core/hash.js';

export async function runRss(source){
  const started=Date.now();
  const {text}=await fetchText(source.url,{headers:{accept:'application/rss+xml,application/atom+xml,text/xml,application/xml;q=0.9,*/*;q=0.5'}});
  const items=parseFeed(text).map(row=>({
    id:stableId('rss',source.id,row.url,row.title),
    kind:'article',title:row.title,summary:row.summary,url:row.url,publishedAt:normalizeDate(row.publishedAt),
    sourceId:source.id,sourceName:source.name,sourceType:source.type||'publisher',sourceQuality:source.quality??0.8,
    regionHint:source.regionId||null
  })).filter(x=>x.publishedAt);
  return {items,markets:[],predictions:[],durationMs:Date.now()-started};
}
function normalizeDate(value){ const t=Date.parse(value||''); return Number.isFinite(t)?new Date(t).toISOString():null; }
