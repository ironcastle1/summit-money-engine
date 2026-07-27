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
module.exports = { latestPoliceMonth, ukCrimeAt };
