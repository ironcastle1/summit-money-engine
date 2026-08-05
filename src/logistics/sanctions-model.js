import { clamp, round } from './numbers.js';
function normalize(value) { return String(value || '').trim().toUpperCase(); }
export function sanctionsImpact(input = {}) {
  const sanctionedCountries = new Set((input.sanctionedCountries || []).map(normalize));
  const sanctionedPorts = new Set((input.sanctionedPortIds || []).map(value => String(value).toLowerCase()));
  const sanctionedEntities = new Set((input.sanctionedEntities || []).map(normalize));
  const hits = [];
  for (const code of input.countryCodes || []) if (sanctionedCountries.has(normalize(code))) hits.push({ type: 'COUNTRY', value: normalize(code) });
  for (const id of input.portIds || []) if (sanctionedPorts.has(String(id).toLowerCase())) hits.push({ type: 'PORT', value: String(id).toLowerCase() });
  for (const entity of input.entities || []) if (sanctionedEntities.has(normalize(entity))) hits.push({ type: 'ENTITY', value: normalize(entity) });
  const score = clamp(hits.length * 34 + (input.secondarySanctionsRisk ? 22 : 0), 0, 100);
  return Object.freeze({ score: round(score, 1), blocked: hits.length > 0 && input.blockOnMatch !== false, hits: Object.freeze(hits), secondarySanctionsRisk: Boolean(input.secondarySanctionsRisk) });
}
