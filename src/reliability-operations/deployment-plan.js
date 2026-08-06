import { operationsId } from './ids.js';
import { clean } from './utilities.js';
import { iso } from './time.js';
export function deploymentPlan(input = {}) {
    if (!input.releaseId)
        throw new TypeError('Deployment releaseId is required');
    const stages = (input.stages || [{ name: 'CANARY', percentage: 5, holdMinutes: 15 }, { name: 'RAMP_25', percentage: 25, holdMinutes: 15 }, { name: 'RAMP_50', percentage: 50, holdMinutes: 20 }, { name: 'COMPLETE', percentage: 100, holdMinutes: 0 }]).map((stage, index) => Object.freeze({ index: index + 1, name: clean(stage.name, 80).toUpperCase(), percentage: Math.max(1, Math.min(100, Number(stage.percentage) || 100)), holdMinutes: Math.max(0, Number(stage.holdMinutes) || 0), state: clean(stage.state, 20).toUpperCase() || 'PENDING' }));
    return Object.freeze({ id: clean(input.id, 140) || operationsId('deployment', input.releaseId), releaseId: clean(input.releaseId, 140), environment: clean(input.environment, 40).toLowerCase() || 'production', strategy: clean(input.strategy, 40).toUpperCase() || 'CANARY', stages, currentStage: Math.max(0, Number(input.currentStage) || 0), state: clean(input.state, 30).toUpperCase() || 'PLANNED', startedAt: input.startedAt || null, completedAt: input.completedAt || null, createdAt: input.createdAt || iso() });
}
