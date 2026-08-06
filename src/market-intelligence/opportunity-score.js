import { clamp, round } from './numbers.js';
export function calculateOpportunityScore(analysis = {}) {
  const trend = Number(analysis.trend?.score || 50);
  const momentum = Number(analysis.momentum?.score || 50);
  const liquidity = Number(analysis.liquidity?.score || 50);
  const evidence = Number(analysis.evidence?.score || 50);
  const catalyst = Math.max(0, ...(analysis.catalysts || []).map(item => Number(item.strength || 0) * Number(item.confidence || 0) / 100));
  const relativeStrength = clamp(50 + Number(analysis.relativeStrength?.composite || 0) * 3, 0, 100);
  const risk = Number(analysis.risk?.score || 50);
  const directionalEdge = Math.max(Math.abs(trend - 50), Math.abs(momentum - 50)) * 2;
  const gross = directionalEdge * 0.24 + liquidity * 0.14 + evidence * 0.16 + catalyst * 0.2 + relativeStrength * 0.14 + (100 - risk) * 0.12;
  const score = clamp(gross, 0, 100);
  return Object.freeze({ score: round(score, 2), tier: score >= 85 ? 'EXCEPTIONAL' : score >= 72 ? 'STRONG' : score >= 58 ? 'ACTIONABLE' : score >= 42 ? 'WATCH' : 'PASS', components: Object.freeze({ directionalEdge: round(directionalEdge, 2), liquidity: round(liquidity, 2), evidence: round(evidence, 2), catalyst: round(catalyst, 2), relativeStrength: round(relativeStrength, 2), riskAdjustment: round(100 - risk, 2) }) });
}
