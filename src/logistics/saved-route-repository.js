export class MemorySavedRouteRepository {
  constructor() { this.routes = new Map(); this.watchlists = new Map(); }
  key(ownerId, id) { return `${String(ownerId)}:${String(id)}`; }
  async saveRoute(ownerId, route) { const value = Object.freeze({ ...route, ownerId, updatedAt: new Date().toISOString() }); this.routes.set(this.key(ownerId, value.id), value); return value; }
  async route(ownerId, id) { return this.routes.get(this.key(ownerId, id)) || null; }
  async listRoutes(ownerId) { return [...this.routes.values()].filter(route => route.ownerId === ownerId).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)); }
  async removeRoute(ownerId, id) { return this.routes.delete(this.key(ownerId, id)); }
  async list(ownerId) { return [...(this.watchlists.get(String(ownerId)) || [])]; }
  async save(ownerId, item) { const key = String(ownerId); const current = this.watchlists.get(key) || []; const next = [...current.filter(value => value.id !== item.id), item]; this.watchlists.set(key, next); return item; }
  async remove(ownerId, id) { const key = String(ownerId); const current = this.watchlists.get(key) || []; const next = current.filter(value => value.id !== id); this.watchlists.set(key, next); return next.length !== current.length; }
}
