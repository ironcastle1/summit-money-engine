import { operationsId } from './ids.js';
import { clean } from './utilities.js';
export function escalationPolicy(input = {}) {
    const steps = (input.steps || []).map((step, index) => Object.freeze({ level: index + 1, delayMinutes: Math.max(0, Number(step.delayMinutes) || 0), target: clean(step.target, 160), channel: clean(step.channel, 40).toUpperCase() || 'IN_APP' }));
    if (!steps.length)
        throw new TypeError('Escalation policy requires steps');
    return Object.freeze({ id: clean(input.id, 140) || operationsId('escalation', input.name), name: clean(input.name, 180) || 'Incident escalation', minimumSeverity: clean(input.minimumSeverity, 20).toUpperCase() || 'SEV3', serviceIds: (input.serviceIds || []).map(String), enabled: input.enabled !== false, steps });
}
