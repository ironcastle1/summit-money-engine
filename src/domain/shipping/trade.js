import { clamp, round, sum } from '../../core/numbers.js';

export function normalizeTradeRecords(records) {
  return (records || []).map(record => ({
    period: String(record.period || record.refPeriodId || record.refYear || ''), reporterCode: String(record.reporterCode || record.reporterISO || ''),
    reporter: String(record.reporter || record.reporterDesc || ''), partnerCode: String(record.partnerCode || record.partnerISO || ''),
    partner: String(record.partner || record.partnerDesc || ''), flow: String(record.flow || record.flowDesc || ''),
    commodityCode: String(record.commodityCode || record.cmdCode || ''), commodity: String(record.commodity || record.cmdDesc || ''),
    valueUsd: Number(record.valueUsd ?? record.primaryValue), netWeightKg: Number(record.netWeightKg ?? record.netWgt), transportMode: String(record.transportMode || record.motDesc || '')
  })).filter(record => Number.isFinite(record.valueUsd));
}

export function aggregateTrade(records, field = 'partner') {
  const groups = new Map();
  for (const record of normalizeTradeRecords(records)) {
    const key = record[field] || 'Unknown';
    const current = groups.get(key) || { key, valueUsd: 0, netWeightKg: 0, records: 0 };
    current.valueUsd += record.valueUsd;
    if (Number.isFinite(record.netWeightKg)) current.netWeightKg += record.netWeightKg;
    current.records += 1;
    groups.set(key, current);
  }
  const total = sum([...groups.values()].map(item => item.valueUsd));
  return [...groups.values()].map(item => ({ ...item, sharePct: total ? round(item.valueUsd / total * 100, 2) : null })).sort((a, b) => b.valueUsd - a.valueUsd);
}

export function tradeConcentration(records, field = 'partner') {
  const groups = aggregateTrade(records, field);
  if (!groups.length) return { hhi: null, top1Pct: null, top3Pct: null, count: 0 };
  const hhi = sum(groups.map(item => (item.sharePct / 100) ** 2));
  return { hhi: round(hhi * 10000, 0), top1Pct: groups[0]?.sharePct || 0, top3Pct: round(sum(groups.slice(0, 3).map(item => item.sharePct)), 2), count: groups.length, band: hhi >= 0.25 ? 'HIGH' : hhi >= 0.15 ? 'MODERATE' : 'DIVERSE' };
}

export function exposureScore(input) {
  const routeRisk = clamp(Number(input.routeRisk || 0), 0, 100);
  const concentration = clamp(Number(input.concentrationPct || 0), 0, 100);
  const dependency = clamp(Number(input.dependencyPct || 0), 0, 100);
  const alternatives = Math.max(0, Number(input.alternativeCount || 0));
  const mitigation = clamp(alternatives * 7, 0, 28);
  return round(clamp(routeRisk * 0.48 + concentration * 0.27 + dependency * 0.25 - mitigation, 0, 100), 1);
}
