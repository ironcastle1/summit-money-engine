export function rankOpportunities(values = [], options = {}) {
  const maximumRisk = Number(options.maximumRisk ?? 100);
  const minimumScore = Number(options.minimumScore ?? 0);
  const directions = new Set((options.directions || []).map(value => String(value).toUpperCase()));
  const ranked = values
    .filter(item => Number(item.score) >= minimumScore)
    .filter(item => Number(item.riskScore) <= maximumRisk)
    .filter(item => !directions.size || directions.has(String(item.direction).toUpperCase()))
    .sort((a, b) => Number(b.score) - Number(a.score) || Number(a.riskScore) - Number(b.riskScore));
  return Object.freeze(ranked.map((item, index) => Object.freeze({ ...item, rank: index + 1 })).slice(0, Number(options.limit) || 100));
}
