export class EventLifecycleTracker {
    constructor(options = {}) {
        this.maximumHistory = options.maximumHistory || 100;
        this.events = new Map();
    }
    observe(event) {
        if (!event?.id)
            throw new TypeError('Event id is required');
        const current = this.events.get(event.id) || {
            id: event.id,
            firstSeenAt: event.timestamp || new Date().toISOString(),
            observations: [],
            status: 'REPORTED'
        };
        const observation = {
            timestamp: event.updatedAt || event.timestamp || new Date().toISOString(),
            status: event.status || current.status,
            confidence: event.confidence?.score ?? event.confidence ?? null,
            materiality: event.materiality?.score ?? event.materialityScore ?? null,
            sourceCount: event.sourceIds?.length || 0,
            summary: event.summary || event.title || null
        };
        current.observations.push(observation);
        if (current.observations.length > this.maximumHistory)
            current.observations.shift();
        current.status = observation.status;
        current.lastSeenAt = observation.timestamp;
        current.peakConfidence = Math.max(current.peakConfidence || 0, Number(observation.confidence || 0));
        current.peakMateriality = Math.max(current.peakMateriality || 0, Number(observation.materiality || 0));
        current.revisions = Math.max(0, current.observations.length - 1);
        this.events.set(event.id, current);
        return current;
    }
    get(id) {
        return this.events.get(String(id)) || null;
    }
    change(id) {
        const lifecycle = this.get(id);
        if (!lifecycle || lifecycle.observations.length < 2)
            return null;
        const previous = lifecycle.observations.at(-2);
        const latest = lifecycle.observations.at(-1);
        return {
            statusChanged: previous.status !== latest.status,
            confidenceDelta: Number(latest.confidence || 0) - Number(previous.confidence || 0),
            materialityDelta: Number(latest.materiality || 0) - Number(previous.materiality || 0),
            sourceCountDelta: Number(latest.sourceCount || 0) - Number(previous.sourceCount || 0)
        };
    }
    listActive() {
        return [...this.events.values()].filter(event => !['RESOLVED', 'RETRACTED'].includes(event.status));
    }
}
