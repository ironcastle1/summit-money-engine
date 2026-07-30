import { stableId } from '../../core/ids.js';
import { clamp, round } from '../../core/numbers.js';
import { toIso, toTimestamp } from '../../core/time.js';
import { validCoordinate } from '../geo/distance.js';
import { normalizeCategory } from './categories.js';

function cleanText(value, fallback, maxLength) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return (text || fallback).slice(0, maxLength);
}

function cleanUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeSeverity(value, fallback = 1) {
  const number = Number(value);
  return round(clamp(Number.isFinite(number) ? number : fallback, 0, 5), 2);
}

export function createEvent(input) {
  const lat = Number(input.lat ?? input.latitude);
  const lon = Number(input.lon ?? input.longitude);
  const timestamp = toTimestamp(input.time ?? input.startedAt ?? input.updatedAt);
  if (!validCoordinate(lat, lon) || timestamp === null) return null;
  const source = cleanText(input.source, 'Unknown', 80);
  const sourceId = cleanText(input.sourceId ?? input.externalId ?? input.id, '', 160);
  const title = cleanText(input.title, 'Untitled event', 240);
  const category = normalizeCategory(input.category);
  const id = sourceId
    ? stableId(source.toLowerCase().replace(/[^a-z0-9]+/g, '-'), sourceId)
    : stableId('event', source, title, round(lat, 3), round(lon, 3), Math.floor(timestamp / 3_600_000));

  return Object.freeze({
    id,
    sourceId: sourceId || null,
    source,
    title,
    category,
    lat: round(lat, 6),
    lon: round(lon, 6),
    time: toIso(timestamp),
    updatedAt: toIso(input.updatedAt ?? timestamp),
    severity: normalizeSeverity(input.severity),
    magnitude: Number.isFinite(Number(input.magnitude)) ? round(Number(input.magnitude), 2) : null,
    alertLevel: cleanText(input.alertLevel, '', 40) || null,
    country: cleanText(input.country, '', 100) || null,
    region: cleanText(input.region, '', 120) || null,
    url: cleanUrl(input.url),
    geometryType: cleanText(input.geometryType, 'Point', 24),
    attributes: input.attributes && typeof input.attributes === 'object' ? Object.freeze({ ...input.attributes }) : Object.freeze({})
  });
}
