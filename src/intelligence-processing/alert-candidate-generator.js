export class AlertCandidateGenerator {
    generate(events = [], preferences = {}) {
        const minimumMateriality = Number(preferences.minimumMateriality ?? 60);
        const minimumConfidence = Number(preferences.minimumConfidence ?? 55);
        const allowedDomains = new Set((preferences.domains || []).map(value => String(value).toUpperCase()));
        const mutedCategories = new Set((preferences.mutedCategories || []).map(value => String(value).toLowerCase()));
        const candidates = [];
        for (const event of events) {
            const materiality = Number(event.materiality?.score || 0);
            const confidence = Number(event.confidence?.score || 0);
            if (materiality < minimumMateriality || confidence < minimumConfidence)
                continue;
            if (mutedCategories.has(String(event.category || '').toLowerCase()))
                continue;
            const domains = (event.impact?.domains || []).map(item => item.domain);
            if (allowedDomains.size && !domains.some(domain => allowedDomains.has(domain)))
                continue;
            const urgency = calculateUrgency(event);
            candidates.push({
                id: `alert_${event.id}`,
                eventId: event.id,
                title: event.title,
                urgency,
                priority: urgency >= 80 ? 'IMMEDIATE' : urgency >= 60 ? 'HIGH' : 'NORMAL',
                reasons: buildReasons(event),
                channels: recommendedChannels(urgency, preferences),
                deduplicationKey: `${event.id}:${event.status || 'REPORTED'}:${Math.floor(materiality / 10)}`,
                expiresAt: new Date(Date.now() + (urgency >= 80 ? 6 : 24) * 3600000).toISOString()
            });
        }
        return candidates.sort((left, right) => right.urgency - left.urgency);
    }
}
function calculateUrgency(event) {
    const materiality = Number(event.materiality?.score || 0);
    const recency = Math.exp(-Math.max(0, Date.now() - Date.parse(event.updatedAt || event.timestamp || '')) / 86400000) * 100;
    const escalation = ['ESCALATING', 'ONGOING'].includes(event.status) ? 15 : 0;
    const criticalDomain = (event.impact?.domains || []).some(item => ['MILITARY', 'SHIPPING', 'ENERGY', 'HUMAN'].includes(item.domain)) ? 8 : 0;
    return Math.round(Math.min(100, materiality * 0.65 + recency * 0.2 + escalation + criticalDomain));
}
function buildReasons(event) {
    return [...new Set([...(event.materiality?.reasons || []), ...(event.earthquakeDecision?.reasons || [])])].slice(0, 5);
}
function recommendedChannels(urgency, preferences) {
    const configured = preferences.channels || ['IN_APP'];
    if (urgency >= 80)
        return [...new Set([...configured, 'PUSH', 'EMAIL'])];
    if (urgency >= 60)
        return [...new Set([...configured, 'PUSH'])];
    return configured;
}
