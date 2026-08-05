import { apiContract } from './api-contract.js';
export function endpointInventory(items = []) { const endpoints = items.map(apiContract).sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)); const duplicateKeys = []; const seen = new Set(); for (const item of endpoints) {
    const key = `${item.method} ${item.path}`;
    if (seen.has(key))
        duplicateKeys.push(key);
    seen.add(key);
} return Object.freeze({ endpoints, count: endpoints.length, duplicates: duplicateKeys, valid: duplicateKeys.length === 0, deprecated: endpoints.filter(item => item.deprecated).length }); }
