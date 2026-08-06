import { coordinateFromGeoJson } from './coordinate.js';
export function closeRing(ring = []) {
    if (!ring.length)
        return [];
    const output = ring.map(point => [...point]);
    const first = output[0];
    const last = output.at(-1);
    if (first[0] !== last[0] || first[1] !== last[1])
        output.push([...first]);
    return output;
}
export function ringArea(ring = []) {
    const closed = closeRing(ring);
    let area = 0;
    for (let index = 1; index < closed.length; index += 1)
        area += closed[index - 1][0] * closed[index][1] - closed[index][0] * closed[index - 1][1];
    return area / 2;
}
export function polygonArea(coordinates = []) {
    if (!coordinates.length)
        return 0;
    return Math.abs(ringArea(coordinates[0])) - coordinates.slice(1).reduce((sum, ring) => sum + Math.abs(ringArea(ring)), 0);
}
export function ringCentroid(ring = []) {
    const closed = closeRing(ring);
    let x = 0;
    let y = 0;
    let factorTotal = 0;
    for (let index = 1; index < closed.length; index += 1) {
        const factor = closed[index - 1][0] * closed[index][1] - closed[index][0] * closed[index - 1][1];
        factorTotal += factor;
        x += (closed[index - 1][0] + closed[index][0]) * factor;
        y += (closed[index - 1][1] + closed[index][1]) * factor;
    }
    if (!factorTotal)
        return coordinateFromGeoJson(closed[0] || [0, 0]);
    return { lon: x / (3 * factorTotal), lat: y / (3 * factorTotal) };
}
