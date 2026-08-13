import { fetchText } from '../core/http.js';
import { extractLinks } from '../core/html.js';
import { stableId } from '../core/hash.js';

const DATE_PATTERNS=[
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\b/i,
  /\b\d{1,2}\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.]?\s+20\d{2}\b/i,
  /\b20\d{2}-\d{2}-\d{2}\b/,
  /\b\d{1,2}\/\d{1,2}\/20\d{2}\b/
];

export async function runOfficialPage(source){
  const started=Date.now();
  const {text}=await fetchText(source.url,{headers:{accept:'text/html,application/xhtml+xml'}});
  const links=extractLinks(text,source.url);
  const include=source.includePath?new RegExp(source.includePath,'i'):null;
  const titleInclude=source.includeTitle?new RegExp(source.includeTitle,'i'):null;
  const cutoff=Date.now()-96*3600000;
  const items=[];
  for(const link of links){
    if(include&&!include.test(new URL(link.url).pathname))continue;
    if(titleInclude&&!titleInclude.test(link.title))continue;
    const idx=text.indexOf(link.url.replace(source.url,''));
    const context=idx>=0?text.slice(Math.max(0,idx-450),Math.min(text.length,idx+650)):'';
    const date=findDate(context); if(!date||Date.parse(date)<cutoff)continue;
    items.push({id:stableId('official',source.id,link.url),kind:'article',title:link.title,summary:'',url:link.url,publishedAt:date,sourceId:source.id,sourceName:source.name,sourceType:'official',sourceQuality:source.quality??1,sourceMode:'primary-claim',sourceAlignment:'primary-source',regionHint:source.regionId||null});
  }
  const seen=new Set();
  return {items:items.filter(x=>!seen.has(x.url)&&(seen.add(x.url),true)).slice(0,80),markets:[],predictions:[],durationMs:Date.now()-started};
}
function findDate(text){
  const clean=String(text||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  for(const re of DATE_PATTERNS){const m=clean.match(re);if(!m)continue;const t=Date.parse(m[0].replace(/(\d{1,2})\/(\d{1,2})\/(20\d{2})/,'$3-$1-$2'));if(Number.isFinite(t))return new Date(t).toISOString();}
  return null;
}
