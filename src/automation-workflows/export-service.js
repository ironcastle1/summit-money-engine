function csvCell(value) {
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
export class AutomationExportService {
    workflowsCsv(items = []) {
        const rows = [['id', 'name', 'state', 'version', 'triggerTypes', 'actionTypes', 'updatedAt']];
        for (const item of items) {
            rows.push([
                item.id,
                item.name,
                item.state,
                item.version,
                item.triggers.map(trigger => trigger.type).join('|'),
                item.actions.map(action => action.type).join('|'),
                item.updatedAt
            ]);
        }
        return rows.map(row => row.map(csvCell).join(',')).join('\n');
    }
    runsCsv(items = []) {
        const rows = [['id', 'workflowId', 'state', 'createdAt', 'completedAt', 'durationMs', 'stepCount']];
        for (const item of items) {
            rows.push([
                item.id,
                item.workflowId,
                item.state,
                item.createdAt,
                item.completedAt,
                item.durationMs,
                item.steps?.length || 0
            ]);
        }
        return rows.map(row => row.map(csvCell).join(',')).join('\n');
    }
    json(value) {
        return JSON.stringify(value, null, 2);
    }
    summary(input = {}) {
        return [
            'MERLIN AUTOMATION SUMMARY',
            `Generated: ${new Date().toISOString()}`,
            `Workflows: ${input.workflows?.total || 0}`,
            `Active: ${input.workflows?.active || 0}`,
            `Runs: ${input.runs?.total || 0}`,
            `Success rate: ${input.runs?.successRate || 0}%`,
            `Unread notifications: ${input.notifications?.unread || 0}`
        ].join('\n');
    }
}
