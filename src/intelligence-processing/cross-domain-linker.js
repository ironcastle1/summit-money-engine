import { haversineDistanceKm, validCoordinate } from './geo-utils.js';
export class CrossDomainLinker {
    link(events = [], options = {}) {
        const maximumHours = options.maximumHours || 72;
        const maximumDistanceKm = options.maximumDistanceKm || 1000;
        const links = [];
        for (let left = 0; left < events.length; left += 1) {
            for (let right = left + 1; right < events.length; right += 1) {
                const a = events[left];
                const b = events[right];
                if (a.category === b.category)
                    continue;
                const hours = timeDifferenceHours(a, b);
                if (hours !== null && hours > maximumHours)
                    continue;
                const distanceKm = validCoordinate(a.coordinate) && validCoordinate(b.coordinate)
                    ? haversineDistanceKm(a.coordinate, b.coordinate)
                    : null;
                if (distanceKm !== null && distanceKm > maximumDistanceKm)
                    continue;
                const sharedEntities = intersection(entityIds(a), entityIds(b));
                const sharedDomains = intersection(domainIds(a), domainIds(b));
                const score = Math.min(1, sharedEntities.length * 0.25
                    + sharedDomains.length * 0.12
                    + (hours === null ? 0.1 : Math.max(0, 1 - hours / maximumHours) * 0.22)
                    + (distanceKm === null ? 0.08 : Math.max(0, 1 - distanceKm / maximumDistanceKm) * 0.23));
                if (score < (options.threshold || 0.35))
                    continue;
                links.push({
                    id: `link_${a.id}_${b.id}`,
                    from: a.id,
                    to: b.id,
                    score,
                    sharedEntities,
                    sharedDomains,
                    hours,
                    distanceKm,
                    reason: describe(sharedEntities, sharedDomains, hours, distanceKm)
                });
            }
        }
        return links.sort((left, right) => right.score - left.score);
    }
}
function entityIds(event) {
    return new Set((event.entities || []).map(entity => entity.id || `${entity.type}:${entity.canonicalName || entity.name}`));
}
function domainIds(event) {
    return new Set((event.impact?.domains || []).map(item => item.domain));
}
function intersection(left, right) {
    return [...left].filter(value => right.has(value));
}
function timeDifferenceHours(left, right) {
    const a = Date.parse(left.updatedAt || left.timestamp || '');
    const b = Date.parse(right.updatedAt || right.timestamp || '');
    return Number.isFinite(a) && Number.isFinite(b) ? Math.abs(a - b) / 3600000 : null;
}
function describe(entities, domains, hours, distanceKm) {
    const parts = [];
    if (entities.length)
        parts.push(`${entities.length} shared entities`);
    if (domains.length)
        parts.push(`${domains.length} shared impact domains`);
    if (hours !== null)
        parts.push(`${hours.toFixed(1)} hours apart`);
    if (distanceKm !== null)
        parts.push(`${distanceKm.toFixed(0)} km apart`);
    return parts.join('; ');
}
