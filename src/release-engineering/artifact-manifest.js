import { artifactRecord } from './artifact-record.js';
import { digest } from './ids.js';
export function artifactManifest(items = [], metadata = {}) { const artifacts = items.map(artifactRecord).sort((a, b) => a.path.localeCompare(b.path)); const totalBytes = artifacts.reduce((sum, item) => sum + item.bytes, 0); const manifest = { version: metadata.version || 'unknown', candidateId: metadata.candidateId || null, artifacts, totalBytes, count: artifacts.length, generatedAt: new Date().toISOString() }; return Object.freeze({ ...manifest, manifestSha256: digest(manifest) }); }
