import { operationsId } from './ids.js';
import { clean, finite } from './utilities.js';
import { iso } from './time.js';
export function restoreTest(input = {}) {
    if (!input.backupId)
        throw new TypeError('Restore test backupId is required');
    const checks = (input.checks || []).map(item => Object.freeze({ name: clean(item.name, 160), passed: item.passed === true, detail: clean(item.detail, 500) }));
    const passed = checks.length > 0 && checks.every(item => item.passed) && input.applicationStarted !== false;
    return Object.freeze({ id: clean(input.id, 140) || operationsId('restore-test', input.backupId), backupId: clean(input.backupId, 140), environment: clean(input.environment, 80) || 'isolated-restore', durationMinutes: Math.max(0, finite(input.durationMinutes)), checks, applicationStarted: input.applicationStarted !== false, passed, state: passed ? 'PASS' : 'FAIL', testedAt: input.testedAt || iso(), testedBy: clean(input.testedBy, 160) || 'system' });
}
