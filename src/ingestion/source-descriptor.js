import { SOURCE_MODES } from './constants.js';
import { SourceContractError } from './errors.js';

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}$/;

function stringList(value, maximum = 32) {
  return [...new Set((Array.isArray(value) ? value : []).map(item => String(item).trim()).filter(Boolean))].slice(0, maximum);
}

function positive(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function createSourceDescriptor(input = {}) {
  const id = String(input.id || '').trim().toLowerCase();
  if (!ID_PATTERN.test(id)) throw new SourceContractError(`Invalid source id: ${id || '<empty>'}`);
  const name = String(input.name || id).trim().slice(0, 120);
  const mode = Object.values(SOURCE_MODES).includes(input.mode) ? input.mode : SOURCE_MODES.LIVE;
  const descriptor = {
    id,
    name,
    group: String(input.group || 'events').trim().toLowerCase().slice(0, 40),
    mode,
    configured: input.configured ?? mode !== SOURCE_MODES.DISABLED,
    priority: Math.max(0, Math.min(100, Number(input.priority ?? 50))),
    weight: Math.max(0.05, Math.min(10, Number(input.weight ?? 1))),
    refreshMs: positive(input.refreshMs, 60_000),
    staleMs: positive(input.staleMs, 300_000),
    timeoutMs: positive(input.timeoutMs, 12_000),
    maximumRecords: Math.floor(positive(input.maximumRecords, 20_000)),
    capabilities: stringList(input.capabilities),
    countries: stringList(input.countries, 300).map(item => item.toUpperCase()),
    categories: stringList(input.categories),
    attribution: String(input.attribution || name).trim().slice(0, 240),
    termsUrl: input.termsUrl ? String(input.termsUrl).slice(0, 500) : null,
    documentationUrl: input.documentationUrl ? String(input.documentationUrl).slice(0, 500) : null,
    license: String(input.license || 'unspecified').trim().slice(0, 120),
    metadata: Object.freeze({ ...(input.metadata || {}) })
  };
  return Object.freeze(descriptor);
}

export function assertSourceAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') throw new SourceContractError('Source adapter must be an object');
  const descriptor = createSourceDescriptor(adapter.descriptor || adapter);
  if (typeof adapter.load !== 'function' && typeof adapter.fetch !== 'function') {
    throw new SourceContractError(`Source ${descriptor.id} must implement load() or fetch()`);
  }
  return descriptor;
}
