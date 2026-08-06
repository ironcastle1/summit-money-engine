import { stableReleaseId } from './ids.js';
import { clean, unique } from './utilities.js';
export function apiContract(input = {}) { const method = clean(input.method || 'GET', 10).toUpperCase(), path = clean(input.path, 300); if (!path.startsWith('/'))
    throw new TypeError('API path required'); return Object.freeze({ id: input.id || stableReleaseId('contract', method, path), method, path, auth: clean(input.auth || 'OPTIONAL', 40).toUpperCase(), requestSchema: input.requestSchema || null, responseSchemas: input.responseSchemas || {}, tags: unique(input.tags, 100), deprecated: Boolean(input.deprecated), version: clean(input.version || 'v1', 40) }); }
