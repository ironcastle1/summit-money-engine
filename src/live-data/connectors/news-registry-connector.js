export class NewsRegistryConnector {
  constructor(options = {}) {
    this.registry = options.registry;
    this.sources = Array.isArray(options.sources) ? options.sources : null;
  }

  async fetch() {
    const snapshot = await this.registry.search({
      hours: 48,
      limit: 300,
      sources: this.sources || undefined
    });
    return {
      records: snapshot.articles,
      observedAt: snapshot.generatedAt,
      metadata: {
        sourceIds: this.sources || this.registry.ids(),
        rawCount: snapshot.rawCount,
        articleCount: snapshot.articleCount,
        sources: snapshot.sources
      }
    };
  }
}
