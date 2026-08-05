import {
  clamp,
  round
}
from './numbers.js';
export function sourceConfidence(evidence = [], options = {
}) {
  const sources = new Set(evidence.map(item => item.sourceId || item.source).filter(Boolean)).size;
  const fresh = evidence.filter(item => ['FRESH','CURRENT'].includes(item.freshness)).length;
  const measured = evidence.filter(item => (item.state || 'MEASURED') === 'MEASURED').length;
  const contradictionPenalty = Math.min(35, Number(options.contradictions || 0) * 8);
  return round(clamp(10 + sources * 14 + fresh * 4 + measured * 2 - contradictionPenalty), 1);
}
