export class SessionRepository {
  constructor(store) { this.store = store; }
  async find(hash) { const doc = await this.store.read(); return doc.sessions.find(item => item.tokenHash === hash) || null; }
  async create(session) { return this.store.update(doc => { doc.sessions.push(session); return session; }); }
  async revoke(hash, at = new Date().toISOString()) { return this.store.update(doc => { const item = doc.sessions.find(value => value.tokenHash === hash); if (item) item.revokedAt = at; return item || null; }); }
  async revokeUser(userId, at = new Date().toISOString()) { return this.store.update(doc => { let count = 0; for (const item of doc.sessions) if (item.userId === userId && !item.revokedAt) { item.revokedAt = at; count += 1; } return count; }); }
  async purge(now = Date.now()) { return this.store.update(doc => { const before = doc.sessions.length; doc.sessions = doc.sessions.filter(item => !item.revokedAt && new Date(item.expiresAt).getTime() > now); return before - doc.sessions.length; }); }
}
