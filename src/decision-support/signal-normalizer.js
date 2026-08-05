import { stableSignalId } from './id.js';
import { clamp } from './numbers.js';
import { sourceState } from './source-state.js';
import { clean, uniqueText } from './text.js';
import { iso } from './time.js';
import { classifyTopic } from './topic-classifier.js';
export function normalizeSignal(input = {}, defaults = {}) {
  const location = input.location || input.center || {};
  const sources = uniqueText(input.sources || input.evidence?.sources || [input.source, input.sourceName]);
  const signal = {
    id: stableSignalId(input),
    externalId: clean(input.id || input.externalId, 180),
    domain: classifyTopic({ ...defaults, ...input }),
    title: clean(input.title || input.name || defaults.title || 'Untitled signal', 240),
    summary: clean(input.summary || input.description || defaults.summary, 900),
    time: iso(input.time || input.updatedAt || input.generatedAt || defaults.time || Date.now()),
    severity: clamp(input.severity?.score ?? input.severity ?? input.risk?.score ?? input.score ?? defaults.severity ?? 0),
    confidence: clamp(input.confidence?.score ?? input.confidence ?? input.evidence?.score ?? defaults.confidence ?? 50),
    sourceState: sourceState(input.sourceState || input.evidence?.state || defaults.sourceState, sources.length > 1 ? 'CORROBORATED' : sources.length ? 'MEASURED' : 'UNAVAILABLE'),
    sources: Object.freeze(sources),
    location: Object.freeze({ lat: Number(location.lat ?? input.lat), lon: Number(location.lon ?? input.lon), label: clean(location.label || input.country || input.region || input.place, 160) }),
    tags: Object.freeze(uniqueText(input.tags || input.categories || [], 48)),
    action: clean(input.action || input.recommendation || defaults.action, 500),
    raw: input
  };
  return Object.freeze(signal);
}
