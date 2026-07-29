const STORAGE_KEY = 'summit.market.watchlist.v1';
const DEFAULTS = ['btc-usd', 'eth-usd', 'sol-usd', 'bnb-usd', 'xrp-usd', 'ada-usd', 'doge-usd', 'avax-usd'];

export class MarketWatchlist {
  constructor() { this.ids = this.load(); }
  load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(parsed) && parsed.length) return [...new Set(parsed.map(String))].slice(0, 24);
    } catch {}
    return [...DEFAULTS];
  }
  save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.ids)); }
  list() { return [...this.ids]; }
  has(id) { return this.ids.includes(id); }
  toggle(id) {
    if (this.has(id)) this.ids = this.ids.filter(value => value !== id);
    else this.ids = [...this.ids, id].slice(-24);
    this.save();
    return this.has(id);
  }
  replace(ids) {
    this.ids = [...new Set(ids.map(String))].slice(0, 24);
    this.save();
  }
}
