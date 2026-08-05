import { TRIGGER_TYPES, DEFAULT_LIMITS } from './constants.js';
import { conditionRecord } from './condition-schema.js';
import { clean, frozen } from './utilities.js';
export function triggerRecord(input = {}) {
    const type = String(input.type || 'MANUAL').toUpperCase();
    if (!TRIGGER_TYPES.includes(type))
        throw new TypeError(`Unsupported trigger type: ${type}`);
    const conditions = (input.conditions || []).slice(0, DEFAULT_LIMITS.conditionsPerTrigger).map(conditionRecord);
    return frozen({
        id: clean(input.id, 120) || `trigger-${type.toLowerCase()}`,
        type,
        enabled: input.enabled !== false,
        conditions,
        match: String(input.match || 'ALL').toUpperCase() === 'ANY' ? 'ANY' : 'ALL',
        configuration: frozen({ ...(input.configuration || {}) })
    });
}
