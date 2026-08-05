import {
  clean,
  uniqueText
}
from './text.js';
import {
  sourceState
}
from './source-state.js';
import {
  evidenceGrade
}
from './evidence-grade.js';
import {
  ageHours
}
from './time.js';
export function normalizeEvidence(event,
now = Date.now()) {
  const attributes = event?.attributes || {
  },
  sources = uniqueText([event?.source,
  ...(attributes.sources || [])]),
  independentSources = Math.max(sources.length,
  Number(attributes.independentSources) || 0),
  freshness = Math.max(0,
  100 - ageHours(event?.time,
  now) * .8),
  quality = Number(attributes.sourceQuality ?? attributes.confidence ?? 65),
  agreement = Number(attributes.agreement ?? (independentSources > 1 ? 78 : 58)),
  grade = evidenceGrade({
    independentSources,
    freshness,
    quality,
    agreement
  });
  return Object.freeze({
    sources,
    source: clean(event?.source || 'Unknown',
    80),
    state: sourceState(attributes.sourceState,
    independentSources > 1 ? 'CORROBORATED' : 'MEASURED'),
    freshness: Math.round(freshness),
    agreement: Math.max(0,
    Math.min(100,
    agreement)),
    ...grade
  });
}
