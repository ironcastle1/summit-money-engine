export class AuditRepository {
  constructor(store, options = {}) { this.store = store; this.maximumEntries = options.maximumEntries || 20_000; }
  async append(event) { return this.store.update(doc => { doc.audit.push(event); if (doc.audit.length > this.maximumEntries) doc.audit.splice(0, doc.audit.length - this.maximumEntries); return event; }); }
  async list(options = {}) {
    const doc = await this.store.read();
    let rows = [...doc.audit];
    if (options.actorUserId) rows = rows.filter(row => row.actorUserId === options.actorUserId);
    if (options.action) rows = rows.filter(row => row.action === options.action);
    return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, options.limit || 200);
  }
}
