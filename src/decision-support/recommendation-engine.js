export function recommendations(snapshot, options = {}) {
  const maximum = Number(options.limit) || 20;
  return Object.freeze((snapshot.signals || []).filter(signal => signal.attention.actionability.score >= 45).sort((a, b) => b.attention.score - a.attention.score).slice(0, maximum).map(signal => Object.freeze({
    id: `recommendation-${signal.id}`,
    signalId: signal.id,
    title: signal.title,
    action: signal.action || `Review ${signal.domain.toLowerCase()} evidence and determine whether escalation is required.`,
    priority: signal.attention.band,
    score: signal.attention.score,
    confidence: signal.attention.confidence.score,
    rationale: Object.freeze(signal.attention.reasons)
  })));
}
