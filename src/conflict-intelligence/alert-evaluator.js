export function evaluateConflictAlerts(watches = [],
theatres = []) {
  const byId = new Map(theatres.map(item => [item.id,
  item])),
  alerts = [];
  for (const watch of watches) {
    const theatre = byId.get(watch.theatreId);
    if (!theatre)
    continue;
    const reasons = [];
    if (theatre.risk.score >= watch.minimumRisk)
    reasons.push(`Risk ${theatre.risk.score} >= ${watch.minimumRisk}`);
    if (theatre.escalation.score >= watch.minimumEscalation)
    reasons.push(`Escalation ${theatre.escalation.score} >= ${watch.minimumEscalation}`);
    if (theatre.verification.score >= watch.maximumConfidenceGap)
    reasons.push(`Verification gap ${theatre.verification.score} >= ${watch.maximumConfidenceGap}`);
    if (reasons.length)
    alerts.push(Object.freeze({
      id: `conflict-alert-${watch.id}-${theatre.id}`,
      watchId: watch.id,
      theatreId: theatre.id,
      title: `${theatre.name}: conflict threshold reached`,
      risk: theatre.risk.score,
      escalation: theatre.escalation.score,
      reasons,
      createdAt: new Date().toISOString()
    }));
  }
  return Object.freeze(alerts);
}
