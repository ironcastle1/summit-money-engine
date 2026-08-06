export function upgradePlan(input = {}) {
    const phases = [
        { id: 'preflight', actions: ['Freeze candidate', 'Validate configuration', 'Take verified backup', 'Notify operators'] },
        { id: 'schema', actions: (input.migrations || []).map(item => `Apply ${item.id}`) },
        { id: 'application', actions: ['Deploy server', 'Deploy client assets', 'Warm caches', 'Run smoke suite'] },
        { id: 'validation', actions: ['Check SLOs', 'Check error rates', 'Check source freshness', 'Confirm critical workflows'] },
        { id: 'completion', actions: ['Close change window', 'Publish release notes', 'Begin enhanced monitoring'] }
    ];
    return Object.freeze({ fromVersion: input.fromVersion || null, toVersion: input.toVersion || null, strategy: input.strategy || 'CANARY', phases, estimatedMinutes: Math.max(15, Number(input.estimatedMinutes) || 45), requiresDowntime: Boolean(input.requiresDowntime) });
}
