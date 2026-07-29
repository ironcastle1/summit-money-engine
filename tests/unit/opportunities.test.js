import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenceScore, combineEvidence } from '../../src/domain/opportunities/evidence-grade.js';
import { normalizeOpportunity } from '../../src/domain/opportunities/opportunity-schema.js';
import { fromMarketAnalysis } from '../../src/domain/opportunities/market-opportunity.js';
import { fromEvent } from '../../src/domain/opportunities/event-opportunity.js';
import { fromPredictionMarket } from '../../src/domain/opportunities/prediction-opportunity.js';
import { fuseOpportunities } from '../../src/domain/opportunities/fusion.js';
import { exposureProfile, applyExposurePenalty } from '../../src/domain/opportunities/exposure.js';
import { filterOpportunities } from '../../src/domain/opportunities/filter.js';

const now = new Date().toISOString();

function marketAnalysis(overrides = {}) {
  return {
    available: true,
    asset: { id: 'btc-usd', symbol: 'BTC/USD', name: 'Bitcoin', assetClass: 'crypto' },
    quote: { price: 100000, quoteVolume24h: 10_000_000_000 },
    timeframe: '1h',
    generatedAt: now,
    lastCandleAt: now,
    signal: { score: 72, coverage: 0.9 },
    risk: { score: 38 },
    regime: { label: 'TREND_UP' },
    opportunity: { available: true, score: 74, liquidity: 96 },
    outcomes: [{ available: true, label: '6h', riseProbability: 0.68, confidence: 78, sampleSize: 54, medianReturn: 0.018, probabilityRange90: { lower: 0.57, upper: 0.77 }, returnRange80: { lower: -0.025, upper: 0.061 } }],
    source: { source: 'binance' },
    ...overrides
  };
}

test('evidence grading rewards source, sample, freshness, coverage, and narrow intervals', () => {
  const strong = evidenceScore({ sourceCount: 4, sampleSize: 70, ageMinutes: 2, maximumUsefulMinutes: 90, coverage: 0.95, intervalWidth: 0.12 });
  const weak = evidenceScore({ sourceCount: 1, sampleSize: 5, ageMinutes: 80, maximumUsefulMinutes: 90, coverage: 0.35, intervalWidth: 0.6 });
  assert.equal(strong.available, true);
  assert.ok(strong.score > weak.score);
  assert.ok(['A', 'B'].includes(strong.grade));
  assert.ok(['C', 'D'].includes(weak.grade));
  const combined = combineEvidence([strong, weak]);
  assert.equal(combined.count, 2);
  assert.ok(combined.score <= strong.score && combined.score >= weak.score);
});

test('market analysis becomes a quantified market opportunity', () => {
  const opportunity = fromMarketAnalysis(marketAnalysis());
  assert.equal(opportunity.kind, 'MARKET');
  assert.equal(opportunity.assetId, 'btc-usd');
  assert.equal(opportunity.direction, 'RISE');
  assert.equal(opportunity.probability, 0.68);
  assert.ok(opportunity.score > 60);
  assert.notEqual(opportunity.evidenceGrade, 'N/A');
  assert.equal(opportunity.metadata.interval90.lower, 0.57);
});

test('event opportunity rescales the five-point event severity scale', () => {
  const opportunity = fromEvent({
    id: 'event-1', source: 'USGS', title: 'Strong earthquake', category: 'earthquake',
    lat: 35, lon: 140, time: now, updatedAt: now, severity: 4.5
  });
  assert.equal(opportunity.kind, 'EVENT');
  assert.equal(opportunity.severity, 90);
  assert.ok(opportunity.score > 45);
  assert.ok(opportunity.tags.includes('GOLD-USD'));
});

test('prediction market opportunity uses probability, volume, and liquidity', () => {
  const opportunity = fromPredictionMarket({
    id: 'p1', question: 'Will event happen?', category: 'politics', probability: 0.73,
    volume: 2_000_000, liquidity: 400_000, change24h: 0.04, updatedAt: now
  });
  assert.equal(opportunity.kind, 'PREDICTION');
  assert.equal(opportunity.direction, 'YES');
  assert.equal(opportunity.probability, 0.73);
  assert.ok(opportunity.score > 30);
});

test('fusion creates composite opportunities only from cross-kind overlap', () => {
  const market = fromMarketAnalysis(marketAnalysis());
  const event = normalizeOpportunity({
    kind: 'EVENT', id: 'e1', title: 'Energy disruption', direction: 'WATCH', score: 78,
    confidence: 72, risk: 65, evidenceScore: 70, evidenceGrade: 'B', category: 'energy',
    tags: ['btc-usd', 'energy'], sources: ['GDACS'], generatedAt: now, observedAt: now
  });
  const prediction = normalizeOpportunity({
    kind: 'PREDICTION', id: 'p1', title: 'Energy market closes above target', direction: 'RISE', score: 69,
    confidence: 68, risk: 42, probability: 0.66, evidenceScore: 65, evidenceGrade: 'C',
    tags: ['btc-usd', 'energy'], sources: ['POLYMARKET'], generatedAt: now, observedAt: now
  });
  const result = fuseOpportunities({ market: [market], events: [event], predictions: [prediction], filters: { minimumScore: 0, minimumConfidence: 0, maximumRisk: 100, limit: 20 } });
  assert.ok(result.opportunities.some(item => item.kind === 'COMPOSITE'));
  assert.equal(result.totals.market, 1);
  assert.equal(result.totals.events, 1);
  assert.equal(result.totals.predictions, 1);
  assert.ok(result.exposure.count >= 3);
});

test('filters and exposure penalties are deterministic and fail closed', () => {
  const items = [
    normalizeOpportunity({ kind: 'MARKET', id: 'a', title: 'A', assetId: 'btc-usd', direction: 'RISE', score: 80, confidence: 75, risk: 35, liquidity: 90, generatedAt: now }),
    normalizeOpportunity({ kind: 'MARKET', id: 'b', title: 'B', assetId: 'btc-usd', direction: 'RISE', score: 78, confidence: 70, risk: 45, liquidity: 80, generatedAt: now }),
    normalizeOpportunity({ kind: 'EVENT', id: 'c', title: 'C', category: 'storm', direction: 'WATCH', score: 55, confidence: 60, risk: 75, generatedAt: now })
  ];
  const penalized = applyExposurePenalty(items);
  assert.equal(penalized[0].exposurePenalty, 0);
  assert.equal(penalized[1].exposurePenalty, 7);
  const filtered = filterOpportunities(penalized, { minimumScore: 60, minimumConfidence: 65, maximumRisk: 50, kinds: ['MARKET'], directions: ['RISE'], limit: 10 });
  assert.equal(filtered.length, 2);
  const profile = exposureProfile(filtered);
  assert.equal(profile.largestExposure.key, 'ASSET:btc-usd');
  assert.equal(profile.largestExposure.scoreShare, 1);
});
