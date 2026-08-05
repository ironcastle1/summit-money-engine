import { ACTION_TYPES } from './constants.js';
import { clean, frozen, unique } from './utilities.js';
export function actionRecord(input = {}, index = 0) {
    const type = String(input.type || '').toUpperCase();
    if (!ACTION_TYPES.includes(type))
        throw new TypeError(`Unsupported action type: ${type || '(empty)'}`);
    const id = clean(input.id, 120) || `step-${index + 1}`;
    return frozen({
        id,
        type,
        name: clean(input.name || type.replaceAll('_', ' '), 120),
        dependsOn: unique(input.dependsOn || [], 50),
        continueOnError: Boolean(input.continueOnError),
        timeoutMs: Math.max(250, Math.min(120000, Number(input.timeoutMs) || 15000)),
        retry: frozen({ ...(input.retry || {}) }),
        configuration: frozen({ ...(input.configuration || {}) })
    });
}
