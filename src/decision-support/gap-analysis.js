export function gapAnalysis(signals = []) {
  const gaps = [];
  for (const signal of signals) {
    const reasons = [];
    if (signal.sourceState === 'UNAVAILABLE') reasons.push('NO_SOURCE');
    if ((signal.sources?.length || 0) < 2) reasons.push('SINGLE_SOURCE');
    if ((signal.attention?.confidence?.score || 0) < 50) reasons.push('LOW_CONFIDENCE');
    if (!signal.summary) reasons.push('NO_SUMMARY');
    if (!signal.location?.label && !Number.isFinite(signal.location?.lat)) reasons.push('UNLOCATED');
    if (reasons.length) gaps.push(Object.freeze({ signalId: signal.id, title: signal.title, domain: signal.domain, reasons: Object.freeze(reasons), severity: signal.severity }));
  }
  return Object.freeze({ count: gaps.length, critical: Object.freeze(gaps.filter(item => item.severity >= 70)), items: Object.freeze(gaps) });
}
