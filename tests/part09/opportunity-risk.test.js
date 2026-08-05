import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAsset } from '../../src/market-intelligence/asset-analyzer.js';
import { calculateRiskScore } from '../../src/market-intelligence/risk-score.js';
import { calculateOpportunityScore } from '../../src/market-intelligence/opportunity-score.js';
import { rankOpportunities } from '../../src/market-intelligence/opportunity-ranker.js';
import { assetInput } from './fixtures.js';
test('asset analysis produces transparent risk and opportunity objects', () => {
  const input = assetInput('oil', { drift: 0.004, volatility: 0.002 });
  const analysis = analyzeAsset(input);
  assert.ok(analysis.risk.score >= 0 && analysis.risk.score <= 100);
  assert.ok(analysis.opportunity.score >= 0 && analysis.opportunity.score <= 100);
  assert.equal(analysis.opportunity.disclaimer.includes('not investment advice'), true);
});
test('risk increases with volatility and weak liquidity', () => {
  const result = calculateRiskScore({ volatility: { score: 90 }, drawdown: { currentPercent: -20 }, liquidity: { score: 10 }, evidence: { score: 50 } });
  assert.ok(result.score >= 50);
});
test('opportunity score is bounded', () => {
  const result = calculateOpportunityScore({ trend: { score: 90 }, momentum: { score: 90 }, liquidity: { score: 90 }, evidence: { score: 90 }, risk: { score: 10 }, catalysts: [{ strength: 90, confidence: 90 }] });
  assert.ok(result.score <= 100 && result.score >= 0);
});
test('ranking favours higher score and lower risk', () => {
  const ranked = rankOpportunities([{ id: 'a', score: 70, riskScore: 20 }, { id: 'b', score: 80, riskScore: 90 }, { id: 'c', score: 75, riskScore: 30 }], { maximumRisk: 50 });
  assert.deepEqual(ranked.map(item => item.id), ['c', 'a']);
});
