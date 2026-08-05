function csvCell(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
}
export function operationsJson(value) {
    return `${JSON.stringify(value, null, 2)}\n`;
}
export function operationsCsv(rows = []) {
    const keys = [...new Set(rows.flatMap(row => Object.keys(row)))];
    const header = keys.map(csvCell).join(',');
    const body = rows.map(row => keys.map(key => csvCell(typeof row[key] === 'object' ? JSON.stringify(row[key]) : row[key])).join(',')).join('\n');
    return `${header}\n${body}\n`;
}
export function operationsSummary(snapshot = {}) {
    const report = snapshot.report || {};
    return [
        'MERLIN RELIABILITY OPERATIONS',
        '',
        `Score: ${report.score?.score ?? '--'} (${report.score?.band ?? 'UNKNOWN'})`,
        `Services: ${report.serviceCount ?? 0}`,
        `Open incidents: ${report.openIncidents ?? 0}`,
        `Exhausted error budgets: ${report.exhaustedBudgets ?? 0}`,
        `Failed restore tests: ${report.failedRestores ?? 0}`,
        `Critical queues: ${report.criticalQueues ?? 0}`,
        `Generated: ${snapshot.generatedAt || new Date().toISOString()}`,
        ''
    ].join('\n');
}
