import { releaseId, digest } from './ids.js';
import { clean } from './utilities.js';
import { iso } from './time.js';
export function artifactRecord(input = {}) { const name = clean(input.name || input.path, 300); if (!name)
    throw new TypeError('Artifact name required'); return Object.freeze({ id: clean(input.id, 180) || releaseId('artifact', name), name, path: clean(input.path || name, 600), type: clean(input.type || 'SOURCE', 40).toUpperCase(), bytes: Number(input.bytes) || 0, sha256: clean(input.sha256, 128) || digest(`${name}:${input.bytes || 0}`), contentType: clean(input.contentType || 'application/octet-stream', 120), required: input.required !== false, createdAt: input.createdAt || iso() }); }
