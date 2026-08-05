import {
  ageHours,
  freshness,
  iso
}
from './time.js';
export function normalizeEvidence(input = {
}, defaults = {
}) {
  const observedAt = iso(input.observedAt || input.time || input.updatedAt || defaults.observedAt);
  return Object.freeze({
    id: String(input.id || defaults.id || `evidence-${Math.random().toString(36).slice(2)}`), sourceId: String(input.sourceId || input.source || defaults.sourceId || 'unknown'), title: String(input.title || input.name || defaults.title || 'Evidence'), url: input.url ? String(input.url) : null, observedAt, freshness: freshness(observedAt), ageHours: ageHours(observedAt), value: input.value ?? null, unit: input.unit || null, confidence: Number(input.confidence ?? defaults.confidence ?? 50), state: input.state || defaults.state || 'MEASURED'
  });
}
export function evidenceSummary(items = []) {
  const evidence = items.map(item => normalizeEvidence(item));
  const sources = new Set(evidence.map(item => item.sourceId));
  return Object.freeze({
    evidence: Object.freeze(evidence), count: evidence.length, independentSources: sources.size, freshCount: evidence.filter(item => ['FRESH','CURRENT'].includes(item.freshness)).length
  });
}
