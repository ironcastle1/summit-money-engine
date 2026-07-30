import test from 'node:test';
import assert from 'node:assert/strict';
import { createArticle } from '../../src/domain/news/article-schema.js';
import { extractClaims } from '../../src/domain/news/claims.js';
import { analyseClaimAgreement } from '../../src/domain/news/claim-agreement.js';
import { burstMetrics } from '../../src/domain/news/burst.js';
import { buildProvenanceGraph } from '../../src/domain/news/provenance-graph.js';
import { correlateArticles } from '../../src/domain/news/correlate.js';

const now = Date.parse('2026-07-29T18:00:00Z');
function item(sourceDomain, title, summary, minutes = 10) {
  return createArticle({ title, summary, sourceName: sourceDomain, sourceDomain, url: `https://${sourceDomain}/${encodeURIComponent(title)}`, publishedAt: now - minutes * 60_000 }, now);
}

test('claim extraction captures numeric, directional, metric, and attribution fields', () => {
  const article = item('reuters.com', 'Oil exports fall 25%', 'Officials said exports dropped to 1.5 million barrels per day.');
  const claims = extractClaims(article);
  assert.ok(claims.length >= 1);
  assert.ok(claims.some(claim => claim.direction === 'DOWN'));
  assert.ok(claims.some(claim => claim.metric === 'VOLUME'));
  assert.ok(claims.flatMap(claim => claim.values).some(value => value.type === 'PERCENT' && value.value === 25));
});

test('claim agreement flags opposing directional and materially different numeric claims', () => {
  const down = extractClaims(item('reuters.com', 'Oil output falls 20%', 'Production decreased to 1 million barrels.'));
  const up = extractClaims(item('example.com', 'Oil output rises 60%', 'Production increased to 3 million barrels.'));
  const result = analyseClaimAgreement([...down, ...up]);
  assert.ok(result.comparisonCount >= 1);
  assert.ok(result.conflictCount >= 1);
  assert.ok(result.agreementPct < 100);
});

test('burst metrics compare recent publication rate with a longer baseline', () => {
  const articles = [
    item('a.com', 'Pipeline attack one', '', 10), item('b.com', 'Pipeline attack two', '', 20), item('c.com', 'Pipeline attack three', '', 30),
    item('d.com', 'Old item', '', 600)
  ];
  const burst = burstMetrics(articles, { now, recentHours: 3, baselineHours: 21 });
  assert.equal(burst.recentCount, 3);
  assert.equal(burst.baselineCount, 1);
  assert.ok(burst.score >= 50);
  assert.ok(['ELEVATED', 'HIGH', 'EXTREME'].includes(burst.state));
});

test('provenance graph links stories to sources, entities, countries, and assets', () => {
  const articles = [
    item('reuters.com', 'Iraq oil pipeline attack halts Brent exports', 'Iraq exports stop.', 10),
    item('bbc.co.uk', 'Attack halts Iraq oil pipeline exports', 'Brent supply affected.', 20)
  ];
  const stories = correlateArticles(articles, { now, threshold: 0.3 });
  const graph = buildProvenanceGraph(stories, articles);
  assert.ok(graph.nodes.some(node => node.type === 'SOURCE'));
  assert.ok(graph.nodes.some(node => node.type === 'STORY'));
  assert.ok(graph.edges.some(edge => edge.type === 'REPORTS'));
  assert.ok(Number.isFinite(graph.metrics.sourceDiversityScore));
  assert.ok(Number.isFinite(graph.metrics.largestSourceSharePct));
});

test('correlated stories expose claims, agreement, and burst state', () => {
  const articles = [
    item('reuters.com', 'Oil output falls 20% after pipeline attack', 'Exports stopped in Iraq.', 10),
    item('bbc.co.uk', 'Iraq pipeline attack cuts oil output by 20%', 'Exports halted.', 20)
  ];
  const story = correlateArticles(articles, { now, threshold: 0.3 })[0];
  assert.ok(story.claims.length >= 1);
  assert.ok(story.claimAgreement.claimCount >= 1);
  assert.ok(Number.isFinite(story.burst.score));
});
