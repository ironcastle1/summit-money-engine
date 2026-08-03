const DAY_MS = 86_400_000;
let eventPromise;

function finite(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }
function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function round(value, digits = 0) { const factor = 10 ** digits; return Math.round(value * factor) / factor; }

function haversine(a, b) {
  const toRad = value => value * Math.PI / 180;
  const lat1 = toRad(Number(a.lat)); const lat2 = toRad(Number(b.lat));
  const dLat = lat2 - lat1; const dLon = toRad(Number(b.lon) - Number(a.lon));
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function wilson(successes, total, z = 1.6448536269514722) {
  if (!total) return [0, 100];
  const p = successes / total; const denominator = 1 + z * z / total;
  const centre = (p + z * z / (2 * total)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) + z * z / (4 * total)) / total) / denominator;
  return [round(clamp((centre - margin) * 100, 0, 100)), round(clamp((centre + margin) * 100, 0, 100))];
}

export async function loadFallbackEvents() {
  eventPromise ||= fetch('/data/fallback-events.json', { cache: 'no-store' }).then(response => {
    if (!response.ok) throw new Error(`Fallback events HTTP ${response.status}`);
    return response.json();
  }).then(payload => Array.isArray(payload.events) ? payload.events : []);
  return eventPromise;
}

export async function localEvents(params = {}) {
  const days = clamp(Number(params.days) || 30, 1, 30);
  const limit = clamp(Number(params.limit) || 2000, 1, 5000);
  const cutoff = Date.now() - days * DAY_MS;
  const categories = new Set(Array.isArray(params.categories) ? params.categories : String(params.categories || '').split(',').filter(Boolean));
  const all = await loadFallbackEvents();
  const events = all.filter(event => Date.parse(event.time) >= cutoff && (!categories.size || categories.has(event.category))).slice(0, limit);
  const health = { id: 'snapshot', name: 'Local verified snapshot', state: 'ONLINE', configured: true, recordCount: all.length, weight: 2, stale: false };
  return { events, sources: { snapshot: health }, rawCount: all.length, totalCount: all.length, filteredCount: events.length, generatedAt: new Date().toISOString(), fallback: true };
}

export async function localScan(params = {}) {
  const point = { lat: finite(params.lat) ?? 51.5074, lon: finite(params.lon) ?? -0.1278 };
  const radiusKm = clamp(finite(params.radiusKm) ?? 250, 25, 2500);
  const all = await loadFallbackEvents();
  const now = Date.now();
  const local = all.map(event => ({ ...event, distanceKm: haversine(point, event) }))
    .filter(event => event.distanceKm <= radiusKm && now - Date.parse(event.time) <= 30 * DAY_MS)
    .sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  const recent = days => local.filter(event => now - Date.parse(event.time) <= days * DAY_MS);
  const day1 = recent(1); const day7 = recent(7); const day30 = recent(30);
  const activeDays = new Set(day30.map(event => Math.floor((now - Date.parse(event.time)) / DAY_MS))).size;
  const alpha = activeDays + 0.5; const beta = 30 - activeDays + 0.5;
  const probability = alpha / (alpha + beta);
  const prior7 = local.filter(event => now - Date.parse(event.time) > 7 * DAY_MS && now - Date.parse(event.time) <= 14 * DAY_MS).length;
  const activityChange = prior7 ? (day7.length / prior7 - 1) * 100 : day7.length ? 100 : 0;
  const nearest = day30.length ? Math.min(...day30.map(event => event.distanceKm)) : null;
  const severities = day30.map(event => finite(event.severity)).filter(Number.isFinite);
  const meanSeverity = severities.length ? severities.reduce((a, b) => a + b, 0) / severities.length : 0;
  const area = Math.PI * radiusKm * radiusKm;
  const newestTime = day30.length ? Math.max(...day30.map(event => Date.parse(event.time)).filter(Number.isFinite)) : null;
  const confidence = clamp(18 + Math.log10(day30.length + 1) * 24, 18, 82);
  const health = { id: 'snapshot', name: 'Local verified snapshot', state: 'ONLINE', configured: true, recordCount: all.length, weight: 2, stale: false };
  return {
    point: { ...point, radiusKm },
    metrics: {
      eventProbability24h: round(probability * 100), probabilityRange90: wilson(activeDays, 30),
      expectedNextEventHours: probability > 0 ? round(24 / probability) : null,
      activityChangePct: round(clamp(activityChange, -100, 999), 1), activityDirection: activityChange > 10 ? 'RISING' : activityChange < -10 ? 'FALLING' : 'FLAT',
      proximityRiskIndex: nearest === null ? 0 : round(clamp(100 * (1 - nearest / radiusKm), 0, 100)),
      severityIndex: round(clamp(meanSeverity * 12, 0, 100)), meanSeverity: round(meanSeverity, 2),
      eventCount24h: day1.length, eventCount7d: day7.length, eventCount30d: day30.length,
      activeDays30d: activeDays, dailyEventRate: round(day30.length / 30, 2),
      densityPer10kKm2: round(area ? day30.length / area * 10_000 : 0, 3),
      sourceCoveragePct: 100, sourceCount: 1, localSourceCount: day30.length ? 1 : 0,
      confidencePct: round(confidence), dataAgeMinutes: newestTime ? round((now - newestTime) / 60_000) : null,
      freshnessBand: newestTime ? 'SNAPSHOT' : 'NONE', sampleSize: day30.length, observationDays: 30,
      estimateSupported: true, estimatePrior: { alpha: 0.5, beta: 0.5 }
    },
    events: local.slice(0, clamp(Number(params.limit) || 1000, 1, 1000)),
    sourceStatus: { snapshot: health }, generatedAt: new Date().toISOString(), snapshotAgeMs: 0,
    location: { name: `${point.lat.toFixed(3)}, ${point.lon.toFixed(3)}`, country: 'Selected area', displayName: `${point.lat.toFixed(3)}, ${point.lon.toFixed(3)}`, source: 'LOCAL_COORDINATES' },
    fallback: true
  };
}
