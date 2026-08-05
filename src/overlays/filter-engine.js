import { retainMaterialEarthquake } from './material-earthquake-gate.js';
const number = value => Number.isFinite(Number(value)) ? Number(value) : null;
const timestamp = value => { const parsed = Date.parse(value); return Number.isFinite(parsed) ? parsed : null; };
const text = value => String(value || '').trim().toLowerCase();
export function overlayRecordMatches(record, filters = {}, now = Date.now()) {
  if (!record) return false;
  if (filters.materialEarthquakesOnly && !retainMaterialEarthquake(record)) return false;
  const confidence = number(record.confidence ?? record.verification ?? record.attributes?.confidence);
  if (confidence !== null && confidence < Number(filters.minimumConfidence || 0)) return false;
  const severity = number(record.severity ?? record.risk?.score ?? record.attributes?.severity);
  if (severity !== null && severity < Number(filters.minimumSeverity || 0)) return false;
  if (filters.maximumAgeHours) { const observed = timestamp(record.timestamp || record.updatedAt || record.publishedAt); if (observed !== null && now-observed > Number(filters.maximumAgeHours)*3600000) return false; }
  if (filters.categories?.length && !filters.categories.map(text).includes(text(record.category || record.kind))) return false;
  if (filters.countries?.length && !filters.countries.map(text).includes(text(record.countryCode || record.country?.iso2))) return false;
  if (filters.query) { const haystack = text(`${record.title||''} ${record.summary||''} ${record.name||''} ${record.locationName||''}`); if (!haystack.includes(text(filters.query))) return false; }
  return true;
}
export function filterOverlayRecords(records = [], filters = {}, options = {}) {
  const limit = Math.max(1, Math.min(10000, Number(options.limit || 2500)));
  const matched = [];
  for (const record of records) { if (overlayRecordMatches(record, filters, options.now || Date.now())) matched.push(record); if (matched.length >= limit) break; }
  return matched;
}
