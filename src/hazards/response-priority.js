import {
  weightedMean, round, clamp
}
from './numbers.js';
import {
  severityBand
}
from './severity-band.js';
export function responsePriority(event, exposure= {
}) {
  const score=weightedMean([ {
    value:event.materiality?.score||0, weight:0.35
  }, {
    value:exposure.populationScore||0, weight:0.2
  }, {
    value:exposure.infrastructure?.aggregateScore||0, weight:0.2
  }, {
    value:exposure.logistics?.maximumDisruptionScore||0, weight:0.15
  }, {
    value:event.confidence||50, weight:0.1
  }]);
  const final=round(clamp(score), 1);
  const actions=[];
  if(final>=75)actions.push('ACTIVATE_CRISIS_CELL', 'VERIFY_CRITICAL_INFRASTRUCTURE', 'ASSESS_ROUTE_CLOSURES');
  else if(final>=55)actions.push('ESCALATE_MONITORING', 'CHECK_LOCAL_AUTHORITIES', 'REVIEW_EXPOSED_ASSETS');
  else if(final>=35)actions.push('MONITOR', 'CONFIRM_SOURCE_STATUS');
  else actions.push('LOG_ONLY');
  return Object.freeze( {
    score:final, band:severityBand(final), actions:Object.freeze(actions)
  });
}
