const OWNERSHIP_GROUPS = [
    new Set(['reuters', 'thomson-reuters']), new Set(['associated-press', 'ap']),
    new Set(['bbc-news', 'bbc-world', 'bbc']), new Set(['cnn', 'cnn-international']),
    new Set(['financial-times', 'ft']), new Set(['al-jazeera', 'al-jazeera-english'])
];
export function sourceFingerprint(source = {}) {
    const domain = normalizeDomain(source.domain || source.url || '');
    const id = String(source.id || source.sourceId || domain || 'unknown').toLowerCase();
    const group = String(source.ownershipGroup || findOwnershipGroup(id) || domain || id).toLowerCase();
    const author = String(source.author || '').toLowerCase().trim();
    const wire = String(source.wireId || source.syndicationId || '').toLowerCase();
    return { id, domain, group, author, wire };
}
export function independenceScore(left, right) {
    const a = sourceFingerprint(left);
    const b = sourceFingerprint(right);
    if (a.id === b.id)
        return 0;
    if (a.wire && a.wire === b.wire)
        return 0.05;
    if (a.group && a.group === b.group)
        return 0.15;
    if (a.domain && a.domain === b.domain)
        return 0.2;
    if (a.author && a.author === b.author)
        return 0.35;
    return 1;
}
export function independentGroups(sources = []) {
    const groups = new Map();
    for (const source of sources) {
        const fp = sourceFingerprint(source);
        const key = fp.wire || fp.group || fp.domain || fp.id;
        if (!groups.has(key))
            groups.set(key, []);
        groups.get(key).push(source);
    }
    return [...groups.values()];
}
export function effectiveIndependentCount(sources = []) {
    const groups = independentGroups(sources);
    if (!groups.length)
        return 0;
    return groups.reduce((sum, group) => sum + Math.min(1, 0.65 + 0.12 * Math.log2(group.length + 1)), 0);
}
function normalizeDomain(value) {
    try {
        const url = value.includes('://') ? new URL(value) : new URL(`https://${value}`);
        return url.hostname.replace(/^www\./, '').toLowerCase();
    }
    catch {
        return String(value).replace(/^www\./, '').split('/')[0].toLowerCase();
    }
}
function findOwnershipGroup(id) {
    for (const group of OWNERSHIP_GROUPS)
        if (group.has(id))
            return [...group][0];
    return null;
}
