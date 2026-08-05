import { mapState } from './map-state.js';
export function savedView(input = {}) {
    const name = String(input.name || '').trim();
    if (name.length < 1 || name.length > 80)
        throw new TypeError('Saved view name must contain 1 to 80 characters');
    const id = String(input.id || `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    const state = mapState(input.state || input);
    return Object.freeze({ id, name, description: String(input.description || '').slice(0, 300), state, createdAt: input.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
}
export function validateSavedViews(values = [], maximum = 100) {
    if (!Array.isArray(values))
        throw new TypeError('Saved views must be an array');
    if (values.length > maximum)
        throw new TypeError(`Saved views exceed maximum of ${maximum}`);
    const identifiers = new Set();
    return Object.freeze(values.map(value => { const view = savedView(value); if (identifiers.has(view.id))
        throw new TypeError(`Duplicate saved view ID: ${view.id}`); identifiers.add(view.id); return view; }));
}
