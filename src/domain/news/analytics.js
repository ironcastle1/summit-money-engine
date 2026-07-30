import { clamp, mean, round } from '../../core/numbers.js';
import { HOUR_MS, toTimestamp } from '../../core/time.js';

function topCounts(values, limit = 12) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, limit);
}

function timeSeries(articles, hours, now) {
  const bucketHours = hours <= 12 ? 1 : hours <= 48 ? 3 : 6;
  const bucketMs = bucketHours * HOUR_MS;
  const bucketCount = Math.ceil(hours / bucketHours);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const end = now - (bucketCount - index - 1) * bucketMs;
    return { start: new Date(end - bucketMs).toISOString(), end: new Date(end).toISOString(), count: 0, social: 0, news: 0 };
  });
  for (const article of articles) {
    const age = now - toTimestamp(article.publishedAt);
    if (age < 0 || age > hours * HOUR_MS) continue;
    const reverseIndex = Math.floor(age / bucketMs);
    const index = bucketCount - reverseIndex - 1;
    if (!buckets[index]) continue;
    buckets[index].count += 1;
    if (article.sourceType === 'SOCIAL') buckets[index].social += 1;
    else buckets[index].news += 1;
  }
  return { bucketHours, buckets };
}

function coverage(stories) {
  if (!stories.length) return { corroboratedPct: null, supportedPct: null, singleSourcePct: null, meanVerification: null, meanSourceCount: null };
  const counts = state => stories.filter(story => story.verification.state === state).length;
  return {
    corroboratedPct: round(counts('CORROBORATED') / stories.length * 100),
    supportedPct: round(counts('SUPPORTED') / stories.length * 100),
    singleSourcePct: round(counts('SINGLE_SOURCE') / stories.length * 100),
    meanVerification: round(mean(stories.map(story => story.verification.score))),
    meanSourceCount: round(mean(stories.map(story => story.verification.independentSources)), 2)
  };
}

function velocityIndex(stories) {
  if (!stories.length) return null;
  const values = stories.map(story => {
    const acceleration = story.velocity.accelerationPct;
    const speed = Math.min(1, story.velocity.recentPerHour / 5);
    const boost = acceleration === null ? 0.25 : clamp((acceleration + 100) / 400, 0, 1);
    return speed * 0.65 + boost * 0.35;
  });
  return round(mean(values) * 100);
}

export function newsAnalytics(articles, stories, options = {}) {
  const now = options.now || Date.now();
  const hours = options.hours || 24;
  return Object.freeze({
    articleCount: articles.length,
    storyCount: stories.length,
    sourceCount: new Set(articles.map(article => article.sourceDomain).filter(Boolean)).size,
    socialCount: articles.filter(article => article.sourceType === 'SOCIAL').length,
    newsCount: articles.filter(article => article.sourceType !== 'SOCIAL').length,
    velocityIndex: velocityIndex(stories),
    coverage: Object.freeze(coverage(stories)),
    categories: Object.freeze(topCounts(articles.map(article => article.category))),
    countries: Object.freeze(topCounts(articles.flatMap(article => article.countries))),
    entities: Object.freeze(topCounts(articles.flatMap(article => article.entities), 16)),
    tickers: Object.freeze(topCounts(articles.flatMap(article => article.tickers), 16)),
    sources: Object.freeze(topCounts(articles.map(article => article.sourceDomain), 16)),
    timeline: Object.freeze(timeSeries(articles, hours, now))
  });
}
