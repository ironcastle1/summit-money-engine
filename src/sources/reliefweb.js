import { fetchJson } from '../core/http.js';
import { config } from '../config.js';
import { stableId } from '../core/hash.js';
export async function runReliefWeb(source){
  const started=Date.now();
  const p=new URLSearchParams({appname:config.reliefWebAppName,limit:'100'}); p.append('sort[]','date:desc');
  const {json}=await fetchJson(`${source.url}?${p}`);
  const items=(Array.isArray(json?.data)?json.data:[]).flatMap(row=>{
    const f=row.fields||{}; const title=f.title||''; const date=f.date?.created||f.date?.original||f.date||null; if(!title||!date)return [];
    const url=f.url_alias||f.url||`https://reliefweb.int/node/${row.id}`;
    const countries=(f.country||[]).map(c=>c.name).filter(Boolean);
    return [{id:stableId('relief',row.id||url),kind:'article',title,summary:String(f.body||f.headline||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,1200),url,publishedAt:new Date(date).toISOString(),sourceId:source.id,sourceName:source.name,sourceType:'official',sourceQuality:0.96,countryHints:countries,categoryHint:'humanitarian'}];
  });
  return {items,markets:[],predictions:[],durationMs:Date.now()-started};
}
