function overlaps(left, right, padding = 2) {
    return !(left.right + padding < right.left || left.left - padding > right.right || left.bottom + padding < right.top || left.top - padding > right.bottom);
}
export function placeLabels(candidates = [], options = {}) {
    const accepted = [];
    const rejected = [];
    const padding = options.padding ?? 3;
    for (const candidate of candidates) {
        const collision = accepted.some(existing => overlaps(candidate.box, existing.box, padding));
        if (collision && !candidate.required)
            rejected.push(candidate);
        else
            accepted.push(candidate);
        if (accepted.length >= (options.maximum ?? 500))
            break;
    }
    return Object.freeze({ accepted: Object.freeze(accepted), rejected: Object.freeze(rejected) });
}
