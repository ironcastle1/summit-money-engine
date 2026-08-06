import { ngrams, tokenize } from './text-normalizer.js';
export function jaccardSimilarity(left, right) {
    const a = new Set(left || []);
    const b = new Set(right || []);
    if (!a.size && !b.size)
        return 1;
    if (!a.size || !b.size)
        return 0;
    let intersection = 0;
    for (const value of a)
        if (b.has(value))
            intersection += 1;
    return intersection / (a.size + b.size - intersection);
}
export function diceSimilarity(left, right) {
    const a = new Set(left || []);
    const b = new Set(right || []);
    if (!a.size && !b.size)
        return 1;
    let intersection = 0;
    for (const value of a)
        if (b.has(value))
            intersection += 1;
    return (2 * intersection) / Math.max(1, a.size + b.size);
}
export function cosineSimilarity(left, right) {
    const a = frequency(left || []);
    const b = frequency(right || []);
    const terms = new Set([...a.keys(), ...b.keys()]);
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (const term of terms) {
        const av = a.get(term) || 0;
        const bv = b.get(term) || 0;
        dot += av * bv;
        magA += av * av;
        magB += bv * bv;
    }
    return magA && magB ? dot / Math.sqrt(magA * magB) : 0;
}
function frequency(values) {
    const map = new Map();
    for (const value of values)
        map.set(value, (map.get(value) || 0) + 1);
    return map;
}
export function levenshteinDistance(a, b) {
    const left = String(a ?? '');
    const right = String(b ?? '');
    if (!left.length)
        return right.length;
    if (!right.length)
        return left.length;
    let previous = Array.from({ length: right.length + 1 }, (_, i) => i);
    for (let i = 1; i <= left.length; i += 1) {
        const current = [i];
        for (let j = 1; j <= right.length; j += 1) {
            current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
        }
        previous = current;
    }
    return previous[right.length];
}
export function normalizedEditSimilarity(a, b) {
    const length = Math.max(String(a ?? '').length, String(b ?? '').length);
    return length ? 1 - levenshteinDistance(a, b) / length : 1;
}
export function weightedTextSimilarity(left, right, weights = {}) {
    const tokenWeight = weights.tokens ?? 0.5;
    const ngramWeight = weights.ngrams ?? 0.3;
    const editWeight = weights.edit ?? 0.2;
    const tokenScore = cosineSimilarity(tokenize(left), tokenize(right));
    const ngramScore = diceSimilarity(ngrams(left, 3), ngrams(right, 3));
    const editScore = normalizedEditSimilarity(String(left ?? '').toLowerCase(), String(right ?? '').toLowerCase());
    const totalWeight = tokenWeight + ngramWeight + editWeight || 1;
    return (tokenScore * tokenWeight + ngramScore * ngramWeight + editScore * editWeight) / totalWeight;
}
