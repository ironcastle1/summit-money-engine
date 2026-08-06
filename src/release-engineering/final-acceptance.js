import { REQUIRED_FINAL_PARTS } from './constants.js';
export function finalAcceptance(input = {}) {
    const checks = [
        { id: 'parts', pass: Number(input.partsDelivered) === REQUIRED_FINAL_PARTS, detail: `${input.partsDelivered || 0}/${REQUIRED_FINAL_PARTS}` },
        { id: 'file_limit', pass: (input.maximumPartFiles || Infinity) < 100, detail: input.maximumPartFiles },
        { id: 'source_lines', pass: Number(input.sourceLines) >= 50000, detail: input.sourceLines },
        { id: 'tests', pass: Number(input.failedTests || 0) === 0 && Number(input.passedTests) > 0, detail: `${input.passedTests || 0} passed` },
        { id: 'syntax', pass: Number(input.syntaxFailures || 0) === 0, detail: input.syntaxChecks },
        { id: 'security_scan', pass: input.securityScanPassed === true, detail: input.securityScanPassed },
        { id: 'archive_integrity', pass: input.archiveIntegrity === true, detail: input.archiveIntegrity },
        { id: 'market_honesty', pass: input.fabricatedLiveData === false, detail: 'No fabricated live data' }
    ];
    const failures = checks.filter(item => !item.pass);
    return Object.freeze({ accepted: failures.length === 0, state: failures.length ? 'REJECTED' : 'ACCEPTED', checks, failures, acceptedAt: failures.length ? null : new Date().toISOString() });
}
