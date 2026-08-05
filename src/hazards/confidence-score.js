import {
  clamp, round
}
from './numbers.js';
export function hazardConfidence(event= {
}, sources=[]) {
  let score=45;
  const a=event.attributes|| {
  };
  if(event.source)score+=8;
  if(event.sourceId)score+=5;
  if(event.updatedAt)score+=5;
  if(event.url)score+=4;
  if(String(a.status||'').toLowerCase()==='reviewed')score+=12;
  if(Number.isFinite(Number(a.significance)))score+=5;
  if(a.geometryVerified===true)score+=8;
  const independent=new Set(sources.map(s=>String(s.id||s.source||s).toLowerCase())).size;
  score+=Math.min(15, Math.max(0, independent-1)*5);
  if(a.estimated===true)score-=8;
  if(a.unverified===true)score-=20;
  return round(clamp(score), 1);
}
