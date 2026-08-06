export class DecisionLog {
    constructor(options = {}) {
        this.maximum = options.maximum || 10000;
        this.entries = [];
    }
    record(input = {}) {
        const entry = Object.freeze({
            id: input.id || `decision_${Date.now().toString(36)}_${this.entries.length.toString(36)}`,
            timestamp: input.timestamp || new Date().toISOString(),
            subjectId: input.subjectId || null,
            processor: input.processor || 'unknown',
            decision: input.decision || 'UNSPECIFIED',
            score: Number.isFinite(Number(input.score)) ? Number(input.score) : null,
            threshold: Number.isFinite(Number(input.threshold)) ? Number(input.threshold) : null,
            factors: [...(input.factors || [])],
            evidenceIds: [...(input.evidenceIds || [])],
            modelVersion: input.modelVersion || '1',
            reversible: input.reversible !== false,
            metadata: { ...(input.metadata || {}) }
        });
        this.entries.push(entry);
        if (this.entries.length > this.maximum)
            this.entries.splice(0, this.entries.length - this.maximum);
        return entry;
    }
    forSubject(subjectId, limit = 100) {
        return this.entries.filter(entry => entry.subjectId === subjectId).slice(-limit).reverse();
    }
    forProcessor(processor, limit = 100) {
        return this.entries.filter(entry => entry.processor === processor).slice(-limit).reverse();
    }
    reverse(id, reason, actor = 'system') {
        const original = this.entries.find(entry => entry.id === id);
        if (!original || !original.reversible)
            return null;
        return this.record({
            subjectId: original.subjectId,
            processor: original.processor,
            decision: `REVERSE:${original.decision}`,
            factors: [reason],
            evidenceIds: [original.id],
            reversible: false,
            metadata: { actor, reversedDecisionId: original.id }
        });
    }
    snapshot() {
        const decisions = new Map();
        for (const entry of this.entries)
            decisions.set(entry.decision, (decisions.get(entry.decision) || 0) + 1);
        return { entries: this.entries.length, decisions: Object.fromEntries(decisions), latest: this.entries.at(-1) || null };
    }
}
