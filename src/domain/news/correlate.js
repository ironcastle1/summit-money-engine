import { stableId } from '../../core/ids.js';
import { clamp, mean, round } from '../../core/numbers.js';
import { HOUR_MS, toTimestamp } from '../../core/time.js';
import { articleSimilarity, canonicalUrl } from './deduplicate.js';
import { sourceProfile } from './reliability.js';
import { queryTerms } from './text.js';
import { extractClaims } from './claims.js';
import { analyseClaimAgreement } from './claim-agreement.js';
import { burstMetrics } from './burst.js';

class DisjointSet {
  constructor(size) { this.parent = Array.from({ length: size }, (_, index) => index); this.rank = Array(size).fill(0); }
  find(index) { if (this.parent[index] !== index) this.parent[index] = this.find(this.parent[index]); return this.parent[index]; }
  union(left, right) {
    const a = this.find(left); const b = this.find(right); if (a === b) return;
    if (this.rank[a] < this.rank[b]) this.parent[a] = b;
    else if (this.rank[a] > this.rank[b]) this.parent[b] = a;
    else { this.parent[b] = a; this.rank[a] += 1; }
  }
}

function engagement(article) {
  const value = article.engagement || {};
  return value.likes + value.reposts * 2 + value.replies * 1.2 + value.quotes * 1.5 + Math.log10(value.views + 1) * 10;
}

function primaryArticle(group) {
  return [...group].sort((left, right) => {
    const leftReliability = sourceProfile(left.sourceDomain, left.sourceType).score;
    const rightReliability = sourceProfile(right.sourceDomain, right.sourceType).score;
    return rightReliability - leftReliability || engagement(right) - engagement(left) || toTimestamp(right.publishedAt) - toTimestamp(left.publishedAt);
  })[0];
}

function velocity(group, now) {
  const windows = [1, 3, 6, 12, 24];
  const counts = Object.fromEntries(windows.map(hours => [hours, group.filter(article => now - toTimestamp(article.publishedAt) <= hours * HOUR_MS).length]));
  const recentRate = counts[3] / 3;
  const priorCount = group.filter(article => {
    const age = now - toTimestamp(article.publishedAt);
    return age > 3 * HOUR_MS && age <= 12 * HOUR_MS;
  }).length;
  const priorRate = priorCount / 9;
  const acceleration = priorRate > 0 ? (recentRate - priorRate) / priorRate * 100 : recentRate > 0 ? null : 0;
  return { counts, recentPerHour: round(recentRate, 2), priorPerHour: round(priorRate, 2), accelerationPct: Number.isFinite(acceleration) ? round(clamp(acceleration, -1000, 1000)) : null };
}

function verification(group) {
  const domains = [...new Set(group.map(article => article.sourceDomain).filter(Boolean))];
  const types = [...new Set(group.map(article => article.sourceType).filter(Boolean))];
  const profiles = domains.map(domain => sourceProfile(domain));
  const independentSources = domains.length;
  const rated = profiles.filter(profile => profile.rated);
  const averageReliability = profiles.length ? mean(profiles.map(profile => profile.score)) : 0;
  const corroboration = clamp((independentSources - 1) / 4, 0, 1);
  const diversity = clamp(types.length / 3, 0, 1);
  const ratedRatio = profiles.length ? rated.length / profiles.length : 0;
  const verificationScore = round(clamp(averageReliability * 0.5 + corroboration * 30 + diversity * 10 + ratedRatio * 10, 0, 100));
  const state = independentSources >= 4 && verificationScore >= 75 ? 'CORROBORATED' : independentSources >= 2 && verificationScore >= 58 ? 'SUPPORTED' : independentSources === 1 ? 'SINGLE_SOURCE' : 'UNVERIFIED';
  return { score: verificationScore, state, independentSources, sourceDomains: domains, sourceTypes: types, averageReliability: round(averageReliability), ratedSources: rated.length };
}

export function correlateArticles(articles, options = {}) {
  const timeHours = options.timeHours ?? 36;
  const threshold = options.threshold ?? 0.46;
  const now = options.now || Date.now();
  const set = new DisjointSet(articles.length);
  for (let left = 0; left < articles.length; left += 1) {
    for (let right = left + 1; right < articles.length; right += 1) {
      if (articles[left].category !== articles[right].category) continue;
      const timeDelta = Math.abs(toTimestamp(articles[left].publishedAt) - toTimestamp(articles[right].publishedAt)) / HOUR_MS;
      if (timeDelta > timeHours) continue;
      if (canonicalUrl(articles[left].url) && canonicalUrl(articles[left].url) === canonicalUrl(articles[right].url)) { set.union(left, right); continue; }
      if (articleSimilarity(articles[left], articles[right]) >= threshold) set.union(left, right);
    }
  }
  const groups = new Map();
  articles.forEach((article, index) => {
    const root = set.find(index);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(article);
  });
  return [...groups.values()].map(group => {
    const primary = primaryArticle(group);
    const verify = verification(group);
    const speed = velocity(group, now);
    const newest = Math.max(...group.map(article => toTimestamp(article.publishedAt)));
    const oldest = Math.min(...group.map(article => toTimestamp(article.publishedAt)));
    const totalEngagement = group.reduce((sum, article) => sum + engagement(article), 0);
    const claims = group.flatMap(article => extractClaims(article));
    const claimAgreement = analyseClaimAgreement(claims);
    const burst = burstMetrics(group, { now, recentHours: 3, baselineHours: 21 });
    const agreementBoost = Number.isFinite(claimAgreement.score) ? (claimAgreement.score - 50) * 0.08 : 0;
    const urgency = clamp((group.length / 8) * 30 + Math.log10(totalEngagement + 1) * 10 + (24 - Math.min(24, (now - newest) / HOUR_MS)) / 24 * 25 + burst.score * 0.25 + agreementBoost, 0, 100);
    return Object.freeze({
      id: stableId('story', primary.category, ...group.map(article => article.id).sort()),
      title: primary.title,
      summary: primary.summary,
      category: primary.category,
      primaryArticleId: primary.id,
      publishedAt: new Date(newest).toISOString(),
      firstSeenAt: new Date(oldest).toISOString(),
      ageMinutes: Math.max(0, Math.round((now - newest) / 60_000)),
      articleCount: group.length,
      countries: Object.freeze([...new Set(group.flatMap(article => article.countries))]),
      entities: Object.freeze([...new Set(group.flatMap(article => article.entities))].slice(0, 30)),
      tickers: Object.freeze([...new Set(group.flatMap(article => article.tickers))]),
      keywords: Object.freeze(queryTerms(group.map(article => `${article.title} ${article.summary}`).join(' '), 14)),
      verification: Object.freeze(verify),
      velocity: Object.freeze(speed),
      urgencyScore: round(urgency),
      engagementScore: round(totalEngagement),
      burst,
      claims: Object.freeze(claims.slice(0, 40)),
      claimAgreement,
      sources: Object.freeze(group.map(article => ({ articleId: article.id, name: article.sourceName, domain: article.sourceDomain, type: article.sourceType, url: article.url, publishedAt: article.publishedAt, reliability: sourceProfile(article.sourceDomain, article.sourceType).score }))),
      articleIds: Object.freeze(group.map(article => article.id))
    });
  }).sort((left, right) => right.urgencyScore - left.urgencyScore || right.verification.score - left.verification.score || toTimestamp(right.publishedAt) - toTimestamp(left.publishedAt));
}
