import { clamp, round } from '../../core/numbers.js';
import { stableId } from '../../core/ids.js';
import { isOpportunityKind, normalizeDirection } from './constants.js';
import { expiryForOpportunity } from './decay.js';

function finiteOrNull(value) { return Number.isFinite(value) ? value : null; }
function text(value, fallback = '') { return String(value ?? fallback).trim(); }

export function normalizeOpportunity(input, now = Date.now()) {
  const kind = String(input?.kind || '').toUpperCase();
  if (!isOpportunityKind(kind)) throw new TypeError(`Unsupported opportunity kind: ${kind}`);
  const title = text(input.title, 'UNTITLED');
  const generatedAt = input.generatedAt || new Date(now).toISOString();
  const raw = {
    id: text(input.id) || stableId('opportunity', kind, input.assetId, input.eventId, input.marketId, title, generatedAt),
    kind,
    title,
    subtitle: text(input.subtitle),
    direction: normalizeDirection(input.direction),
    score: finiteOrNull(input.score),
    confidence: finiteOrNull(input.confidence),
    risk: finiteOrNull(input.risk),
    probability: finiteOrNull(input.probability),
    expectedMove: finiteOrNull(input.expectedMove),
    liquidity: finiteOrNull(input.liquidity),
    severity: finiteOrNull(input.severity),
    evidenceGrade: text(input.evidenceGrade, 'N/A'),
    evidenceScore: finiteOrNull(input.evidenceScore),
    sampleSize: finiteOrNull(input.sampleSize),
    sourceCount: finiteOrNull(input.sourceCount),
    horizon: text(input.horizon, 'N/A'),
    assetId: text(input.assetId),
    symbol: text(input.symbol),
    eventId: text(input.eventId),
    marketId: text(input.marketId),
    category: text(input.category),
    latitude: finiteOrNull(input.latitude),
    longitude: finiteOrNull(input.longitude),
    distanceKm: finiteOrNull(input.distanceKm),
    observedAt: input.observedAt || generatedAt,
    generatedAt,
    sources: Array.isArray(input.sources) ? [...new Set(input.sources.map(text).filter(Boolean))] : [],
    tags: Array.isArray(input.tags) ? [...new Set(input.tags.map(value => text(value).toUpperCase()).filter(Boolean))] : [],
    components: Array.isArray(input.components) ? input.components : [],
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {}
  };
  const expiry = expiryForOpportunity(raw, now);
  return Object.freeze({
    ...raw,
    score: finiteOrNull(raw.score) === null ? null : round(clamp(raw.score, 0, 100), 1),
    confidence: finiteOrNull(raw.confidence) === null ? null : round(clamp(raw.confidence, 0, 100), 1),
    risk: finiteOrNull(raw.risk) === null ? null : round(clamp(raw.risk, 0, 100), 1),
    probability: finiteOrNull(raw.probability) === null ? null : round(clamp(raw.probability, 0, 1), 4),
    expiry
  });
}

export function publicOpportunity(opportunity) {
  const output = { ...opportunity };
  if (!output.metadata || Object.keys(output.metadata).length === 0) delete output.metadata;
  if (!output.components?.length) delete output.components;
  return output;
}
