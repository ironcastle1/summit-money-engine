import { scheduleDue } from './schedule-policy.js';
import { frozen } from './utilities.js';

export class PublicationScheduler {
  constructor(options = {}) {
    this.publications = options.publications;
    this.editions = options.editions;
    this.generate = options.generate;
    this.publish = options.publish;
  }

  async due(owner, now = new Date()) {
    const publications = await this.publications.list(owner, { state: 'ACTIVE', limit: 1000 });
    const editions = await this.editions.list(owner, { limit: 10000 });
    return frozen(publications.filter(publication => {
      const last = editions.filter(edition => edition.publicationId === publication.id && edition.publishedAt).sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))[0];
      return scheduleDue(publication.schedule || { cadence: publication.cadence }, last?.publishedAt, now);
    }));
  }

  async tick(owner, now = new Date()) {
    const due = await this.due(owner, now);
    const results = [];
    for (const publication of due) {
      const edition = await this.generate(owner, { publicationId: publication.id, scheduledFor: new Date(now).toISOString() });
      results.push(await this.publish(owner, edition.id, { scheduled: true }));
    }
    return frozen({ due: due.length, processed: results.length, results, time: new Date(now).toISOString() });
  }
}
