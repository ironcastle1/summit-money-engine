export function commercialSummary(snapshot = {}) {
    const metrics = snapshot.metrics || {};
    const lines = [
        'MERLIN CUSTOMER OPERATIONS',
        `Generated: ${snapshot.generatedAt || new Date().toISOString()}`,
        '',
        `Tenants: ${metrics.tenants || 0}`,
        `Active tenants: ${metrics.activeTenants || 0}`,
        `Seats: ${metrics.activeSeats || 0}/${metrics.seats || 0}`,
        `MRR: £${((metrics.mrrMinor || 0) / 100).toFixed(2)}`,
        `Open support cases: ${metrics.openSupportCases || 0}`,
        `SEV1 cases: ${metrics.sev1Cases || 0}`,
        `Gross logo retention: ${metrics.grossLogoRetentionPercent ?? 100}%`
    ];
    return lines.join('\n');
}
