import test from 'node:test';
import assert from 'node:assert/strict';
import { createArticle } from '../../src/domain/news/article-schema.js';
import { classifyText, extractCountries, extractEntities, extractTickers, jaccardSimilarity, tokenSet } from '../../src/domain/news/text.js';
import { deduplicateArticles, articleSimilarity, canonicalUrl } from '../../src/domain/news/deduplicate.js';
import { correlateArticles } from '../../src/domain/news/correlate.js';
import { sourceProfile } from '../../src/domain/news/reliability.js';
import { storyImpacts } from '../../src/domain/news/impact.js';
import { newsAnalytics } from '../../src/domain/news/analytics.js';
import { linkStoriesToEvents } from '../../src/domain/news/event-linker.js';

const now = Date.parse('2026-07-29T18:00:00Z');
function article(overrides = {}) {
  return createArticle({ title: 'Oil pipeline halted after attack in Iraq', summary: 'Exports are disrupted and Brent prices rise.', url: 'https://example.com/story', sourceName: 'Example', sourceDomain: 'example.com', publishedAt: now - 30 * 60_000, ...overrides }, now);
}

test('text extraction classifies categories and named market references', () => {
  const text = 'Israel airstrike hits an oil pipeline in Iraq as Brent and $XLE rise';
  assert.equal(classifyText(text), 'conflict');
  assert.ok(extractCountries(text).includes('IL'));
  assert.ok(extractCountries(text).includes('IQ'));
  assert.ok(extractTickers(text).includes('BRENT'));
  assert.ok(extractTickers(text).includes('XLE'));
  assert.ok(extractEntities('Prime Minister John Smith met United Nations officials').includes('Prime Minister John Smith'));
  assert.ok(jaccardSimilarity(tokenSet('oil pipeline attack'), tokenSet('attack damages oil pipeline')) > 0.5);
});

test('article schema strips tracking parameters and derives structured fields', () => {
  const result = article({ url: 'https://example.com/story?utm_source=x&id=1', title: 'Ukraine conflict hits oil pipeline and Bitcoin' });
  assert.equal(result.category, 'conflict');
  assert.equal(result.sourceType, 'NEWS');
  assert.ok(result.url.includes('id=1'));
  assert.ok(!result.url.includes('utm_source'));
  assert.ok(result.countries.includes('UA'));
  assert.ok(result.tickers.includes('BTC'));
  assert.ok(Object.isFrozen(result));
});

test('article deduplication merges syndicated copies but preserves independent domains', () => {
  const first = article({ sourceDomain: 'reuters.com', sourceName: 'Reuters', url: 'https://reuters.com/world/oil-pipeline-attack?utm_source=test' });
  const second = article({ sourceDomain: 'example.net', sourceName: 'Example', url: 'https://example.net/oil-pipeline-attack', title: 'Attack halts oil pipeline in Iraq', publishedAt: now - 25 * 60_000 });
  assert.ok(articleSimilarity(first, second) > 0.5);
  const output = deduplicateArticles([first, second], { threshold: 0.5 });
  assert.equal(output.length, 1);
  assert.equal(output[0].metadata.sourceDomains.length, 2);
  assert.equal(canonicalUrl('https://www.site.com/a?utm_campaign=x'), 'site.com/a');
});

test('correlation creates a corroborated story with velocity and source evidence', () => {
  const items = [
    article({ sourceDomain: 'reuters.com', sourceName: 'Reuters', url: 'https://reuters.com/a', publishedAt: now - 10 * 60_000 }),
    article({ sourceDomain: 'apnews.com', sourceName: 'AP', url: 'https://apnews.com/b', title: 'Iraq oil pipeline halted after attack', publishedAt: now - 20 * 60_000 }),
    article({ sourceDomain: 'bbc.co.uk', sourceName: 'BBC', url: 'https://bbc.co.uk/c', title: 'Attack stops exports through Iraq oil pipeline', publishedAt: now - 30 * 60_000 }),
    article({ sourceDomain: 'ft.com', sourceName: 'FT', url: 'https://ft.com/d', title: 'Iraq pipeline attack disrupts oil exports', publishedAt: now - 40 * 60_000 })
  ];
  const stories = correlateArticles(items, { now, threshold: 0.34 });
  assert.equal(stories.length, 1);
  assert.equal(stories[0].articleCount, 4);
  assert.equal(stories[0].verification.state, 'CORROBORATED');
  assert.ok(stories[0].verification.score >= 75);
  assert.ok(stories[0].velocity.recentPerHour > 1);
});

test('source profiles fail to a neutral unrated score rather than invent authority', () => {
  assert.equal(sourceProfile('reuters.com').tier, 'A');
  assert.ok(sourceProfile('reuters.com').score > 85);
  assert.equal(sourceProfile('unknown.example').tier, 'UNRATED');
  assert.equal(sourceProfile('unknown.example').rated, false);
  assert.equal(sourceProfile('x.com', 'SOCIAL').tier, 'SOCIAL');
});

test('impact mapping preserves unclear direction when the text lacks a directional basis', () => {
  const story = correlateArticles([article({ title: 'Central bank announces policy decision', summary: 'Officials publish the scheduled statement.', category: 'economic' })], { now })[0];
  const impacts = storyImpacts(story);
  assert.ok(impacts.some(item => item.direction === 'UNCLEAR'));
  assert.ok(impacts.every(item => item.confidence <= 100));
});

test('news analytics produces coverage, rankings, and fixed time buckets', () => {
  const items = [article(), article({ sourceDomain: 'bbc.co.uk', url: 'https://bbc.co.uk/b', title: 'Attack halts Iraq oil exports' })];
  const stories = correlateArticles(items, { now, threshold: 0.3 });
  const analytics = newsAnalytics(items, stories, { now, hours: 24 });
  assert.equal(analytics.articleCount, 2);
  assert.ok(analytics.timeline.buckets.length >= 8);
  assert.equal(analytics.categories[0].name, 'conflict');
  assert.ok(Number.isFinite(analytics.coverage.meanVerification));
});

test('story-event links require category, title, country, and time evidence', () => {
  const story = correlateArticles([article({ countries: ['IQ'] })], { now })[0];
  const links = linkStoriesToEvents([story], [{ id: 'e1', title: 'Oil pipeline attacked in Iraq', category: 'conflict', country: 'Iraq', region: 'Basra', time: new Date(now - 60 * 60_000).toISOString(), lat: 30, lon: 47, source: 'ACLED' }], { threshold: 0.2 });
  assert.equal(links.get(story.id).length, 1);
  assert.ok(links.get(story.id)[0].confidence > 40);
});
