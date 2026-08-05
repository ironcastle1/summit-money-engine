export function supportSeverity(input = {}) { if (input.outage || input.securityIncident || Number(input.affectedUsers || 0) >= 1000)
    return 'SEV1'; if (input.criticalWorkflowBlocked || Number(input.affectedUsers || 0) >= 100)
    return 'SEV2'; if (input.degraded || Number(input.affectedUsers || 0) >= 10)
    return 'SEV3'; return 'SEV4'; }
