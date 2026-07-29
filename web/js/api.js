window.API = {
  async json(path, options) {
    const res = await fetch(path, { headers: { Accept: "application/json", ...(options && options.headers || {}) }, ...(options || {}) });
    if (!res.ok) throw new Error(`${path} ${res.status}`);
    return res.json();
  },
  state() { return this.json("/api/state"); },
  mapData() { return this.json("/api/map-data"); },
  refresh() { return this.json("/api/refresh", { method: "POST" }); },
  place(lat, lng) { return this.json(`/api/place/intel?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`); },
  search(q) { return this.json(`/api/search?q=${encodeURIComponent(q)}`); },
  sources() { return this.json("/api/sources"); },
  liveBrief() { return this.json("/api/live-brief"); },
  markets() { return this.json("/api/markets"); },
  areaScan(payload) { return this.json("/api/area-scan", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload || {}) }); },
  v7Console() { return this.json("/api/v7/console"); },
  routeSafety(payload) { return this.json("/api/v7/route-safety", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload || {}) }); },
  watchEvaluate(payload) { return this.json("/api/v7/watch-evaluate", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload || {}) }); },
  offlinePack(payload) { return this.json("/api/v7/offline-pack", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload || {}) }); },
  threatMatrix(params = {}) { const q = new URLSearchParams(params); return this.json(`/api/v7/threat-matrix?${q.toString()}`); },
  featureMatrix() { return this.json("/api/v7/feature-matrix"); }
};
