import { operationsId } from './ids.js';
import { clean, clamp } from './utilities.js';
import { iso } from './time.js';
export function operationalRisk(input = {}) {
    const title = clean(input.title, 240);
    if (!title)
        throw new TypeError('Risk title is required');
    const likelihood = clamp(input.likelihood);
    const impact = clamp(input.impact);
    const controlStrength = clamp(input.controlStrength);
    const inherent = Math.round(likelihood * impact / 100);
    const residual = Math.round(inherent * (1 - controlStrength / 100));
    return Object.freeze({ id: clean(input.id, 140) || operationsId('ops-risk', title), title, description: clean(input.description, 2000), serviceId: clean(input.serviceId, 120), category: clean(input.category, 60).toUpperCase() || 'RELIABILITY', likelihood, impact, controlStrength, inherent, residual, band: residual >= 70 ? 'CRITICAL' : residual >= 50 ? 'HIGH' : residual >= 25 ? 'MEDIUM' : 'LOW', state: clean(input.state, 30).toUpperCase() || 'OPEN', owner: clean(input.owner, 160), mitigation: clean(input.mitigation, 2000), createdAt: input.createdAt || iso(), updatedAt: iso() });
}
