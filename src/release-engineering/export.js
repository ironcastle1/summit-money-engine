function escapeCsv(value) {
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
export function releaseJson(value) {
    return `${JSON.stringify(value, null, 2)}\n`;
}
export function releaseCsv(rows = []) {
    const items = Array.isArray(rows) ? rows : [];
    if (!items.length)
        return '';
    const keys = [...new Set(items.flatMap(item => Object.keys(item)))];
    return `${[keys.join(','), ...items.map(item => keys.map(key => escapeCsv(item[key])).join(','))].join('\n')}\n`;
}
export function releaseSummary(snapshot = {}) {
    const lines = [
        'MERLIN RELEASE ENGINEERING',
        '==========================',
        `Candidate: ${snapshot.candidates?.[0]?.version || 'none'}`,
        `Readiness: ${snapshot.readiness?.state || 'NOT_RUN'}`,
        `Go-live: ${snapshot.goLive?.decision || 'NOT_ASSESSED'}`,
        `Components: ${snapshot.components?.length || 0}`,
        `Contracts: ${snapshot.contracts?.length || 0}`,
        `Migrations: ${snapshot.migrations?.length || 0}`,
        `Artifacts: ${snapshot.artifacts?.length || 0}`,
        `Evidence records: ${snapshot.evidence?.length || 0}`
    ];
    if (snapshot.goLive?.blockers?.length)
        lines.push(`Blockers: ${snapshot.goLive.blockers.join(', ')}`);
    return `${lines.join('\n')}\n`;
}
