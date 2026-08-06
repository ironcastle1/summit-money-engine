import { stableTextKey } from './text-normalizer.js';
export class ProvenanceLedger {
    constructor(options = {}) { this.maximum = options.maximum ?? 10000; this.entries = new Map(); this.byRecord = new Map(); this.byOutput = new Map(); }
    append(input = {}) {
        const timestamp = input.timestamp || new Date().toISOString();
        const recordId = String(input.recordId || input.inputId || '');
        const outputId = String(input.outputId || '');
        const id = String(input.id || `prov_${stableTextKey(`${recordId}:${outputId}:${input.operation || ''}:${timestamp}`).slice(4)}`);
        const entry = Object.freeze({ id, recordId: recordId || null, outputId: outputId || null, sourceId: input.sourceId || null, operation: input.operation || 'PROCESS', timestamp, processor: input.processor || 'merlin-v20', version: input.version || '1', inputs: [...(input.inputs || [])], attributes: { ...(input.attributes || {}) } });
        this.entries.set(id, entry);
        index(this.byRecord, recordId, id);
        index(this.byOutput, outputId, id);
        this.#prune();
        return entry;
    }
    get(id) { return this.entries.get(id) || null; }
    forRecord(id) { return [...(this.byRecord.get(String(id)) || [])].map(key => this.entries.get(key)).filter(Boolean); }
    forOutput(id) { return [...(this.byOutput.get(String(id)) || [])].map(key => this.entries.get(key)).filter(Boolean); }
    lineage(outputId, maxDepth = 12) {
        const result = [];
        const visited = new Set();
        const queue = [String(outputId)];
        while (queue.length && result.length < this.maximum) {
            const current = queue.shift();
            for (const entry of this.forOutput(current)) {
                if (visited.has(entry.id))
                    continue;
                visited.add(entry.id);
                result.push(entry);
                if (result.length < maxDepth * 100)
                    for (const input of entry.inputs)
                        queue.push(String(input));
            }
        }
        return result;
    }
    list(limit = 100) { return [...this.entries.values()].slice(-Math.max(1, limit)).reverse(); }
    snapshot() { return { entries: this.entries.size, records: this.byRecord.size, outputs: this.byOutput.size }; }
    #prune() {
        while (this.entries.size > this.maximum) {
            const first = this.entries.keys().next().value;
            const entry = this.entries.get(first);
            this.entries.delete(first);
            remove(this.byRecord, entry.recordId, first);
            remove(this.byOutput, entry.outputId, first);
        }
    }
}
function index(map, key, value) {
    if (!key)
        return;
    if (!map.has(key))
        map.set(key, new Set());
    map.get(key).add(value);
}
function remove(map, key, value) {
    if (!key)
        return;
    const set = map.get(key);
    set?.delete(value);
    if (!set?.size)
        map.delete(key);
}
