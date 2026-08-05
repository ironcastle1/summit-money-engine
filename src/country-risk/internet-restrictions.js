import {
  factor,
  confidenceFromEvidence
}
from './factor.js';
import {
  clamp,
  mean
}
from './numbers.js';
export function assessInternetRestrictions(input = {
}) {
  const events = input.events || [];
  const disruptions = (input.internetEvents || events).filter(item => /internet|network|blackout|shutdown|platform ban/i.test(`${item.title||''} ${item.summary||''} ${item.category||''}`));
  const score = clamp(disruptions.reduce((sum,item)=>sum + Number(item.severity || 18),0));
  const evidence = input.evidence || [];
  return factor('internet', clamp(score), {
    confidence: input.confidence ?? confidenceFromEvidence(evidence), state: evidence.length || events.length || Object.keys(input).length > 1 ? (input.state || 'MEASURED') : 'UNAVAILABLE', direction: input.direction || 'STABLE', explanation: 'Internet shutdown and platform restriction risk', evidence
  });
}
