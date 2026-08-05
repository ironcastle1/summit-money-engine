export function buildShiftHandover(snapshot, options = {}) {
  const unresolved = (snapshot.signals || []).filter(item => ['CRITICAL','URGENT','IMPORTANT'].includes(item.attention.band));
  const watchHits = snapshot.alerts || [];
  return Object.freeze({
    type: 'SHIFT_HANDOVER',
    generatedAt: new Date(options.now || Date.now()).toISOString(),
    outgoingShift: options.outgoingShift || 'CURRENT',
    incomingShift: options.incomingShift || 'NEXT',
    headline: snapshot.brief?.executive?.headline || 'No material headline',
    unresolved: Object.freeze(unresolved.slice(0, 30)),
    watchHits: Object.freeze(watchHits.slice(0, 30)),
    dataGaps: Object.freeze(snapshot.brief?.gaps?.items?.slice(0, 20) || []),
    notes: Object.freeze((options.notes || []).slice(0, 50))
  });
}
