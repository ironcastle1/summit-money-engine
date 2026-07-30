import { haversineKm } from '../geo/distance.js';
import { toTimestamp } from '../../core/time.js';

function normalizedTitle(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(magnitude|earthquake|event|incident|reported|update)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value) {
  return new Set(normalizedTitle(value).split(' ').filter(token => token.length > 2));
}

function jaccard(left, right) {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

function duplicateScore(left, right, options) {
  if (left.category !== right.category) return 0;
  const distance = haversineKm(left.lat, left.lon, right.lat, right.lon);
  if (!Number.isFinite(distance) || distance > options.distanceKm) return 0;
  const timeDeltaHours = Math.abs(toTimestamp(left.time) - toTimestamp(right.time)) / 3_600_000;
  if (timeDeltaHours > options.timeHours) return 0;
  const titleScore = jaccard(tokenSet(left.title), tokenSet(right.title));
  const distanceScore = 1 - distance / options.distanceKm;
  const timeScore = 1 - timeDeltaHours / options.timeHours;
  return titleScore * 0.5 + distanceScore * 0.3 + timeScore * 0.2;
}

function choosePrimary(left, right) {
  const leftScore = (left.url ? 1 : 0) + Object.keys(left.attributes || {}).length * 0.05 + left.severity * 0.02;
  const rightScore = (right.url ? 1 : 0) + Object.keys(right.attributes || {}).length * 0.05 + right.severity * 0.02;
  return leftScore >= rightScore ? [left, right] : [right, left];
}

function mergeEvents(primary, secondary) {
  const sources = new Set([primary.source, secondary.source, ...(primary.attributes?.sources || []), ...(secondary.attributes?.sources || [])]);
  return Object.freeze({
    ...primary,
    severity: Math.max(primary.severity, secondary.severity),
    alertLevel: primary.alertLevel || secondary.alertLevel,
    country: primary.country || secondary.country,
    region: primary.region || secondary.region,
    url: primary.url || secondary.url,
    attributes: Object.freeze({
      ...secondary.attributes,
      ...primary.attributes,
      sources: [...sources],
      duplicateCount: Number(primary.attributes?.duplicateCount || 0) + Number(secondary.attributes?.duplicateCount || 0) + 1
    })
  });
}

export function deduplicateEvents(events, options = {}) {
  const settings = {
    distanceKm: options.distanceKm || 35,
    timeHours: options.timeHours || 12,
    threshold: options.threshold || 0.58
  };
  const output = [];
  for (const event of [...events].sort((a, b) => toTimestamp(b.time) - toTimestamp(a.time))) {
    const duplicateIndex = output.findIndex(existing => duplicateScore(existing, event, settings) >= settings.threshold);
    if (duplicateIndex === -1) {
      output.push(event);
      continue;
    }
    const [primary, secondary] = choosePrimary(output[duplicateIndex], event);
    output[duplicateIndex] = mergeEvents(primary, secondary);
  }
  return output;
}
