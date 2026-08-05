import { releaseId } from './ids.js';
import { clean } from './utilities.js';
import { iso } from './time.js';
export function testEvidence(input = {}) { const total = Number(input.total) || 0, passed = Number(input.passed) || 0, failed = Number(input.failed) || 0, skipped = Number(input.skipped) || 0; return Object.freeze({ id: input.id || releaseId('evidence', input.suite || 'tests'), suite: clean(input.suite || 'unnamed', 160), command: clean(input.command, 500), total, passed, failed, skipped, durationMs: Number(input.durationMs) || 0, state: failed > 0 ? 'FAIL' : total > 0 && passed + skipped === total ? 'PASS' : 'NOT_RUN', artifact: clean(input.artifact, 500) || null, recordedAt: input.recordedAt || iso() }); }
