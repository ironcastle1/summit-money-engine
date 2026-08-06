import {
  ageHours
}
from './time.js';
export function sourceStatus(source= {
}, now=Date.now()) {
  const generatedAt=source.generatedAt||source.updatedAt||source.time;
  const age=ageHours(generatedAt, now);
  const state=source.error?'ERROR':age<=1?'CURRENT':age<=6?'AGING':age<=24?'STALE':'OUTDATED';
  return Object.freeze( {
    id:String(source.id||source.source||'unknown'), name:String(source.name||source.source||'Unknown source'), state, ageHours:Number.isFinite(age)?Math.round(age*10)/10:null, error:source.error?String(source.error):null, generatedAt:generatedAt||null
  });
}
export function summariseSources(sources=[]) {
  const records=sources.map(source=>sourceStatus(source));
  return Object.freeze( {
    total:records.length, current:records.filter(x=>x.state==='CURRENT').length, stale:records.filter(x=>['STALE', 'OUTDATED'].includes(x.state)).length, errors:records.filter(x=>x.state==='ERROR').length, sources:Object.freeze(records)
  });
}
