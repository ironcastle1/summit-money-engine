import {
  slug,
  clean
}
from './text.js';
export class ConflictWatchlist {
  constructor() {
    this.owners = new Map();
  }
  async list(owner = 'anonymous') {
    return Object.freeze([...(this.owners.get(owner) || [])]);
  }
  async add(owner = 'anonymous',
  input = {
  }) {
    const theatreId = slug(input.theatreId || input.id);
    const item = Object.freeze({
      id: input.watchId || `conflict-watch-${theatreId}`,
      theatreId,
      label: clean(input.label || theatreId,
      120),
      minimumRisk: Math.max(0,
      Math.min(100,
      Number(input.minimumRisk) || 60)),
      minimumEscalation: Math.max(0,
      Math.min(100,
      Number(input.minimumEscalation) || 55)),
      maximumConfidenceGap: Math.max(0,
      Math.min(100,
      Number(input.maximumConfidenceGap) || 70)),
      createdAt: new Date().toISOString()
    });
    const items = (this.owners.get(owner) || []).filter(value => value.id !== item.id);
    items.push(item);
    this.owners.set(owner,
    items);
    return item;
  }
  async remove(owner,
  id) {
    const items = this.owners.get(owner) || [],
    next = items.filter(item => item.id !== id);
    this.owners.set(owner,
    next);
    return next.length !== items.length;
  }
}
