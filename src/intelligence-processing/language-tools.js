const SCRIPT_PATTERNS = Object.freeze({
    ARABIC: /[\u0600-\u06ff]/u,
    CYRILLIC: /[\u0400-\u04ff]/u,
    HAN: /[\u3400-\u9fff]/u,
    HEBREW: /[\u0590-\u05ff]/u,
    GREEK: /[\u0370-\u03ff]/u,
    DEVANAGARI: /[\u0900-\u097f]/u,
    LATIN: /[A-Za-z]/
});
const LANGUAGE_HINTS = Object.freeze({
    en: ['the', 'and', 'with', 'from', 'after', 'officials'],
    fr: ['le', 'la', 'les', 'avec', 'après', 'selon'],
    es: ['el', 'la', 'los', 'con', 'después', 'según'],
    de: ['der', 'die', 'das', 'mit', 'nach', 'laut'],
    tr: ['bir', 've', 'ile', 'sonra', 'göre'],
    id: ['dan', 'dengan', 'setelah', 'menurut'],
    pt: ['o', 'a', 'com', 'depois', 'segundo']
});
export function detectScript(value) {
    const text = String(value || '');
    const scores = {};
    for (const [script, pattern] of Object.entries(SCRIPT_PATTERNS)) {
        scores[script] = [...text].filter(character => pattern.test(character)).length;
    }
    return Object.entries(scores).sort((left, right) => right[1] - left[1])[0]?.[1]
        ? Object.entries(scores).sort((left, right) => right[1] - left[1])[0][0]
        : 'UNKNOWN';
}
export function detectLanguage(value) {
    const text = String(value || '').toLocaleLowerCase('en-GB');
    const script = detectScript(text);
    if (script === 'ARABIC')
        return { language: 'ar', script, confidence: 0.92 };
    if (script === 'CYRILLIC')
        return { language: 'ru', script, confidence: 0.72 };
    if (script === 'HAN')
        return { language: 'zh', script, confidence: 0.9 };
    if (script === 'HEBREW')
        return { language: 'he', script, confidence: 0.9 };
    if (script === 'GREEK')
        return { language: 'el', script, confidence: 0.9 };
    if (script === 'DEVANAGARI')
        return { language: 'hi', script, confidence: 0.82 };
    const words = text.match(/[a-zà-ÿ]+/g) || [];
    const ranked = Object.entries(LANGUAGE_HINTS).map(([language, hints]) => ({
        language,
        score: hints.reduce((sum, hint) => sum + words.filter(word => word === hint).length, 0)
    })).sort((left, right) => right.score - left.score);
    const winner = ranked[0];
    return { language: winner?.score ? winner.language : 'en', script: script === 'UNKNOWN' ? 'LATIN' : script, confidence: winner?.score ? Math.min(0.9, 0.5 + winner.score / 10) : 0.35 };
}
export function bilingualLabel(entity) {
    const english = String(entity?.name || entity?.englishName || '').trim();
    const local = String(entity?.localName || '').trim();
    return {
        english,
        local: local && local !== english ? local : null,
        display: local && local !== english ? `${english}\n(${local})` : english
    };
}
export function languageAgreement(records = []) {
    const detections = records.map(record => detectLanguage(record.title || record.summary || ''));
    const counts = new Map();
    for (const detection of detections)
        counts.set(detection.language, (counts.get(detection.language) || 0) + 1);
    const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1]);
    return {
        languages: Object.fromEntries(ranked),
        primary: ranked[0]?.[0] || null,
        diversity: ranked.length,
        agreement: records.length ? (ranked[0]?.[1] || 0) / records.length : 0
    };
}
