import { recordId } from './id.js';
import { clean } from './text.js';
export function savedView(input = {}) {
  const now = new Date().toISOString();
  return Object.freeze({
    id: clean(input.id, 180) || recordId('view', input.name),
    name: clean(input.name || 'Saved view', 100),
    filters: Object.freeze({ domains: Object.freeze([...(input.filters?.domains || [])]), minimumPriority: Number(input.filters?.minimumPriority || 0), terms: Object.freeze([...(input.filters?.terms || [])]) }),
    map: Object.freeze({ center: Object.freeze(input.map?.center || { lat: 20, lon: 0 }), zoom: Number(input.map?.zoom || 2), layers: Object.freeze([...(input.map?.layers || [])]) }),
    createdAt: input.createdAt || now,
    updatedAt: now
  });
}
