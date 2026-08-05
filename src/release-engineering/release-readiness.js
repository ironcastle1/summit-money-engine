import { qualityGate } from './quality-gate.js';
export function releaseReadiness(input = {}) {
    const checks = [
        { name: 'Version policy', state: input.versionPolicy?.valid ? 'PASS' : 'FAIL', detail: input.versionPolicy?.reasons },
        { name: 'Dependencies', state: input.dependencies?.valid ? 'PASS' : 'FAIL', detail: input.dependencies?.issues },
        { name: 'Environment', state: input.environment?.ready ? 'PASS' : 'FAIL', detail: input.environment?.missing },
        { name: 'Migrations', state: input.migrations?.valid ? 'PASS' : 'FAIL', detail: input.migrations?.unresolved },
        { name: 'Contracts', state: input.contracts?.breaking ? 'FAIL' : input.contracts?.state || 'NOT_RUN' },
        { name: 'Performance budgets', state: input.performance?.pass ? 'PASS' : 'FAIL', detail: input.performance?.failures },
        { name: 'Tests', state: input.tests?.every?.(item => item.state === 'PASS') ? 'PASS' : 'FAIL' },
        { name: 'Security', state: input.security?.pass === false ? 'FAIL' : input.security ? 'PASS' : 'NOT_RUN' },
        { name: 'Operations', state: input.operations?.pass === false ? 'FAIL' : input.operations ? 'PASS' : 'NOT_RUN' },
        { name: 'Artifacts', state: input.artifacts?.count > 0 ? 'PASS' : 'FAIL' }
    ];
    return qualityGate({ name: 'Release readiness', checks });
}
