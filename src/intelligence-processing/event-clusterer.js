import { DEFAULT_THRESHOLDS } from './constants.js';
import { recordSimilarity } from './cluster-similarity.js';
import { stableTextKey } from './text-normalizer.js';
export class EventClusterer {
    constructor(options = {}) { this.threshold = options.threshold ?? DEFAULT_THRESHOLDS.clusterSimilarity; this.maxHours = options.maxHours ?? DEFAULT_THRESHOLDS.maxClusterAgeHours; }
    cluster(records = []) {
        const clusters = [];
        const ordered = [...records].sort((a, b) => Date.parse(a.timestamp || a.publishedAt || 0) - Date.parse(b.timestamp || b.publishedAt || 0));
        for (const record of ordered) {
            let best = null;
            for (const cluster of clusters) {
                const representative = cluster.records.at(-1);
                const similarity = recordSimilarity(representative, record, { maxHours: this.maxHours });
                if (!best || similarity.score > best.similarity.score)
                    best = { cluster, similarity };
            }
            if (best && best.similarity.score >= this.threshold) {
                best.cluster.records.push(record);
                best.cluster.similarities.push(best.similarity);
                best.cluster.updatedAt = record.timestamp || record.publishedAt || new Date().toISOString();
            }
            else
                clusters.push({ id: `cluster_${stableTextKey(record.id || record.title || JSON.stringify(record)).slice(4)}`, records: [record], similarities: [], createdAt: record.timestamp || record.publishedAt || new Date().toISOString(), updatedAt: record.timestamp || record.publishedAt || new Date().toISOString() });
        }
        return clusters.map(cluster => ({ ...cluster, sourceIds: [...new Set(cluster.records.map(item => item.sourceId).filter(Boolean))], recordIds: cluster.records.map(item => item.id), averageSimilarity: average(cluster.similarities.map(item => item.score)) }));
    }
}
function average(values) { return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 1; }
