import { DATA_DOMAINS } from './constants.js';
export function coverageScore(statuses=[]){
  const byDomain=Object.fromEntries(DATA_DOMAINS.map(domain=>[domain,{domain,total:0,online:0,cached:0,required:0,requiredOnline:0}]));
  for(const item of statuses){const row=byDomain[item.domain];if(!row)continue;row.total+=1;if(item.required)row.required+=1;if(['ONLINE','DEGRADED'].includes(item.state))row.online+=1;if(item.state==='CACHED')row.cached+=1;if(item.required&&['ONLINE','DEGRADED','CACHED'].includes(item.state))row.requiredOnline+=1;}
  const domains=Object.values(byDomain).filter(row=>row.total>0).map(row=>({...row,score:Math.round(((row.online+row.cached*.65)/Math.max(1,row.total))*100),requiredScore:Math.round((row.requiredOnline/Math.max(1,row.required))*100)}));
  const required=statuses.filter(item=>item.required);const available=required.filter(item=>['ONLINE','DEGRADED','CACHED'].includes(item.state));
  return Object.freeze({score:Math.round((available.length/Math.max(1,required.length))*100),requiredSources:required.length,availableRequiredSources:available.length,domains});
}
