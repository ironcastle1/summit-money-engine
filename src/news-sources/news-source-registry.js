import { deduplicateArticles } from '../domain/news/deduplicate.js';

export class NewsSourceRegistry {
  #sources = new Map();
  #logger;

  constructor(options = {}) { this.#logger = options.logger; }

  register(source) {
    if (this.#sources.has(source.id)) throw new Error(`Duplicate news source id: ${source.id}`);
    this.#sources.set(source.id, source);
    return this;
  }

  ids() { return [...this.#sources.keys()]; }
  health() { return Object.fromEntries([...this.#sources].map(([id, source]) => [id, source.health()])); }

  async search(options = {}) {
    const requested = Array.isArray(options.sources) && options.sources.length ? new Set(options.sources.map(String)) : null;
    const selected = [...this.#sources.values()].filter(source => !requested || requested.has(source.id));
    const startedAt = Date.now();
    const results = await Promise.all(selected.map(source => source.search(options)));
    const raw = results.flatMap(result => result.articles);
    const articles = deduplicateArticles(raw, { threshold: options.deduplicationThreshold ?? 0.72 });
    const sources = Object.fromEntries(selected.map((source, index) => [source.id, results[index].health]));
    const snapshot = Object.freeze({
      articles: Object.freeze(articles),
      sources: Object.freeze(sources),
      rawCount: raw.length,
      articleCount: articles.length,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      query: options.query || ''
    });
    this.#logger?.info('news_sources.search_ready', { rawCount: raw.length, articleCount: articles.length, durationMs: snapshot.durationMs });
    return snapshot;
  }
}
