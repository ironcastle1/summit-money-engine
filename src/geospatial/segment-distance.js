import { haversineDistance } from './distance.js';
import { projectWorld, unprojectWorld } from './mercator.js';
export function nearestPointOnSegment(point, start, end) {
    const zoom = 8;
    const p = projectWorld(point, zoom);
    const a = projectWorld(start, zoom);
    const b = projectWorld(end, zoom);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared)) : 0;
    const nearest = unprojectWorld({ x: a.x + dx * t, y: a.y + dy * t }, zoom);
    return { point: nearest, fraction: t, distanceKm: haversineDistance(point, nearest) };
}
export function distanceToPolyline(point, line = []) {
    let best = { point: null, fraction: 0, segmentIndex: -1, distanceKm: Infinity };
    for (let index = 1; index < line.length; index += 1) {
        const candidate = nearestPointOnSegment(point, line[index - 1], line[index]);
        if (candidate.distanceKm < best.distanceKm)
            best = { ...candidate, segmentIndex: index - 1 };
    }
    return best;
}
