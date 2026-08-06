export function explainEvent(event) {
    const factors = [];
    const confidence = event?.confidence || {};
    const materiality = event?.materiality || {};
    const relevance = event?.relevance || {};
    if (confidence.score !== undefined)
        factors.push({ factor: 'confidence', score: confidence.score, summary: `${confidence.label || 'UNRATED'} confidence from ${confidence.independentSourceCount ?? 0} independent sources` });
    if (materiality.score !== undefined)
        factors.push({ factor: 'materiality', score: materiality.score, summary: `${materiality.level || 'ROUTINE'} impact: ${(materiality.reasons || []).slice(0, 3).join('; ') || 'no elevated impact trigger'}` });
    if (relevance.score !== undefined)
        factors.push({ factor: 'relevance', score: relevance.score, summary: 'Ranked using query match, proximity, recency, confidence and materiality' });
    if (event?.earthquakeDecision?.applies)
        factors.push({ factor: 'earthquake-gate', score: event.earthquakeDecision.show ? 100 : 0, summary: event.earthquakeDecision.show ? event.earthquakeDecision.reasons.join('; ') : event.earthquakeDecision.filteredReason });
    if (event?.impact?.domains?.length)
        factors.push({ factor: 'impact-domains', score: event.impact.domains[0].score, summary: event.impact.domains.slice(0, 4).map(item => item.domain).join(', ') });
    return { eventId: event?.id || null, decision: event?.visible === false ? 'FILTERED' : 'VISIBLE', factors, provenance: event?.provenance || null, generatedAt: new Date().toISOString() };
}
