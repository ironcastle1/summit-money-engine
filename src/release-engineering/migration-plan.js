import { migrationRegistry } from './migration-registry.js';
export function migrationPlan(items = [], appliedIds = []) { const registry = migrationRegistry(items), applied = new Set(appliedIds || []), pending = registry.migrations.filter(item => !applied.has(item.id)); const unresolved = pending.filter(item => (item.dependencies || []).some(id => !applied.has(id) && !pending.some(row => row.id === id))); const ordered = []; const remaining = new Map(pending.map(item => [item.id, item])); while (remaining.size) {
    const ready = [...remaining.values()].filter(item => (item.dependencies || []).every(id => applied.has(id) || ordered.some(row => row.id === id)));
    if (!ready.length)
        break;
    ready.sort((a, b) => a.sequence - b.sequence);
    for (const item of ready) {
        ordered.push(item);
        remaining.delete(item.id);
    }
} return Object.freeze({ valid: registry.valid && unresolved.length === 0 && remaining.size === 0, ordered, unresolved, cyclic: [...remaining.keys()], reversible: ordered.every(item => item.reversible), requiresBackup: ordered.length > 0 }); }
