import { normalizeScreenRequest } from './validation.js';
export function normalizeScreenDefinition(input = {}) {
  const name = String(input.name || 'Untitled screen').trim().slice(0, 80);
  return Object.freeze({
    id: String(input.id || `screen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    name,
    description: String(input.description || '').trim().slice(0, 300),
    filters: normalizeScreenRequest(input.filters || input),
    columns: Object.freeze((input.columns || ['symbol', 'price', 'changePercent', 'opportunityScore', 'riskScore', 'evidenceGrade']).map(String).slice(0, 30)),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}
