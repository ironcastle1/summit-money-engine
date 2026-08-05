export function deploymentChecklist(input = {}) {
    const items = [
        ['CHANGE_APPROVED', 'Release approved', Boolean(input.approved)], ['BACKUP_VERIFIED', 'Verified backup available', Boolean(input.backupVerified)], ['MIGRATIONS_READY', 'Migration plan validated', Boolean(input.migrationsReady)], ['ROLLBACK_READY', 'Rollback procedure tested', Boolean(input.rollbackReady)], ['OBSERVABILITY_READY', 'Dashboards and alerts ready', Boolean(input.observabilityReady)], ['SUPPORT_BRIEFED', 'Support handover complete', Boolean(input.supportBriefed)], ['STATUS_PREPARED', 'Status communication prepared', Boolean(input.statusPrepared)], ['OWNER_PRESENT', 'Release owner assigned', Boolean(input.owner)]
    ].map(([id, title, complete]) => ({ id, title, complete, required: true }));
    return Object.freeze({ items, complete: items.every(item => item.complete), remaining: items.filter(item => !item.complete).map(item => item.id) });
}
