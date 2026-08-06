import {
  alertLevel
}
from './alert-thresholds.js';
export function evaluateHazardAlerts(events=[], options= {
}) {
  const minimum=Number(options.minimumScore||45);
  return Object.freeze(events.filter(event=>(event.materiality?.score||0)>=minimum).map(event=>Object.freeze( {
    id:`hazard-alert-${event.id}`, eventId:event.id, level:alertLevel(event.materiality.score, options.thresholds), title:event.title, type:event.type, score:event.materiality.score, point:event.point, time:event.time, reasons:event.materiality.reasons
  })).sort((a, b)=>b.score-a.score));
}
