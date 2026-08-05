import { positiveModulo } from './number.js';
export function tileCount(zoom) { return 2 ** Math.max(0, Math.trunc(Number(zoom) || 0)); }
export function normalizeTile(tile) {
    const z = Math.max(0, Math.trunc(Number(tile.z) || 0));
    const count = tileCount(z);
    return Object.freeze({ z, x: positiveModulo(Math.trunc(Number(tile.x) || 0), count), y: Math.max(0, Math.min(count - 1, Math.trunc(Number(tile.y) || 0))) });
}
export function tileKey(tile, source = 'default') {
    const normalized = normalizeTile(tile);
    return `${source}:${normalized.z}/${normalized.x}/${normalized.y}`;
}
export function tileParent(tile) {
    const normalized = normalizeTile(tile);
    if (normalized.z === 0)
        return normalized;
    return normalizeTile({ z: normalized.z - 1, x: Math.floor(normalized.x / 2), y: Math.floor(normalized.y / 2) });
}
export function tileChildren(tile) {
    const normalized = normalizeTile(tile);
    const z = normalized.z + 1;
    return [0, 1].flatMap(dx => [0, 1].map(dy => normalizeTile({ z, x: normalized.x * 2 + dx, y: normalized.y * 2 + dy })));
}
