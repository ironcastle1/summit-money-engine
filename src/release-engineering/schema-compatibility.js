export function schemaCompatibility(before = {}, after = {}) { const removed = [], added = [], changed = []; const keys = new Set([...Object.keys(before), ...Object.keys(after)]); for (const key of keys) {
    if (!(key in after))
        removed.push(key);
    else if (!(key in before))
        added.push(key);
    else if (JSON.stringify(before[key]) !== JSON.stringify(after[key]))
        changed.push(key);
} const breaking = removed.length > 0 || changed.some(key => before[key]?.required && !after[key]?.backwardCompatible); return Object.freeze({ state: breaking ? 'BREAKING' : changed.length ? 'CONDITIONAL' : 'COMPATIBLE', removed, added, changed, breaking }); }
