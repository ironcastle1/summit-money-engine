import test from 'node:test';
import assert from 'node:assert/strict';
import { NewsIntelligenceService } from '../../src/services/news-intelligence-service.js';
import { createArticle } from '../../src/domain/news/article-schema.js';

const now = Date.now();
const articles = [
  createArticle({ title: 'Oil pipeline attack halts Iraq exports', summary: 'Brent rises after supply disruption', url: 'https://reuters.com/a', sourceDomain: 'reuters.com', sourceName: 'Reuters', publishedAt: now - 60_000 }),
  createArticle({ title: 'Iraq oil pipeline halted after attack', summary: 'Exports stopped', url: 'https://bbc.co.uk/b', sourceDomain: 'bbc.co.uk', sourceName: 'BBC', publishedAt: now - 120_000 }),
  createArticle({ title: 'Technology company releases product', summary: 'Routine release', url: 'https://example.com/c', sourceDomain: 'example.com', sourceName: 'Example', publishedAt: now - 180_000 })
];

const registry = {
  async search() { return { articles, sources: { fake: { state: 'ONLINE' } }, rawCount: articles.length, durationMs: 5 }; },
  health() { return { fake: { state: 'ONLINE' } }; }
};
const events = { async globalSnapshot() { return { events: [{ id: 'e1', title: 'Pipeline attacked in Iraq', category: 'conflict', country: 'Iraq', region: 'Basra', time: new Date(now - 60_000).toISOString(), lat: 30, lon: 47, source: 'ACLED' }] }; } };

test('news service filters, correlates, enriches, and stores the current snapshot', async () => {
  const service = new NewsIntelligenceService({ registry, events });
  const result = await service.search({ hours: 24, limit: 20, correlationThreshold: 0.3 });
  assert.equal(result.articleCount, 3);
  assert.ok(result.storyCount >= 2);
  const oil = result.stories.find(story => /pipeline/i.test(story.title));
  assert.ok(oil);
  assert.ok(oil.impacts.some(impact => impact.symbol === 'BRENT'));
  assert.ok(oil.eventLinks.length >= 1);
  assert.equal(service.snapshot(), result);
  assert.equal(service.health().fake.state, 'ONLINE');
});

test('news service applies source-type, category, country, ticker, and verification filters', async () => {
  const service = new NewsIntelligenceService({ registry, events });
  const result = await service.search({ hours: 24, categories: ['conflict'], countries: ['IQ'], tickers: ['BRENT'], minimumVerification: 0, includeEventLinks: false });
  assert.equal(result.articles.every(article => article.category === 'conflict'), true);
  assert.equal(result.articles.every(article => article.countries.includes('IQ')), true);
  assert.equal(result.articles.every(article => article.tickers.includes('BRENT')), true);
  assert.equal(result.stories.every(story => story.eventLinks.length === 0), true);
});
