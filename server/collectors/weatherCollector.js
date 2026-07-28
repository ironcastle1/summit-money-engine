const { fetchJson } = require("../core/http");
const cache = require("../core/cacheStore");
const { startSource, markSuccess, markFailure } = require("../core/sourceHealth");
async function weatherAt(lat, lng) {
  const key = `weather:${Number(lat).toFixed(2)}:${Number(lng).toFixed(2)}`; const cached = cache.get(key); if (cached) return cached;
  startSource("Open-Meteo weather", "local-weather");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m&hourly=precipitation,wind_gusts_10m,weather_code&forecast_days=1&timezone=auto`;
  try {
    const data = await fetchJson(url, { timeout: 9000 });
    const c = data.current || {};
    const result = { current: { temperatureC: c.temperature_2m ?? null, precipitationMm: c.precipitation ?? null, windKmh: c.wind_speed_10m ?? null, gustKmh: c.wind_gusts_10m ?? null, code: c.weather_code ?? null }, source: "Open-Meteo", confidence: "local-model" };
    markSuccess("Open-Meteo weather", 1, "Loaded local weather");
    return cache.set(key, result, 10 * 60 * 1000);
  } catch (err) { markFailure("Open-Meteo weather", err); return { current: null, source: "Open-Meteo failed", confidence: "failed" }; }
}
module.exports = { weatherAt };
