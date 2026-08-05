export function reliabilityDiagnostics(snapshot = {}) {
    const issues = [];
    for (const budget of snapshot.errorBudgets || [])
        if (budget.state === 'EXHAUSTED')
            issues.push({ code: 'ERROR_BUDGET_EXHAUSTED', severity: 'CRITICAL', resourceId: budget.sloId });
    for (const check of snapshot.syntheticChecks || [])
        if (!check.passed)
            issues.push({ code: 'SYNTHETIC_FAILED', severity: 'HIGH', resourceId: check.id });
    for (const queue of snapshot.queueHealth || [])
        if (queue.state === 'CRITICAL')
            issues.push({ code: 'QUEUE_CRITICAL', severity: 'HIGH', resourceId: queue.queueId });
    for (const restore of snapshot.restoreTests || [])
        if (!restore.passed)
            issues.push({ code: 'RESTORE_TEST_FAILED', severity: 'CRITICAL', resourceId: restore.id });
    return Object.freeze({ status: issues.some(item => item.severity === 'CRITICAL') ? 'UNHEALTHY' : issues.length ? 'DEGRADED' : 'READY', issues, counts: Object.freeze({ services: (snapshot.services || []).length, slos: (snapshot.slos || []).length, incidents: (snapshot.incidents || []).length, releases: (snapshot.releases || []).length, queues: (snapshot.queues || []).length }), generatedAt: new Date().toISOString() });
}
