export function rollbackDecision(input = {}) {
    const reasons = [];
    if (input.canary?.proceed === false)
        reasons.push(...(input.canary.blockers || ['CANARY_FAILED']));
    if (Number(input.errorBudgetConsumedPercent) >= 100)
        reasons.push('ERROR_BUDGET_EXHAUSTED');
    if (Number(input.sev1Incidents) > 0)
        reasons.push('SEV1_INCIDENT');
    if (input.healthState === 'UNHEALTHY')
        reasons.push('HEALTH_UNHEALTHY');
    if (input.manualStop)
        reasons.push('MANUAL_STOP');
    return Object.freeze({ rollback: reasons.length > 0, reasons: [...new Set(reasons)], urgency: reasons.includes('SEV1_INCIDENT') ? 'IMMEDIATE' : reasons.length ? 'CONTROLLED' : 'NONE' });
}
