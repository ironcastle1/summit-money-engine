export function buildBriefing(signals,markets,sourceStatuses){
  const priority=signals.filter(s=>s.signalScore>=60).slice(0,12); const critical=priority.filter(s=>s.urgency==='CRITICAL'||s.urgency==='HIGH');
  const byRegion={}; for(const s of signals){for(const r of s.regionIds.filter(x=>x!=='world'))(byRegion[r]??=[]).push(s);}
  return {
    generatedAt:new Date().toISOString(),headline:critical[0]?.title||priority[0]?.title||'No high-priority development currently passes the filter.',
    critical:critical.slice(0,6),priority:priority.slice(0,12),regions:Object.fromEntries(Object.entries(byRegion).map(([k,v])=>[k,v.slice(0,6)])),
    markets:(markets||[]).slice(0,16),sourceHealth:{online:sourceStatuses.filter(s=>s.status==='ok').length,total:sourceStatuses.length,errors:sourceStatuses.filter(s=>s.status==='error').length}
  };
}
