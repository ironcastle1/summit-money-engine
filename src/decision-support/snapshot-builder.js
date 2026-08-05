import { attentionScore } from './attention-score.js';
import { alertCandidates } from './alert-candidate.js';
import { detectChanges } from './change-detector.js';
import { dashboardCards } from './dashboard-cards.js';
import { decisionTimeline } from './timeline-builder.js';
import { evidenceLedger } from './evidence-ledger.js';
import { buildMorningBrief } from './morning-brief.js';
import { matchWatchlists } from './watchlist-matcher.js';
import { mapFocusFeatures } from './map-focus.js';
import { kpiScorecard } from './kpi-scorecard.js';
export function buildDecisionSnapshot(input = {}) {
  const now = input.now || Date.now();
  const seen = new Map();
  for (const signal of input.signals || []) {
    const scored = Object.freeze({ ...signal, attention: attentionScore(signal, now) });
    const existing = seen.get(scored.id);
    if (!existing || scored.attention.score > existing.attention.score) seen.set(scored.id, scored);
  }
  let signals = [...seen.values()].filter(item => item.attention.score >= Number(input.minimumPriority || 0));
  if (input.domains?.length) signals = signals.filter(item => input.domains.includes(item.domain));
  signals.sort((a, b) => b.attention.score - a.attention.score || Date.parse(b.time) - Date.parse(a.time));
  signals = signals.slice(0, Number(input.limit) || 500);
  const changes = detectChanges(signals, input.previousSignals || []);
  const matches = matchWatchlists(input.watchlists || [], signals);
  const alerts = alertCandidates(matches);
  const brief = buildMorningBrief(signals, changes, { now, sectionLimit: input.sectionLimit });
  const base = { generatedAt: new Date(now).toISOString(), signals: Object.freeze(signals), changes, alerts, brief, evidence: evidenceLedger(signals), timeline: decisionTimeline(signals, input.activity || []), map: Object.freeze({ type: 'FeatureCollection', features: mapFocusFeatures(signals) }) };
  return Object.freeze({ ...base, cards: dashboardCards(base), scorecard: kpiScorecard(base) });
}
