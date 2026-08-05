import { normalizeLongitude } from './longitude.js';
import { clampLatitude } from './latitude.js';
export function spatialCellSize(zoom = 6) { return 360 / (2 ** Math.max(0, Math.floor(Number(zoom)))); }
export function spatialHash(point, zoom = 6) {
    const size = spatialCellSize(zoom);
    const x = Math.floor((normalizeLongitude(point.lon) + 180) / size);
    const y = Math.floor((clampLatitude(point.lat, false) + 90) / size);
    return `${zoom}:${x}:${y}`;
}
export function neighbouringHashes(point, zoom = 6, radius = 1) {
    const size = spatialCellSize(zoom);
    const baseX = Math.floor((normalizeLongitude(point.lon) + 180) / size);
    const baseY = Math.floor((clampLatitude(point.lat, false) + 90) / size);
    const output = [];
    for (let y = baseY - radius; y <= baseY + radius; y += 1)
        for (let x = baseX - radius; x <= baseX + radius; x += 1)
            output.push(`${zoom}:${x}:${y}`);
    return output;
}
