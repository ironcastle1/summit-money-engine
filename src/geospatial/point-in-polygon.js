function pointInRing(point, ring) {
    let inside = false;
    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
        const xi = Number(ring[index][0]);
        const yi = Number(ring[index][1]);
        const xj = Number(ring[previous][0]);
        const yj = Number(ring[previous][1]);
        const intersects = ((yi > point.lat) !== (yj > point.lat)) && (point.lon < (xj - xi) * (point.lat - yi) / ((yj - yi) || Number.EPSILON) + xi);
        if (intersects)
            inside = !inside;
    }
    return inside;
}
export function pointInPolygon(point, coordinates = []) {
    if (!coordinates.length || !pointInRing(point, coordinates[0]))
        return false;
    return !coordinates.slice(1).some(ring => pointInRing(point, ring));
}
export function pointInMultiPolygon(point, coordinates = []) { return coordinates.some(polygon => pointInPolygon(point, polygon)); }
