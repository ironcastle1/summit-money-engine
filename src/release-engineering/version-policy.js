import { compareVersions, parseVersion } from './semantic-version.js';
export function versionPolicy(input = {}) { const current = parseVersion(input.current), candidate = parseVersion(input.candidate); const reasons = []; if (!current || !candidate)
    reasons.push('INVALID_SEMANTIC_VERSION');
else {
    if (compareVersions(input.candidate, input.current) <= 0)
        reasons.push('CANDIDATE_NOT_NEWER');
    if (candidate.major > current.major && !input.breakingChanges?.length)
        reasons.push('MAJOR_WITHOUT_BREAKING_CHANGE_RECORD');
    if (candidate.major === current.major && input.breakingChanges?.length && !input.compatibilityWaiver)
        reasons.push('BREAKING_CHANGE_REQUIRES_MAJOR_OR_WAIVER');
} return Object.freeze({ valid: reasons.length === 0, reasons, current, candidate }); }
