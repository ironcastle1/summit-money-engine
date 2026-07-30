const HEALTHY_STATES = new Set(['LIVE', 'READY', 'OK', 'ACTIVE', 'CONFIGURED']);
const NEUTRAL_STATES = new Set(['IDLE', 'NOT_CONFIGURED', 'UNKNOWN']);

function sourceScore(source = {}) {
  const state = String(source.state || 'UNKNOWN').toUpperCase();
  if (HEALTHY_STATES.has(state)) return 100;
  if (state === 'STALE') return 55;
  if (state === 'PARTIAL') return 65;
  if (state === 'RATE_LIMITED') return 40;
  if (NEUTRAL_STATES.has(state)) return state === 'NOT_CONFIGURED' ? null : 50;
  return 0;
}

function countDuplicates(records, key) {
  const seen = new Set();
  let duplicates = 0;
  for (const record of records || []) {
    const value = key(record);
    if (!value) continue;
    if (seen.has(value)) duplicates += 1;
    else seen.add(value);
  }
  return duplicates;
}

function coordinateProblems(records) {
  let invalid = 0;
  for (const record of records || []) {
    const lat = Number(record.lat ?? record.latitude ?? record.coordinates?.lat);
    const lon = Number(record.lon ?? record.lng ?? record.longitude ?? record.coordinates?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) invalid += 1;
  }
  return invalid;
}

function check(id, passed, details = {}, weight = 1) {
  return { id, status: passed ? 'PASS' : 'FAIL', weight, ...details };
}

function weightedScore(checks) {
  const total = checks.reduce((sum, item) => sum + item.weight, 0);
  const passed = checks.reduce((sum, item) => sum + (item.status === 'PASS' ? item.weight : item.status === 'WARN' ? item.weight * 0.5 : 0), 0);
  return total ? Math.round((passed / total) * 100) : 0;
}

export class DataQualityService {
  constructor(options = {}) {
    this.registries = options.registries || {};
    this.catalogs = options.catalogs || {};
    this.cache = options.cache;
  }

  sourceQuality() {
    const groups = {};
    const all = [];
    for (const [group, registry] of Object.entries(this.registries)) {
      const health = registry?.health?.() || {};
      const sources = Object.entries(health).map(([id, status]) => {
        const score = sourceScore(status);
        const item = { id, group, state: status?.state || 'UNKNOWN', score, updatedAt: status?.updatedAt || status?.lastSuccessAt || null, records: status?.recordCount ?? status?.records ?? null };
        all.push(item);
        return item;
      });
      const scored = sources.filter(source => source.score !== null);
      groups[group] = {
        sources,
        configured: scored.length,
        meanScore: scored.length ? Math.round(scored.reduce((sum, source) => sum + source.score, 0) / scored.length) : null,
        live: sources.filter(source => source.score === 100).length,
        failing: sources.filter(source => source.score === 0).length
      };
    }
    const scored = all.filter(source => source.score !== null);
    return {
      score: scored.length ? Math.round(scored.reduce((sum, source) => sum + source.score, 0) / scored.length) : null,
      configured: scored.length,
      total: all.length,
      groups
    };
  }

  catalogQuality() {
    const countries = this.catalogs.intelligence?.listCountries?.({ limit: 2000 }) || [];
    const cities = this.catalogs.intelligence?.listCities?.({ limit: 2000 }) || [];
    const ports = this.catalogs.shipping?.listPorts?.({ limit: 2000 }) || [];
    const chokepoints = this.catalogs.shipping?.listChokepoints?.({}) || [];
    const routeCollection = this.catalogs.shipping?.listRoutes?.({}) || { features: [] };
    const routes = Array.isArray(routeCollection) ? routeCollection : (routeCollection.features || []);
    const assets = this.catalogs.market?.list?.({}) || [];
    const checks = [
      check('countries.minimum', countries.length >= 225, { value: countries.length, minimum: 225 }, 2),
      check('countries.unique', countDuplicates(countries, item => item.iso2 || item.id) === 0, { duplicates: countDuplicates(countries, item => item.iso2 || item.id) }),
      check('cities.minimum', cities.length >= 240, { value: cities.length, minimum: 240 }, 2),
      check('cities.coordinates', coordinateProblems(cities) === 0, { invalid: coordinateProblems(cities) }, 2),
      check('ports.minimum', ports.length >= 70, { value: ports.length, minimum: 70 }, 2),
      check('ports.coordinates', coordinateProblems(ports) === 0, { invalid: coordinateProblems(ports) }, 2),
      check('chokepoints.minimum', chokepoints.length >= 15, { value: chokepoints.length, minimum: 15 }),
      check('routes.minimum', routes.length >= 15, { value: routes.length, minimum: 15 }),
      check('market-assets.minimum', assets.length >= 10, { value: assets.length, minimum: 10 })
    ];
    return {
      score: weightedScore(checks),
      checks,
      counts: { countries: countries.length, cities: cities.length, ports: ports.length, chokepoints: chokepoints.length, routes: routes.length, assets: assets.length }
    };
  }

  snapshot() {
    const sources = this.sourceQuality();
    const catalogs = this.catalogQuality();
    const cache = this.cache?.stats?.() || {};
    const combined = [sources.score, catalogs.score].filter(Number.isFinite);
    const score = combined.length ? Math.round(combined.reduce((sum, value) => sum + value, 0) / combined.length) : null;
    return {
      score,
      status: score === null ? 'N/A' : score >= 85 ? 'GOOD' : score >= 65 ? 'DEGRADED' : 'POOR',
      sources,
      catalogs,
      cache,
      generatedAt: new Date().toISOString()
    };
  }
}
