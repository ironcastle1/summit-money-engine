import { migrationRecord } from './migration-record.js';
export function migrationRegistry(items = []) { const migrations = items.map(migrationRecord).sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id)); const duplicates = []; const seen = new Set(); for (const item of migrations) {
    const key = `${item.componentId}:${item.sequence}`;
    if (seen.has(key))
        duplicates.push(key);
    seen.add(key);
} return Object.freeze({ migrations, duplicates, valid: duplicates.length === 0, latestByComponent: Object.fromEntries([...new Set(migrations.map(item => item.componentId))].map(id => [id, migrations.filter(item => item.componentId === id).at(-1)?.version || null])) }); }
