const { fetchJson } = require("../core/http");
const cache = require("../core/cacheStore");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");
const indicators = {
  homicide: "VC.IHR.PSRC.P5",
  gdpPerPerson: "NY.GDP.PCAP.CD",
  gdpGrowth: "NY.GDP.MKTP.KD.ZG",
  politicalStability: "PV.EST",
  governmentEffectiveness: "GE.EST",
  corruptionControl: "CC.EST",
  inflation: "FP.CPI.TOTL.ZG",
  unemployment: "SL.UEM.TOTL.ZS"
};
async function getIndicator(iso2, key) {
  if (!iso2 || !indicators[key]) return { value: null, year: null, source: "World Bank", indicator: key };
  const cacheKey = `wb:${iso2}:${key}`;
  const cached = cache.get(cacheKey); if (cached) return cached;
  startSource("World Bank", "national-indicators");
  const indicator = indicators[key];
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(iso2)}/indicator/${indicator}?format=json&per_page=8`;
  try {
    const data = await fetchJson(url, { timeout: 10000 });
    const rows = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
    const found = rows.find(r => r.value !== null && r.value !== undefined);
    const result = found ? { value: Number(found.value), year: found.date, source: "World Bank", indicator: key, code: indicator, confidence: "national" } : { value: null, year: null, source: "World Bank", indicator: key, code: indicator, confidence: "missing" };
    markSuccess("World Bank", result.value === null ? 0 : 1, `Loaded ${key} ${iso2}`);
    return cache.set(cacheKey, result, 24 * 60 * 60 * 1000);
  } catch (err) { markFailure("World Bank", err, { iso2, indicator }); return { value: null, year: null, source: "World Bank failed", indicator: key, code: indicator, confidence: "failed" }; }
}
async function getCountryIndicators(iso2) {
  const keys = Object.keys(indicators);
  const rows = await Promise.all(keys.map(k => getIndicator(iso2, k)));
  return Object.fromEntries(keys.map((k, i) => [k, rows[i]]));
}
module.exports = { getIndicator, getCountryIndicators, indicators };
