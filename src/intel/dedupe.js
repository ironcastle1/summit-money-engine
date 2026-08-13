import { jaccard, normalizeTitle, tokenSet } from './text.js';
export function dedupe(records){
  const kept=[]; const exact=new Map();
  for(const row of records){
    const key=normalizeTitle(row.title); const e=exact.get(key); if(e){merge(e,row);continue;}
    let near=null;
    for(const candidate of kept.slice(-80)){if(Math.abs(Date.parse(candidate.publishedAt)-Date.parse(row.publishedAt))>18*3600000)continue; if(jaccard(tokenSet(candidate.title),tokenSet(row.title))>=0.78){near=candidate;break;}}
    if(near)merge(near,row); else{row.evidence=[evidence(row)]; kept.push(row); exact.set(key,row);}
  }
  return kept;
}
function evidence(row){return {title:row.title,url:row.url,sourceName:row.sourceName,sourceDomain:row.sourceDomain,sourceQuality:row.sourceQuality,sourceMode:row.sourceMode,publishedAt:row.publishedAt};}
function merge(target,row){target.evidence??=[evidence(target)];target.evidence.push(evidence(row));target.regionIds=[...new Set([...target.regionIds,...row.regionIds])];target.materiality.score=Math.max(target.materiality.score,row.materiality.score);if((row.summary||'').length>(target.summary||'').length)target.summary=row.summary;}
