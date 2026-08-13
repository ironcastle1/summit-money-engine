import { stableId } from '../core/hash.js';
import { sourcePolicyForUrl } from '../catalog/source-policy.js';
import { cleanText } from './text.js';
import { locate, regionsFor } from './geography.js';
import { classify } from './classifier.js';
import { materiality, passesMateriality } from './materiality.js';
import { assessClaimRisk } from './claim-risk.js';

export function normalizeRecords(raw,{now=Date.now(),maxAgeHours=72}={}){
  const out=[];
  for(const record of raw||[]){
    if(!record?.title||!record?.url)continue; const t=Date.parse(record.publishedAt||''); if(!Number.isFinite(t)||t>now+600000||t<now-maxAgeHours*3600000)continue;
    const policy=sourcePolicyForUrl(record.url); if(policy.blocked)continue;
    const sourceQuality=Number(record.sourceQuality??policy.quality??0.45); const location=locate(record); const regionIds=regionsFor(record,location); const classification=classify(record);
    const row={
      id:record.id||stableId('record',record.url,record.title),kind:record.kind||'article',title:cleanText(record.title),summary:cleanText(record.summary).slice(0,1600),url:record.url,
      publishedAt:new Date(t).toISOString(),ageHours:Number(((now-t)/3600000).toFixed(2)),sourceId:record.sourceId||policy.domain,sourceName:record.sourceName||policy.name,
      sourceDomain:record.sourceDomain||policy.domain,sourceType:record.sourceType||policy.class,sourceQuality,sourceMode:record.sourceMode||policy.mode,sourceAlignment:record.sourceAlignment||policy.alignment,
      location,regionIds,classification,magnitude:record.magnitude||null,significance:record.significance||null
    };
    row.claimRisk=assessClaimRisk(row);
    row.materiality=materiality(row,classification,location,regionIds,now); if(passesMateriality(row))out.push(row);
  }
  return out.sort((a,b)=>b.materiality.score-a.materiality.score||Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
}
