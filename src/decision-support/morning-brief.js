import { buildBriefingSection } from './briefing-section.js';
import { executiveSummary } from './executive-summary.js';
import { evidenceCoverage } from './evidence-coverage.js';
import { gapAnalysis } from './gap-analysis.js';
import { staleData } from './stale-data.js';

const DOMAIN_ORDER = Object.freeze(['CONFLICT', 'HAZARDS', 'MARKETS', 'COUNTRIES', 'LOGISTICS', 'OPPORTUNITIES']);

function overnightChanges(changes = {}) {
  const categories = [
    ['NEW', changes.new || changes.added || []],
    ['ESCALATED', changes.escalated || []],
    ['DE_ESCALATED', changes.deEscalated || changes.deescalated || []],
    ['REMOVED', changes.removed || []]
  ];
  return Object.freeze(categories.map(([type, items]) => Object.freeze({
    type,
    count: items.length,
    ids: Object.freeze(items.map(item => String(item.id || item)).slice(0, 100))
  })));
}

function domainCounts(signals) {
  const counts = Object.fromEntries(DOMAIN_ORDER.map(domain => [domain, 0]));
  for (const signal of signals) counts[signal.domain] = (counts[signal.domain] || 0) + 1;
  return Object.freeze(counts);
}

function topActions(signals, limit = 10) {
  return Object.freeze(signals
    .filter(item => Number(item.attention?.actionability?.score || 0) >= 45)
    .sort((a, b) => b.attention.score - a.attention.score)
    .slice(0, limit)
    .map(item => Object.freeze({
      signalId: item.id,
      title: item.title,
      action: item.action || `Review ${String(item.domain).toLowerCase()} evidence and assign an owner.`,
      priority: item.attention.band,
      score: item.attention.score,
      dueWithinMinutes: item.attention.band === 'CRITICAL' ? 15 : item.attention.band === 'URGENT' ? 60 : 240
    })));
}

function briefingHealth(coverage, gaps, stale) {
  const coverageScore = Number(coverage.score || coverage.percent || 0);
  const gapCount = Number(gaps.count || gaps.items?.length || 0);
  const staleCount = Number(stale.count || stale.items?.length || 0);
  const score = Math.max(0, Math.min(100, coverageScore - Math.min(30, gapCount * 2) - Math.min(20, staleCount)));
  return Object.freeze({
    score: Math.round(score * 10) / 10,
    band: score >= 80 ? 'STRONG' : score >= 60 ? 'ADEQUATE' : score >= 40 ? 'LIMITED' : 'WEAK',
    coverageScore,
    gapCount,
    staleCount
  });
}

export function buildMorningBrief(signals = [], changes = {}, options = {}) {
  const now = Number(options.now) || Date.now();
  const sectionLimit = Math.max(1, Math.min(50, Number(options.sectionLimit) || 12));
  const critical = signals.filter(item => ['CRITICAL', 'URGENT'].includes(item.attention.band));
  const sections = [
    buildBriefingSection('CRITICAL', critical, { limit: sectionLimit }),
    ...DOMAIN_ORDER.map(domain => buildBriefingSection(domain, signals.filter(item => item.domain === domain), { limit: sectionLimit }))
  ];
  const coverage = evidenceCoverage(signals);
  const gaps = gapAnalysis(signals);
  const stale = staleData(signals);
  const executive = executiveSummary(signals, changes);
  const actions = topActions(signals, options.actionLimit || 12);
  return Object.freeze({
    type: 'MORNING',
    title: options.title || 'Merlin Morning Brief',
    generatedAt: new Date(now).toISOString(),
    window: Object.freeze({ hours: Math.max(1, Number(options.hours) || 24), timezone: options.timezone || 'UTC' }),
    executive,
    readiness: briefingHealth(coverage, gaps, stale),
    coverage,
    gaps,
    stale,
    changes: overnightChanges(changes),
    domainCounts: domainCounts(signals),
    actions,
    sections: Object.freeze(sections),
    totals: Object.freeze({
      signals: signals.length,
      critical: critical.filter(item => item.attention.band === 'CRITICAL').length,
      urgent: critical.filter(item => item.attention.band === 'URGENT').length,
      actionable: actions.length,
      evidenceGaps: Number(gaps.count || gaps.items?.length || 0)
    }),
    totalSignals: signals.length
  });
}
