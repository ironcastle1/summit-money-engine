import { clamp, round } from '../../core/numbers.js';
import { EVENT_MARKET_LINKS } from './constants.js';
import { evidenceScore } from './evidence-grade.js';
import { normalizeOpportunity } from './opportunity-schema.js';

function eventSourceCount(event) {
  if (Array.isArray(event?.sources)) return event.sources.length;
  return event?.source ? 1 : 0;
}

function eventAgeMinutes(event, now = Date.now()) {
  const timestamp = Date.parse(event?.occurredAt || event?.time || event?.updatedAt || event?.createdAt || '');
  return Number.isFinite(timestamp) ? Math.max(0, (now - timestamp) / 60_000) : null;
}

function categoryAssets(category) {
  return EVENT_MARKET_LINKS[category] || EVENT_MARKET_LINKS.other;
}

export function fromEvent(event, context = {}) {
  if (!event) return null;
  const rawSeverity = Number.isFinite(event.severity) ? event.severity : Number.isFinite(event.severityScore) ? event.severityScore : null;
  const severity = Number.isFinite(rawSeverity) ? (rawSeverity <= 5 ? rawSeverity * 20 : rawSeverity) : null;
  const distanceKm = Number.isFinite(event.distanceKm) ? event.distanceKm : null;
  const proximity = Number.isFinite(distanceKm) ? clamp(100 * Math.exp(-distanceKm / Math.max(100, context.radiusKm || 250)), 0, 100) : 45;
  const sourceCount = eventSourceCount(event);
  const evidence = evidenceScore({
    sourceCount,
    sampleSize: event.clusterSize || 1,
    sampleTarget: 8,
    ageMinutes: eventAgeMinutes(event),
    maximumUsefulMinutes: 4320,
    coverage: sourceCount > 1 ? 0.85 : 0.55,
    intervalWidth: sourceCount > 1 ? 0.22 : 0.4
  });
  const score = clamp(0.45 * (severity || 35) + 0.25 * proximity + 0.2 * (evidence.score || 0) + 0.1 * clamp((event.clusterSize || 1) * 12, 0, 100), 0, 100);
  const category = String(event.category || 'other').toLowerCase();
  const linkedAssets = categoryAssets(category);
  return normalizeOpportunity({
    kind: 'EVENT',
    id: `event-${event.id}`,
    title: event.title || `${category.toUpperCase()} EVENT`,
    subtitle: event.locationName || event.country || event.source || '',
    direction: 'WATCH',
    score: round(score, 1),
    confidence: evidence.score,
    risk: severity,
    severity,
    evidenceGrade: evidence.grade,
    evidenceScore: evidence.score,
    sampleSize: event.clusterSize || 1,
    sourceCount,
    horizon: eventAgeMinutes(event) <= 360 ? '24H' : '3D',
    eventId: event.id,
    category,
    latitude: event.latitude ?? event.lat,
    longitude: event.longitude ?? event.lon,
    distanceKm,
    observedAt: event.occurredAt || event.time || event.updatedAt,
    generatedAt: context.generatedAt || new Date().toISOString(),
    sources: Array.isArray(event.sources) ? event.sources : [event.source].filter(Boolean),
    tags: [category, ...(event.tags || []), ...linkedAssets],
    metadata: {
      linkedAssets,
      clusterSize: event.clusterSize || 1,
      proximityScore: round(proximity, 1),
      url: event.url || null
    }
  });
}
