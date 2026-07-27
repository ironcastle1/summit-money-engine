const express = require("express");
const { refreshState, getState, getMapData, addClient, removeClient } = require("../core/stateStore");
const { listHealth } = require("../core/sourceHealth");
const { searchPlaces, reverseGeocode, nearbyInfrastructure, wikiPlace } = require("../collectors/placeCollectors");
const { ukCrimeAt, ukCrimeRadius } = require("../collectors/policeUkCollector");
const { getCountryIndicators } = require("../collectors/worldBankCollector");
const { weatherAt } = require("../collectors/weatherCollector");
const { fcdoAdvice } = require("../collectors/advisoryCollector");
const { byIso, byName } = require("../data/countryMeta");
const { buildRisk } = require("../core/scoring");
const { haversineKm } = require("../core/geo");
const { fetchJson } = require("../core/http");
const { runAreaScan } = require("../services/areaScanService");

const router = express.Router();

router.get("/health", async (req, res) => res.json({ ok: true, version: "summit-security-companion-v1" }));
router.get("/state", async (req, res) => res.json(await refreshState(false)));
router.post("/refresh", async (req, res) => res.json({ ok: true, state: await refreshState(true) }));
router.get("/map-data", async (req, res) => { await refreshState(false); res.json(getMapData() || { nodes: [], cityNodes: [], countryRisk: [] }); });
router.get("/sources", (req, res) => res.json({ sources: listHealth(), rule: "Numbers are labelled local, national, live-event, estimated, missing or failed." }));
router.get("/stream", async (req, res) => {
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" });
  addClient(res);
  try { res.write(`data: ${JSON.stringify({ type: "state", state: await refreshState(false) })}\n\n`); } catch {}
  req.on("close", () => removeClient(res));
});
router.get("/search", async (req, res) => res.json({ places: await searchPlaces(String(req.query.q || "")) }));
router.post("/area-scan", async (req, res) => {
  try {
    const body = req.body || {};
    const result = await runAreaScan({
      query: body.query || body.place || body.search || "",
      radiusMiles: body.radiusMiles || body.radius || 5
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get("/wiki/place", async (req, res) => res.json(await wikiPlace(String(req.query.name || ""))));
router.get("/boundaries/admin0", async (req, res) => {
  try { const data = await fetchJson("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson", { timeout: 18000 }); res.json(data); }
  catch (err) { res.status(500).json({ type: "FeatureCollection", features: [], error: err.message }); }
});
router.get("/place/intel", async (req, res) => {
  const lat = Number(req.query.lat), lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ error: "lat/lng required" });
  const state = await refreshState(false);
  const place = await reverseGeocode(lat, lng);
  const country = byIso(place.countryCode) || byName(place.country);
  if (!country && !place.countryCode && !place.country) {
    return res.json({ isOcean: true, oceanName: place.displayName || "Ocean / sea area", place, country: null, dataRules: ["Ocean clicks do not show land safety or local crime scores."] });
  }
  const [weather, infra, wiki, indicators, advisory, localCrime] = await Promise.all([
    weatherAt(lat, lng), nearbyInfrastructure(lat, lng, 5), wikiPlace([place.name || place.city, place.country].filter(Boolean).join(", ")),
    country ? getCountryIndicators(country.iso2) : Promise.resolve({}), country ? fcdoAdvice(country) : Promise.resolve({ available: false }),
    country && country.iso2 === "GB" ? ukCrimeRadius(lat, lng, 8.04672) : Promise.resolve({ available: false, source: "No official local crime feed connected for this country" })
  ]);
  const nearbyEvents = (state.events || [])
    .map(e => ({ ...e, distanceKm: haversineKm(lat, lng, e.lat, e.lng) }))
    .filter(e => Number.isFinite(e.distanceKm) && e.distanceKm <= 250)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 20);
  const countryEvents = country
    ? (state.events || []).filter(e => String(e.country || "").toLowerCase() === String(country.name || "").toLowerCase()).slice(0, 80)
    : [];
  const risk = buildRisk({ place, country, events: nearbyEvents, countryEvents, indicators, localCrime, weather, advisory });
  res.json({ place, country, risk, weather, infrastructure: infra, wiki, indicators, advisory, localCrime, nearbyEvents, countryEventsCount: countryEvents.length, dataRules: ["Place scores use nearby live events within 250km plus local data where available.", "Country context is shown separately and is not treated as town-level data.", "Local crime is only local where an official local feed exists.", "Live events are event-feed signals, not verified police records.", "Missing sources show missing instead of fake values."] });
});
router.get("/live-brief", async (req, res) => { const s = await refreshState(false); res.json(s.liveBrief); });
router.get("/markets", async (req, res) => { const s = await refreshState(false); res.json({ markets: s.markets, rapid: s.rapid, predictions: s.predictions, fx: s.fx }); });
router.get("/country/:iso2", async (req, res) => {
  const country = byIso(req.params.iso2); if (!country) return res.status(404).json({ error: "country not in metadata" });
  const state = await refreshState(false);
  const indicators = await getCountryIndicators(country.iso2);
  const advisory = await fcdoAdvice(country);
  const risk = buildRisk({ place: { country: country.name }, country, events: state.events, indicators, localCrime: { available: false }, weather: null, advisory });
  const events = (state.events || []).filter(e => String(e.country || "").toLowerCase().includes(country.name.toLowerCase())).slice(0, 30);
  res.json({ country, risk, indicators, advisory, events });
});
module.exports = router;
