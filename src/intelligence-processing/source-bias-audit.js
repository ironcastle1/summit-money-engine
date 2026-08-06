const FRAME_HINTS = Object.freeze({
    SECURITY: ['terrorist', 'extremist', 'threat', 'security operation'],
    HUMANITARIAN: ['victims', 'civilians', 'aid', 'suffering', 'displaced'],
    ECONOMIC: ['cost', 'growth', 'trade', 'business', 'investment'],
    MILITARY: ['target', 'operation', 'strike', 'forces', 'defence'],
    POLITICAL: ['regime', 'government', 'opposition', 'democracy', 'authoritarian']
});
export class SourceBiasAuditor {
    audit(records = []) {
        const bySource = new Map();
        for (const record of records) {
            const id = record.sourceId || record.source?.id || 'unknown';
            if (!bySource.has(id))
                bySource.set(id, []);
            bySource.get(id).push(record);
        }
        const sources = [...bySource.entries()].map(([sourceId, items]) => this.#source(sourceId, items));
        const frameCoverage = new Map();
        for (const source of sources) {
            for (const frame of source.frames)
                frameCoverage.set(frame.frame, (frameCoverage.get(frame.frame) || 0) + frame.share);
        }
        return {
            sources,
            sourceCount: sources.length,
            frameCoverage: Object.fromEntries([...frameCoverage.entries()].sort((left, right) => right[1] - left[1])),
            concentration: concentration(sources.map(source => source.recordCount)),
            warnings: warnings(sources)
        };
    }
    #source(sourceId, records) {
        const text = records.map(record => [record.title, record.summary].filter(Boolean).join(' ')).join(' ').toLowerCase();
        const frames = Object.entries(FRAME_HINTS).map(([frame, hints]) => ({
            frame,
            hits: hints.reduce((sum, hint) => sum + occurrences(text, hint), 0)
        })).filter(item => item.hits).sort((left, right) => right.hits - left.hits);
        const total = frames.reduce((sum, item) => sum + item.hits, 0) || 1;
        return {
            sourceId,
            recordCount: records.length,
            frames: frames.map(item => ({ ...item, share: item.hits / total })),
            dominantFrame: frames[0]?.frame || 'UNCLASSIFIED',
            sentiment: sentiment(text),
            attributionRate: records.filter(record => /according to|said|stated|announced/i.test(`${record.title || ''} ${record.summary || ''}`)).length / records.length
        };
    }
}
function occurrences(text, term) {
    return text.split(term).length - 1;
}
function sentiment(text) {
    const negative = ['crisis', 'failure', 'attack', 'threat', 'collapse', 'loss'].reduce((sum, term) => sum + occurrences(text, term), 0);
    const positive = ['agreement', 'recovery', 'success', 'growth', 'peace', 'restored'].reduce((sum, term) => sum + occurrences(text, term), 0);
    return negative === positive ? 'NEUTRAL' : negative > positive ? 'NEGATIVE' : 'POSITIVE';
}
function concentration(counts) {
    const total = counts.reduce((sum, value) => sum + value, 0) || 1;
    return counts.reduce((sum, value) => sum + (value / total) ** 2, 0);
}
function warnings(sources) {
    const result = [];
    if (sources.length < 2)
        result.push('Coverage is dependent on a single source');
    if (concentration(sources.map(source => source.recordCount)) > 0.6)
        result.push('Coverage is highly concentrated');
    if (new Set(sources.map(source => source.dominantFrame)).size === 1 && sources.length > 1)
        result.push('All sources use the same dominant frame');
    return result;
}
