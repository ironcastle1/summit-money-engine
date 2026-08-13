import { CLAIM_RISK_RULES } from '../catalog/claim-risk-rules.js';
import { cleanText } from './text.js';

export function assessClaimRisk(input){
  const text=cleanText(Array.isArray(input)?input.map(x=>`${x.title||''} ${x.summary||''}`).join(' '):`${input?.title||''} ${input?.summary||''}`).toLowerCase();
  const matches=[];
  for(const rule of CLAIM_RISK_RULES){const hits=rule.terms.filter(t=>text.includes(t.toLowerCase()));if(hits.length)matches.push({...rule,hits});}
  const positive=matches.filter(x=>x.risk>0).reduce((s,x)=>s+x.risk,0);
  const mitigating=Math.abs(matches.filter(x=>x.risk<0).reduce((s,x)=>s+x.risk,0));
  const score=Math.max(0,Math.min(100,positive-mitigating));
  return {score,requiresCorroboration:matches.some(x=>x.requiresCorroboration&&x.risk>0),matches:matches.sort((a,b)=>Math.abs(b.risk)-Math.abs(a.risk)).slice(0,8)};
}
