const { cachedJson, cachedText, fetchJson } = require('./http');
const cache = require('./cache');
const { findCitySeed } = require('./citySeeds');
const { milesToMeters, distanceMiles, cleanText } = require('./util');

const PLACE_TTL = 24 * 60 * 60 * 1000;
const INFRA_TTL = 20 * 60 * 1000;

function mapAddress(data) {
  const a = data.address || {};
  return {
    displayName: data.display_name || data.name || '',
    name: data.name || a.city || a.town || a.village || a.suburb || a.neighbourhood || '',
    city: a.city || a.town || a.village || a.hamlet || '',
    area: a.suburb || a.neighbourhood || a.quarter || '',
    state: a.state || a.county || '',
    country: a.country || '',
    countryCode: a.country_code ? String(a.country_code).toUpperCase() : '',
    raw: a
  };
}

async function geocode(query) {
  const q = String(query || '').trim();
  if (!q) return null;
  const fixed = q.replace(/damscus/i, 'Damascus').replace(/\bkiev\b/i, 'Kyiv');
  const seed = findCitySeed(fixed);
  const key = `geocode:${fixed.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached) return cached;
  if (seed && (seed.name.toLowerCase() === fixed.toLowerCase() || fixed.toLowerCase().includes(seed.name.toLowerCase()))) {
    return cache.set(key, { ...seed, displayName: `${seed.name}, ${seed.country}`, city: seed.name, source: 'built-in place fallback' }, PLACE_TTL);
  }
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(fixed)}&limit=5&addressdetails=1&accept-language=en`;
    const rows = await cachedJson(key + ':remote', url, PLACE_TTL, 'Nominatim search', { timeout: 4000 });
    const row = (rows || []).find(r => r.lat && r.lon) || null;
    if (row) {
      const out = { lat: Number(row.lat), lng: Number(row.lon), ...mapAddress(row), source: 'Nominatim/OpenStreetMap' };
      return cache.set(key, out, PLACE_TTL);
    }
  } catch {}
  if (seed) return cache.set(key, { ...seed, displayName: `${seed.name}, ${seed.country}`, city: seed.name, source: 'built-in place fallback' }, PLACE_TTL);
  return null;
}

async function reverseGeocode(lat, lng) {
  const key = `reverse:${Number(lat).toFixed(4)}:${Number(lng).toFixed(4)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&addressdetails=1&zoom=18&accept-language=en`;
    const data = await cachedJson(key + ':remote', url, PLACE_TTL, 'Nominatim reverse', { timeout: 3500 });
    const out = { lat: Number(lat), lng: Number(lng), ...mapAddress(data), source: 'Nominatim/OpenStreetMap' };
    return cache.set(key, out, PLACE_TTL);
  } catch {
    return null;
  }
}

function infraKind(tags = {}) {
  if (tags.amenity === 'hospital' || tags.healthcare === 'hospital') return 'hospital';
  if (tags.amenity === 'clinic' || tags.healthcare === 'clinic') return 'clinic';
  if (tags.amenity === 'pharmacy' || tags.healthcare === 'pharmacy') return 'pharmacy';
  if (tags.amenity === 'police') return 'police';
  if (tags.amenity === 'fire_station') return 'fire';
  if (tags.amenity === 'embassy' || tags.office === 'diplomatic') return 'embassy';
  if (tags.aeroway === 'aerodrome' || tags.aeroway === 'airport') return 'airport';
  if (tags.amenity === 'fuel') return 'fuel';
  if (tags.border_control || tags.barrier === 'border_control') return 'border';
  if (tags.harbour || tags.industrial === 'port' || tags.landuse === 'port') return 'port';
  if (tags.railway === 'station') return 'rail';
  if (tags.highway && /motorway|trunk|primary|secondary/.test(tags.highway)) return 'main road';
  if (tags.man_made === 'communications_tower' || tags.tower_type === 'communication') return 'communications';
  if (tags.power) return 'power';
  if (tags.amenity === 'shelter') return 'shelter';
  if (tags.amenity === 'drinking_water') return 'water';
  if (tags.shop === 'supermarket' || tags.shop === 'convenience') return 'food';
  if (tags.amenity === 'bank' || tags.amenity === 'atm' || tags.office === 'financial') return 'money';
  return tags.amenity || tags.highway || tags.shop || 'infrastructure';
}

async function infrastructure(lat, lng, radiusMiles = 5) {
  const radius = Math.min(25000, Math.max(500, milesToMeters(radiusMiles)));
  const key = `infra:${Number(lat).toFixed(3)}:${Number(lng).toFixed(3)}:${Math.round(radius)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const query = `
[out:json][timeout:4];
(
  node(around:${Math.round(radius)},${lat},${lng})["amenity"~"hospital|clinic|pharmacy|police|fire_station|embassy|fuel|shelter|drinking_water|bank|atm"];
  node(around:${Math.round(radius)},${lat},${lng})["healthcare"~"hospital|clinic|pharmacy"];
  node(around:${Math.round(radius)},${lat},${lng})["office"="diplomatic"];
  node(around:${Math.round(radius)},${lat},${lng})["aeroway"~"aerodrome|airport"];
  node(around:${Math.round(radius)},${lat},${lng})["railway"="station"];
  node(around:${Math.round(radius)},${lat},${lng})["harbour"];
  node(around:${Math.round(radius)},${lat},${lng})["border_control"];
  node(around:${Math.round(radius)},${lat},${lng})["barrier"="border_control"];
  node(around:${Math.round(radius)},${lat},${lng})["power"];
  node(around:${Math.round(radius)},${lat},${lng})["man_made"="communications_tower"];
  node(around:${Math.round(radius)},${lat},${lng})["shop"~"supermarket|convenience"];
  way(around:${Math.round(radius)},${lat},${lng})["highway"~"motorway|trunk|primary|secondary"];
);
out center tags 220;
`;
  const endpoints = ['https://overpass-api.de/api/interpreter'];
  for (const base of endpoints) {
    try {
      const text = await cachedText(`${key}:${base}`, `${base}?data=${encodeURIComponent(query)}`, INFRA_TTL, `Overpass ${base}`, { timeout: 3500 });
      const data = JSON.parse(text);
      const rows = (data.elements || []).map(el => {
        const tags = el.tags || {};
        const pLat = Number(el.lat || (el.center && el.center.lat));
        const pLng = Number(el.lon || (el.center && el.center.lon));
        const dist = distanceMiles(lat, lng, pLat, pLng);
        return {
          id: String(el.id),
          name: cleanText(tags['name:en'] || tags.name || infraKind(tags)),
          kind: infraKind(tags),
          lat: pLat,
          lng: pLng,
          distanceMiles: dist === null ? null : Number(dist.toFixed(2)),
          tags,
          source: 'OpenStreetMap/Overpass'
        };
      }).filter(x => Number.isFinite(x.lat) && Number.isFinite(x.lng));
      const dedupe = new Map();
      for (const r of rows) dedupe.set(`${r.kind}:${r.name}:${r.lat.toFixed(4)}:${r.lng.toFixed(4)}`, r);
      const out = [...dedupe.values()].sort((a, b) => (a.distanceMiles || 999) - (b.distanceMiles || 999));
      cache.mark('Overpass infrastructure', 'OK', { detail: `${out.length} radius facilities` });
      return cache.set(key, out, INFRA_TTL);
    } catch (err) {
      cache.mark(`Overpass ${base}`, 'FAIL', { detail: err.message });
    }
  }
  return cache.set(key, [], 3 * 60 * 1000);
}

async function wikiSummary(place) {
  const text = String(place || '').replace(/\b[A-Z]\s?\d+\b/gi, '').split(',').slice(0, 2).join(',').trim();
  if (!text) return { found: false };
  const key = `wiki:${text.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const candidates = [text, text.split(',')[0]].filter(Boolean);
  for (const c of candidates) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(c)}?redirect=true`;
      const data = await cachedJson(`${key}:${c}`, url, PLACE_TTL, 'Wikipedia summary', { timeout: 3500 });
      if (data && data.title && !/\b\d{3,4}\b|road|highway|route/i.test(data.title)) {
        const out = {
          found: true,
          title: data.title,
          extract: data.extract || '',
          image: data.thumbnail && data.thumbnail.source || null,
          url: data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page || null,
          source: 'Wikipedia/Wikimedia'
        };
        return cache.set(key, out, PLACE_TTL);
      }
    } catch {}
  }
  return cache.set(key, { found: false }, 60 * 60 * 1000);
}

module.exports = { geocode, reverseGeocode, infrastructure, wikiSummary };
