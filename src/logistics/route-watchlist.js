export class RouteWatchlist {
  constructor(repository) { this.repository = repository; }
  async list(ownerId) { return this.repository.list(ownerId); }
  async add(ownerId, item) {
    const normalized = Object.freeze({ id: String(item.id || `watch-${Date.now()}`), ownerId, routeId: String(item.routeId || '').toLowerCase(), name: String(item.name || item.routeId || 'Route watch'), thresholds: Object.freeze({ riskScore: Number(item.thresholds?.riskScore ?? 60), etaChangeHours: Number(item.thresholds?.etaChangeHours ?? 12), costChangePct: Number(item.thresholds?.costChangePct ?? 15) }), enabled: item.enabled !== false, createdAt: item.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    return this.repository.save(ownerId, normalized);
  }
  async remove(ownerId, id) { return this.repository.remove(ownerId, id); }
}
