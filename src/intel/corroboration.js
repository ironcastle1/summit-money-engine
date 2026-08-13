import { sourceDiversity } from './source-diversity.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function assessCorroboration(cluster){
  const diversity=sourceDiversity(cluster.records);
  const evidence=cluster.records.flatMap(r=>r.evidence||[{url:r.url,sourceName:r.sourceName,sourceDomain:r.sourceDomain,sourceQuality:r.sourceQuality,sourceMode:r.sourceMode,publishedAt:r.publishedAt,title:r.title}]);
  const domains=new Set(evidence.map(e=>e.sourceDomain).filter(Boolean)); const official=evidence.some(e=>e.sourceMode==='primary-claim'||e.sourceQuality>=0.99); const independent=[...domains].length;
  const stateOnly=evidence.length>0&&evidence.every(e=>['state-controlled','primary-source'].includes(cluster.records.find(r=>r.sourceDomain===e.sourceDomain)?.sourceAlignment));
  const meanQuality=evidence.reduce((s,e)=>s+Number(e.sourceQuality||0),0)/Math.max(1,evidence.length);
  const claimRisk=Math.max(0,...cluster.records.map(r=>r.claimRisk?.score||0)); const claimNeedsCorroboration=cluster.records.some(r=>r.claimRisk?.requiresCorroboration);
  const claimPenalty=claimNeedsCorroboration&&independent<2?Math.min(22,claimRisk*.22):Math.min(7,claimRisk*.07);
  let confidence=meanQuality*55+Math.min(22,independent*7)+(official?10:0)-(stateOnly?18:0)-claimPenalty; confidence=clamp(confidence,20,98);
  const grade=confidence>=85?'A':confidence>=72?'B':confidence>=58?'C':'D';
  return {confidence:Math.round(confidence),grade,independentSources:independent,effectiveIndependentSources:diversity.effectiveIndependentSources,diversity,officialPrimary:official,stateOnly,claimRisk,claimNeedsCorroboration,claimPenalty:Number(claimPenalty.toFixed(1)),evidence:dedupeEvidence(evidence).slice(0,10)};
}
function dedupeEvidence(rows){const seen=new Set();return rows.filter(r=>{const k=r.url||`${r.sourceDomain}|${r.title}`;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>Number(b.sourceQuality||0)-Number(a.sourceQuality||0));}
