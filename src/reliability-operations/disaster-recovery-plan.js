import { operationsId } from './ids.js';
import { clean, unique } from './utilities.js';
import { iso } from './time.js';
import { recoveryObjective } from './recovery-objective.js';
export function disasterRecoveryPlan(input = {}) {
    const name = clean(input.name, 180);
    if (!name)
        throw new TypeError('Recovery plan name is required');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('dr', name), name, serviceIds: unique(input.serviceIds, 200), primaryRegion: clean(input.primaryRegion, 80), recoveryRegion: clean(input.recoveryRegion, 80), strategy: clean(input.strategy, 40).toUpperCase() || 'PILOT_LIGHT', objective: recoveryObjective(input), dependencies: unique(input.dependencies, 200), steps: (input.steps || []).map(String), owner: clean(input.owner, 160), lastExercisedAt: input.lastExercisedAt || null, nextExerciseAt: input.nextExerciseAt || null, approvedAt: input.approvedAt || null, createdAt: input.createdAt || iso() });
}
