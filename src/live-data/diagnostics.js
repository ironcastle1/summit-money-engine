import { coverageScore } from './coverage-score.js';
export function liveDataDiagnostics(snapshot={}){
  const statuses=Object.values(snapshot.sources||{});const coverage=coverageScore(statuses);const offline=statuses.filter(item=>item.state==='OFFLINE');const cached=statuses.filter(item=>item.state==='CACHED');const optional=statuses.filter(item=>item.required===false&&['NOT_CONFIGURED','DISABLED','OFFLINE'].includes(item.state));
  return Object.freeze({state:coverage.score>=80?'READY':coverage.score>=60?'DEGRADED':'LIMITED',coverage,offline:offline.map(item=>item.id),cached:cached.map(item=>item.id),optionalUnavailable:optional.map(item=>item.id),generatedAt:new Date().toISOString()});
}
