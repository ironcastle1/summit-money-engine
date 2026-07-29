const { fetchJson } = require("../core/http");
const cache = require("../core/cacheStore");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");

async function latestPoliceMonth() {
  const cached = cache.get("police:lastUpdated"); if (cached) return cached;
  startSource("data.police.uk latest", "uk-crime");
  const url = "https://data.police.uk/api/crime-last-updated";
  try {
    const data = await fetchJson(url, { timeout: 10000 });
    const date = String(data.date || "").slice(0, 7);
    markSuccess("data.police.uk latest", date ? 1 : 0, `Latest month ${date || "unknown"}`);
    return cache.set("police:lastUpdated", date || fallbackMonth(), 12 * 60 * 60 * 1000);
  } catch (err) { markFailure("data.police.uk latest", err); return fallbackMonth(); }
}
function fallbackMonth() { const d = new Date(); d.setMonth(d.getMonth() - 2); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
async function ukCrimeAt(lat, lng) {
  const date = await latestPoliceMonth();
  const key = `ukcrime:${Number(lat).toFixed(4)}:${Number(lng).toFixed(4)}:${date}`;
  const cached = cache.get(key); if (cached) return cached;
  startSource("data.police.uk local crime", "uk-crime");
  const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&date=${date}`;
  try {
    const rows = await fetchJson(url, { timeout: 12000 });
    const categories = {}, outcomes = {};
    for (const r of rows || []) {
      categories[r.category || "unknown"] = (categories[r.category || "unknown"] || 0) + 1;
      if (r.outcome_status && r.outcome_status.category) outcomes[r.outcome_status.category] = (outcomes[r.outcome_status.category] || 0) + 1;
    }
    const result = { available: true, total: Array.isArray(rows) ? rows.length : 0, date, categories, outcomes, source: "data.police.uk", note: "Street-level locations are approximate. This is local official police data around clicked coordinates." };
    markSuccess("data.police.uk local crime", result.total, "Loaded local UK crime count");
    return cache.set(key, result, 6 * 60 * 60 * 1000);
  } catch (err) { markFailure("data.police.uk local crime", err); return { available: false, total: null, date, categories: {}, outcomes: {}, source: "data.police.uk failed" }; }
}

function offsetPoint(lat, lng, kmNorth, kmEast) {
  const dLat = kmNorth / 111.32;
  const dLng = kmEast / (111.32 * Math.cos(Number(lat) * Math.PI / 180));
  return { lat: Number(lat) + dLat, lng: Number(lng) + dLng };
}
async function ukCrimeRadius(lat, lng, radiusKm = 8.04672) {
  const r = Math.max(1, Math.min(16, Number(radiusKm) || 8.04672));
  const half = Math.min(r * 0.55, 4);
  const points = [
    { lat: Number(lat), lng: Number(lng) },
    offsetPoint(lat, lng, half, 0),
    offsetPoint(lat, lng, -half, 0),
    offsetPoint(lat, lng, 0, half),
    offsetPoint(lat, lng, 0, -half)
  ];
  const rows = await Promise.all(points.map(p => ukCrimeAt(p.lat, p.lng).catch(() => ({ available:false, total:null, categories:{}, outcomes:{} }))));
  const available = rows.some(x => x.available);
  if (!available) return { available:false, total:null, categories:{}, outcomes:{}, samplePoints: rows.length, source:"data.police.uk radius samples failed" };
  const categories = {}, outcomes = {};
  let total = 0;
  for (const row of rows) {
    if (!row.available) continue;
    total += Number(row.total || 0);
    for (const [k,v] of Object.entries(row.categories || {})) categories[k] = (categories[k] || 0) + Number(v || 0);
    for (const [k,v] of Object.entries(row.outcomes || {})) outcomes[k] = (outcomes[k] || 0) + Number(v || 0);
  }
  return {
    available: true,
    total,
    date: rows.find(x=>x.date)?.date,
    categories,
    outcomes,
    samplePoints: rows.length,
    source: "data.police.uk sampled around radius",
    note: "Approximate local crime scan using centre and four nearby points. Police.uk crime locations are approximate."
  };
}

module.exports = { latestPoliceMonth, ukCrimeAt, ukCrimeRadius };
