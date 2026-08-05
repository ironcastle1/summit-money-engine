import { releaseId } from './ids.js';
import { clean } from './utilities.js';
export function smokeScenario(input = {}) { const name = clean(input.name, 160); if (!name)
    throw new TypeError('Smoke scenario name required'); const steps = (input.steps || []).map((step, index) => ({ id: step.id || `step-${index + 1}`, method: String(step.method || 'GET').toUpperCase(), path: String(step.path || '/'), expectedStatus: Number(step.expectedStatus) || 200, assertions: Array.isArray(step.assertions) ? step.assertions : [] })); return Object.freeze({ id: input.id || releaseId('smoke', name), name, critical: input.critical !== false, steps, timeoutMs: Number(input.timeoutMs) || 10000 }); }
