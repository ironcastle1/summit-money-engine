const { collectNews } = require('./newsCollectors');
const { geocode, reverseGeocode, infrastructure, wikiSummary } = require('./placeCollectors');
const { streetCrime } = require('./policeUk');
const { distanceMiles } = require('./util');
const { buildAreaIdeas, scoreArea } = require('./opportunityEngine');

async function areaScan(input) {
  const query = String(input.query || input.place || '').trim();
  const radiusMiles = Math.min(50, Math.max(1, Number(input.radiusMiles || input.radius || 5)));
  let place = input.lat && input.lng ? await reverseGeocode(Number(input.lat), Number(input.lng)) : null;
  if (!place && query) place = await geocode(query);
  if (!place) {
    return { ok: false, error: 'Place not found', query, radiusMiles };
  }

  const [news, infra, crime, wiki] = await Promise.all([
    collectNews().catch(() => []),
    infrastructure(place.lat, place.lng, radiusMiles).catch(() => []),
    place.countryCode === 'GB' ? streetCrime(place.lat, place.lng).catch(() => ({ available: false })) : Promise.resolve({ available: false, source: 'No official local crime source connected here' }),
    wikiSummary(place.city || place.name || place.displayName).catch(() => ({ found: false }))
  ]);

  const withDistance = news.map(n => ({ ...n, distanceMiles: n.lat && n.lng ? distanceMiles(place.lat, place.lng, n.lat, n.lng) : null }));
  const eventsInside = withDistance.filter(n => Number.isFinite(n.distanceMiles) && n.distanceMiles <= radiusMiles).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 40);
  const eventsNearby = withDistance.filter(n => Number.isFinite(n.distanceMiles) && n.distanceMiles > radiusMiles && n.distanceMiles <= radiusMiles * 4).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 40);

  const scan = {
    ok: true,
    query,
    radiusMiles,
    place,
    wiki,
    localCrime: crime,
    infrastructure: infra.slice(0, 160),
    eventsInside,
    eventsNearby,
    createdAt: new Date().toISOString()
  };
  scan.score = scoreArea(scan);
  scan.ideas = buildAreaIdeas(scan);
  scan.checklist = buildChecklist(scan);
  return scan;
}

function hasKind(infra, kind) {
  return infra.some(x => x.kind === kind);
}

function buildChecklist(scan) {
  const infra = scan.infrastructure || [];
  const events = scan.eventsInside || [];
  const checklist = [];
  checklist.push({ item: 'Check live signals inside the radius', status: events.length ? 'Needs review' : 'Clear in loaded feeds' });
  checklist.push({ item: 'Medical access', status: hasKind(infra, 'hospital') || hasKind(infra, 'clinic') || hasKind(infra, 'pharmacy') ? 'Mapped nearby' : 'Not found in current OSM pull' });
  checklist.push({ item: 'Police / emergency access', status: hasKind(infra, 'police') || hasKind(infra, 'fire') ? 'Mapped nearby' : 'Not found in current OSM pull' });
  checklist.push({ item: 'Transport escape options', status: infra.some(x => ['airport','rail','port','main road','border'].includes(x.kind)) ? 'Mapped nearby' : 'Limited in current OSM pull' });
  checklist.push({ item: 'Local crime feed', status: scan.localCrime && scan.localCrime.available ? `${scan.localCrime.total} official recent local records loaded` : 'No official local feed connected' });
  checklist.push({ item: 'Make-money angle', status: 'Use Area Ideas to package this scan into a paid brief, checklist or lead list' });
  return checklist;
}

async function routeCheck(input) {
  const from = await geocode(input.from || '');
  const to = await geocode(input.to || '');
  if (!from || !to) return { ok: false, error: 'Could not resolve both route endpoints', from, to };
  const [fromScan, toScan] = await Promise.all([
    areaScan({ lat: from.lat, lng: from.lng, radiusMiles: input.radiusMiles || 5, query: from.displayName || from.name }),
    areaScan({ lat: to.lat, lng: to.lng, radiusMiles: input.radiusMiles || 5, query: to.displayName || to.name })
  ]);
  const distance = distanceMiles(from.lat, from.lng, to.lat, to.lng);
  const risk = Math.round(((fromScan.score.riskPct || 20) + (toScan.score.riskPct || 20)) / 2);
  return {
    ok: true,
    from,
    to,
    distanceMiles: distance ? Number(distance.toFixed(1)) : null,
    riskPct: risk,
    verdict: risk >= 50 ? 'Review before travel' : risk >= 35 ? 'Caution' : 'Generally clear',
    routeLine: [[from.lat, from.lng], [to.lat, to.lng]],
    fromScan: compactScan(fromScan),
    toScan: compactScan(toScan),
    checks: [
      'Check current border/airport/rail disruption before leaving.',
      'Check live signals at both start and destination.',
      'Save hospitals, pharmacies, police, fuel and transport points before travel.',
      'Do not treat straight-line route as a driving route. Use it as an intelligence corridor only.'
    ]
  };
}

function compactScan(scan) {
  return {
    place: scan.place,
    score: scan.score,
    eventCount: (scan.eventsInside || []).length,
    infrastructureCount: (scan.infrastructure || []).length,
    crime: scan.localCrime
  };
}

module.exports = { areaScan, routeCheck };
