export function freshnessState(value,source,now=Date.now()){
  const timestamp=Date.parse(value||'');
  if(!Number.isFinite(timestamp)) return Object.freeze({state:'UNKNOWN',ageMs:null,stale:true});
  const ageMs=Math.max(0,now-timestamp);
  if(ageMs<=source.refreshMs*2) return Object.freeze({state:'FRESH',ageMs,stale:false});
  if(ageMs<=source.staleMs) return Object.freeze({state:'DELAYED',ageMs,stale:false});
  return Object.freeze({state:'STALE',ageMs,stale:true});
}
