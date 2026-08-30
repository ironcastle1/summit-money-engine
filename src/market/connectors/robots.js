import { respectfulFetch } from './http.js';
const cache = new Map();
function parseRules(text) {
  const groups=[]; let current=null;
  for (const raw of String(text||'').split(/\r?\n/)) {
    const line=raw.replace(/#.*$/,'').trim(); if(!line)continue;
    const m=line.match(/^([^:]+):\s*(.*)$/); if(!m)continue;
    const key=m[1].trim().toLowerCase(), value=m[2].trim();
    if(key==='user-agent'){current={agent:value.toLowerCase(),disallow:[],allow:[]};groups.push(current);}
    else if(current&&key==='disallow')current.disallow.push(value);
    else if(current&&key==='allow')current.allow.push(value);
  }
  return groups;
}
function pathMatches(rule,path){if(!rule)return false;const escaped=rule.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\$$/,'$');try{return new RegExp(`^${escaped}`).test(path);}catch{return path.startsWith(rule);}}
export async function robotsAllowed(url) {
  const u=new URL(url); const origin=u.origin;
  let groups=cache.get(origin);
  if(groups===undefined){
    try{const r=await respectfulFetch(`${origin}/robots.txt`,{minHostGapMs:900,timeoutMs:8000});groups=parseRules(r.text);}catch{groups=[];}
    cache.set(origin,groups);
  }
  const relevant=groups.filter(g=>g.agent==='*'||g.agent.includes('merlin'));
  if(!relevant.length)return true;
  const path=`${u.pathname}${u.search}`;
  let bestAllow=-1,bestDisallow=-1;
  for(const g of relevant){for(const a of g.allow)if(pathMatches(a,path))bestAllow=Math.max(bestAllow,a.length);for(const d of g.disallow)if(pathMatches(d,path))bestDisallow=Math.max(bestDisallow,d.length);}
  if(bestAllow>=bestDisallow)return true;
  return bestDisallow<0;
}
