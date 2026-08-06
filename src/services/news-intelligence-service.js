import { correlateArticles } from '../domain/news/correlate.js';
import { linkStoriesToEvents } from '../domain/news/event-linker.js';
import { storyImpacts } from '../domain/news/impact.js';
import { newsAnalytics } from '../domain/news/analytics.js';
import { sourceProfile } from '../domain/news/reliability.js';
import { toTimestamp } from '../core/time.js';
import { buildProvenanceGraph } from '../domain/news/provenance-graph.js';

function textMatch(article, query) {
  if (!query) return true;
  const terms = String(query).toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = `${article.title} ${article.summary} ${article.entities.join(' ')} ${article.tickers.join(' ')}`.toLowerCase();
  return terms.every(term => haystack.includes(term));
}

function filterArticles(articles, options) {
  const categories = new Set((options.categories || []).map(value => String(value).toLowerCase()));
  const sourceTypes = new Set((options.sourceTypes || []).map(value => String(value).toUpperCase()));
  const countries = new Set((options.countries || []).map(value => String(value).toUpperCase()));
  const tickers = new Set((options.tickers || []).map(value => String(value).toUpperCase()));
  const effectiveHours = Math.min(48, Math.max(1, Number(options.hours || 24)));
  const cutoff = Date.now() - effectiveHours * 3_600_000;
  return articles.filter(article => {
    if (toTimestamp(article.publishedAt) < cutoff) return false;
    if (String(article.category || '').toLowerCase() === 'earthquake') return false;
    if (/\b(earthquake|aftershock|seismic|quake|magnitude\s*[0-9])\b/i.test(`${article.title || ''} ${article.summary || ''}`)) return false;
    if (categories.size && !categories.has(article.category)) return false;
    if (sourceTypes.size && !sourceTypes.has(article.sourceType)) return false;
    if (countries.size && !article.countries.some(country => countries.has(country.toUpperCase()))) return false;
    if (tickers.size && !article.tickers.some(ticker => tickers.has(ticker.toUpperCase()))) return false;
    return textMatch(article, options.filterQuery || '');
  });
}

function publicArticle(article) {
  const reliability = sourceProfile(article.sourceDomain, article.sourceType);
  return { ...article, reliability };
}

export class NewsIntelligenceService {
  constructor(options) {
    this.registry = options.registry;
    this.events = options.events;
    this.lastSnapshot = null;
  }

  async search(options = {}) {
    const sourceSnapshot = await this.registry.search({
      query: options.sourceQuery || options.query || '',
      hours: Math.min(48, Math.max(1, Number(options.hours || 24))),
      limit: Math.min(250, Math.max(20, Number(options.sourceLimit || 100))),
      sources: options.sources,
      sort: options.sort || 'latest'
    });
    const articles = filterArticles(sourceSnapshot.articles, { ...options, filterQuery: options.filterQuery || '' });
    let stories = correlateArticles(articles, { timeHours: Math.min(72, Math.max(6, options.correlationHours || 36)), threshold: options.correlationThreshold ?? 0.46 });
    const minimumVerification = Math.max(0, Math.min(100, Number(options.minimumVerification || 0)));
    if (minimumVerification > 0) stories = stories.filter(story => story.verification.score >= minimumVerification);
    const eventSnapshot = options.includeEventLinks === false ? { events: [] } : await this.events.globalSnapshot({ maxAgeMs: 30_000, limit: 5000 });
    const links = linkStoriesToEvents(stories, eventSnapshot.events || [], { threshold: 0.42, maximumLinks: 5 });
    const enrichedStories = stories.map(story => Object.freeze({
      ...story,
      eventLinks: Object.freeze(links.get(story.id) || []),
      impacts: Object.freeze(storyImpacts(story))
    }));
    const limit = Math.max(1, Math.min(200, Number(options.limit || 80)));
    const provenance = buildProvenanceGraph(enrichedStories, articles);
    const output = Object.freeze({
      articles: Object.freeze(articles.slice(0, Math.min(500, limit * 5)).map(publicArticle)),
      stories: Object.freeze(enrichedStories.slice(0, limit)),
      analytics: Object.freeze({ ...newsAnalytics(articles, enrichedStories, { hours: Math.min(48, Math.max(1, Number(options.hours || 24))) }), provenance: provenance.metrics }),
      provenance: Object.freeze({ nodes: provenance.nodes.slice(0, 300), edges: provenance.edges.slice(0, 600), metrics: provenance.metrics }),
      sources: sourceSnapshot.sources,
      rawCount: sourceSnapshot.rawCount,
      articleCount: articles.length,
      storyCount: enrichedStories.length,
      generatedAt: new Date().toISOString(),
      durationMs: sourceSnapshot.durationMs,
      query: options.query || ''
    });
    this.lastSnapshot = output;
    return output;
  }

  health() { return this.registry.health(); }
  snapshot() { return this.lastSnapshot; }
}
