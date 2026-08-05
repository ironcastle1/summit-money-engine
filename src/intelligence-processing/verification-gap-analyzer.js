export class VerificationGapAnalyzer {
    analyse(event = {}) {
        const gaps = [];
        const sourceIds = new Set(event.sourceIds || []);
        const claims = event.claims || [];
        const entities = event.entities || [];
        if (sourceIds.size < 2)
            gaps.push(gap('INDEPENDENT_CONFIRMATION', 25, 'Fewer than two independent sources'));
        if (!event.coordinate)
            gaps.push(gap('PRECISE_LOCATION', 15, 'No validated coordinates'));
        if (!event.timestamp)
            gaps.push(gap('EVENT_TIME', 12, 'No normalized event timestamp'));
        if (!claims.some(claim => claim.type === 'QUANTITY'))
            gaps.push(gap('QUANTIFIED_IMPACT', 10, 'No quantified impact claim'));
        if (!claims.some(claim => claim.type === 'STATUS'))
            gaps.push(gap('CURRENT_STATUS', 10, 'No explicit status claim'));
        if (!entities.some(entity => ['ORGANISATION', 'PERSON'].includes(entity.type)))
            gaps.push(gap('RESPONSIBLE_ACTOR', 8, 'No resolved actor'));
        if (!event.records?.some(record => record.url))
            gaps.push(gap('TRACEABLE_SOURCE', 15, 'No traceable source URL'));
        if (event.confidence?.contradiction?.disputed)
            gaps.push(gap('CONTRADICTION_RESOLUTION', 20, 'Material claims conflict'));
        if (event.category === 'earthquake' && !Number.isFinite(Number(event.magnitude)))
            gaps.push(gap('EARTHQUAKE_MAGNITUDE', 20, 'Magnitude missing'));
        const score = Math.max(0, 100 - gaps.reduce((sum, item) => sum + item.weight, 0));
        return {
            eventId: event.id || null,
            verificationScore: score,
            complete: gaps.length === 0,
            gaps: gaps.sort((left, right) => right.weight - left.weight),
            nextActions: gaps.slice(0, 5).map(actionForGap)
        };
    }
    compare(events = []) {
        return events.map(event => this.analyse(event)).sort((left, right) => left.verificationScore - right.verificationScore);
    }
}
function gap(type, weight, description) {
    return { type, weight, description };
}
function actionForGap(item) {
    const actions = {
        INDEPENDENT_CONFIRMATION: 'Find an independently owned source reporting the same event',
        PRECISE_LOCATION: 'Resolve a city, port, facility or coordinate pair',
        EVENT_TIME: 'Obtain an original publication or occurrence timestamp',
        QUANTIFIED_IMPACT: 'Find confirmed casualty, outage, delay or volume figures',
        CURRENT_STATUS: 'Confirm whether the event is ongoing, resolved or disputed',
        RESPONSIBLE_ACTOR: 'Resolve the responsible organisation or person',
        TRACEABLE_SOURCE: 'Attach a durable source URL or official document',
        CONTRADICTION_RESOLUTION: 'Compare primary evidence and resolve conflicting claims',
        EARTHQUAKE_MAGNITUDE: 'Obtain magnitude and depth from a seismic authority'
    };
    return { type: item.type, priority: item.weight, action: actions[item.type] || 'Collect additional evidence' };
}
