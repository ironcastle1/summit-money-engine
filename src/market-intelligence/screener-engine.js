import { normalizeScreenRequest } from './validation.js';
const GRADE_RANK = Object.freeze({ A: 4, B: 3, C: 2, D: 1, UNRATED: 0 });
function searchable(item) {
  return [item.asset?.id, item.asset?.symbol, item.asset?.name, item.asset?.assetClass, ...(item.asset?.tags || [])].filter(Boolean).join(' ').toLowerCase();
}
function field(item, key) {
  const fields = {
    symbol: item.asset?.symbol,
    price: item.quote?.price,
    changePercent: item.quote?.changePercent,
    opportunityScore: item.opportunity?.score,
    riskScore: item.risk?.score,
    liquidityScore: item.liquidity?.score,
    momentumScore: item.momentum?.score,
    trendScore: item.trend?.score,
    evidenceGrade: GRADE_RANK[item.evidence?.grade || 'UNRATED']
  };
  return fields[key] ?? item[key] ?? 0;
}
export function runScreen(assets = [], request = {}) {
  const filters = normalizeScreenRequest(request);
  const gradeFloor = GRADE_RANK[filters.minimumEvidence] ?? 0;
  const result = assets
    .filter(item => !filters.query || searchable(item).includes(filters.query.toLowerCase()))
    .filter(item => !filters.assetClasses.length || filters.assetClasses.includes(String(item.asset?.assetClass || '').toUpperCase()))
    .filter(item => !filters.tags.length || filters.tags.every(tag => (item.asset?.tags || []).includes(tag)))
    .filter(item => !filters.regimes.length || filters.regimes.includes(String(item.regime?.regime || '').toUpperCase()))
    .filter(item => !filters.directions.length || filters.directions.includes(String(item.opportunity?.direction || '').toUpperCase()))
    .filter(item => Number(item.opportunity?.score || 0) >= filters.minimumOpportunity)
    .filter(item => Number(item.risk?.score || 0) <= filters.maximumRisk)
    .filter(item => Number(item.liquidity?.score || 0) >= filters.minimumLiquidity)
    .filter(item => (GRADE_RANK[item.evidence?.grade || 'UNRATED'] ?? 0) >= gradeFloor)
    .sort((left, right) => {
      const difference = Number(field(left, filters.sortBy)) - Number(field(right, filters.sortBy));
      return filters.sortDirection === 'asc' ? difference : -difference;
    })
    .slice(0, filters.limit);
  return Object.freeze({ filters, total: result.length, results: Object.freeze(result), generatedAt: new Date().toISOString() });
}
