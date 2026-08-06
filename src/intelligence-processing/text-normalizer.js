const DIACRITICS = /[\u0300-\u036f]/g;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const HTML = /<[^>]*>/g;
const URL = /https?:\/\/[^\s]+/gi;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /(?<!\d)(?:\+?\d[\d ()-]{7,}\d)(?!\d)/g;
export function stripHtml(value) {
    return String(value ?? '').replace(HTML, ' ');
}
export function normalizeWhitespace(value) {
    return String(value ?? '').replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
}
export function normalizeUnicode(value) {
    return String(value ?? '').normalize('NFKC');
}
export function removeDiacritics(value) {
    return String(value ?? '').normalize('NFD').replace(DIACRITICS, '').normalize('NFC');
}
export function normalizeText(value, options = {}) {
    const { lower = true, removeUrls = false, removePunctuation = false, asciiFold = true } = options;
    let text = normalizeWhitespace(stripHtml(normalizeUnicode(value)));
    if (removeUrls)
        text = text.replace(URL, ' ');
    if (asciiFold)
        text = removeDiacritics(text);
    if (removePunctuation)
        text = text.replace(/[^\p{L}\p{N}%$€£¥+.-]+/gu, ' ');
    text = normalizeWhitespace(text);
    return lower ? text.toLocaleLowerCase('en-GB') : text;
}
export function canonicalName(value) {
    return normalizeText(value, { removeUrls: true, removePunctuation: true })
        .replace(/\b(the|a|an|of|and|corporation|corp|company|co|limited|ltd|incorporated|inc)\b/g, ' ')
        .replace(/\s+/g, ' ').trim();
}
export function tokenize(value, options = {}) {
    const minimumLength = Number.isFinite(options.minimumLength) ? options.minimumLength : 2;
    const stop = new Set(options.stopWords || ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'over', 'after', 'before', 'says', 'said']);
    return normalizeText(value, { removeUrls: true, removePunctuation: true })
        .split(/\s+/).filter(token => token.length >= minimumLength && !stop.has(token));
}
export function ngrams(value, size = 3) {
    const text = normalizeText(value, { removeUrls: true, removePunctuation: true }).replace(/\s+/g, ' ');
    if (!text)
        return [];
    if (text.length <= size)
        return [text];
    const result = [];
    for (let i = 0; i <= text.length - size; i += 1)
        result.push(text.slice(i, i + size));
    return result;
}
export function sentenceSplit(value) {
    const text = normalizeWhitespace(stripHtml(value));
    if (!text)
        return [];
    return text.split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/).map(normalizeWhitespace).filter(Boolean);
}
export function extractNumbers(value) {
    const text = String(value ?? '');
    const pattern = /(?<![\w.])([+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)(\s*(?:%|percent\b|k\b|m\b|bn\b|billion\b|million\b|thousand\b|km\b|mi\b|mph\b|kph\b|usd\b|eur\b|gbp\b|tonnes?\b|tons?\b|barrels?\b|people\b|deaths?\b|injured\b))?/gi;
    const multipliers = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, bn: 1e9, billion: 1e9 };
    const results = [];
    for (const match of text.matchAll(pattern)) {
        const raw = match[0].trim();
        const numeric = Number(match[1].replace(/,/g, ''));
        const unit = String(match[2] || '').trim().toLowerCase();
        const multiplier = multipliers[unit] || 1;
        if (Number.isFinite(numeric))
            results.push({ raw, value: numeric * multiplier, unit: unit || null, index: match.index });
    }
    return results;
}
export function redactSensitiveText(value) {
    return normalizeWhitespace(String(value ?? '').replace(EMAIL, '[email]').replace(PHONE, '[phone]').replace(URL, '[url]'));
}
export function stableTextKey(value) {
    const text = normalizeText(value, { removeUrls: true, removePunctuation: true });
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return `txt_${(hash >>> 0).toString(36)}`;
}
