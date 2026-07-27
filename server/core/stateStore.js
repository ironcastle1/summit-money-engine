const { collectGdelt } = require("../collectors/gdeltCollector");
const { collectReliefWeb } = require("../collectors/reliefwebCollector");
const { collectUSGS, collectGDACS, collectEONET } = require("../collectors/crisisCollectors");
const { collectMarkets } = require("../collectors/marketCollectors");
const { countryMeta } = require("../data/countryMeta");
const citySeeds = require("../data/citySeeds");
const { marketSignals, countEvents, clamp } = require("./scoring");
const { stableId } = require("./geo");

const STATE = { state: null, mapData: null, updatedAt: 0, refreshing: false, clients: new Set() };

async function refreshState(force = false) {
  if (!force && STATE.state && Date.now() - STATE.updatedAt < 5 * 60 * 1000) return STATE.state;
  if (STATE.refreshing && STATE.state) return STATE.state;
  STATE.refreshing = true;
  try {
    const [gdelt, relief, usgs, gdacs, eonet, marketPack] = await Promise.all([collectGdelt(), collectReliefWeb(), collectUSGS(), collectGDACS(), collectEONET(), collectMarkets()]);
    const events = dedupe([...gdelt, ...relief, ...usgs, ...gdacs, ...eonet]).slice(0, 650);
    const markets = marketPack.markets || [];
    const movers = marketSignals(markets, events);
    const countryRisk = buildCountryRisk(events);
    const liveBrief = buildLiveBrief(events, movers);
    STATE.state = { version: "summit-security-companion-v2-fixed", updatedAt: new Date().toISOString(), events, markets, rapid: movers.slice(0, 30), predictions: movers.slice(0, 24), countryRisk, liveBrief, fx: marketPack.fx, product: "travel-security-business-resilience", sourcesSummary: "No fake local data: local only when the source is local; otherwise national/live/estimated/missing labels are shown." };
    STATE.mapData = { nodes: events.slice(0, 250), cityNodes: citySeeds.map(([name, country, lat, lng]) => ({ id: stableId(`${name}:${country}`), name, country, lat, lng, kind: "city", source: "city-seed" })), countryRisk };
    STATE.updatedAt = Date.now();
    broadcast({ type: "state", state: STATE.state });
    return STATE.state;
  } finally { STATE.refreshing = false; }
}
function dedupe(events) { const seen = new Set(); return events.filter(e => { const key = stableId(`${e.title}:${e.lat}:${e.lng}:${e.sourceSystem}`); if (seen.has(key)) return false; seen.add(key); return true; }); }
function buildCountryRisk(events) {
  return countryMeta.map(c => {
    const war = countEvents(events, c.name, "war"), terror = countEvents(events, c.name, "terror"), crisis = countEvents(events, c.name, "crisis"), politics = countEvents(events, c.name, "politics"), movement = countEvents(events, c.name, "movement");
    const risk = clamp(war * 28 + terror * 22 + crisis * 12 + politics * 8 + movement * 6, 0, 100) || 0;
    return { country: c.name, iso2: c.iso2, region: c.region, centre: c.centre, watch: !!c.watch, familyPriority: !!c.familyPriority, war, terror, crisis, politics, movement, risk, colour: risk >= 55 ? "#ff174f" : risk >= 25 ? "#ff8c00" : "#00a66a" };
  });
}
function buildFamilyWatch(events) {
  const watch = citySeeds.filter(row => ["Syria", "Lebanon", "Israel", "Palestine", "Jordan", "Turkey", "Iraq", "Iran", "Ukraine"].includes(row[1]));
  return watch.map(([name, country, lat, lng]) => {
    const near = events.map(e => ({ ...e, distanceKm: distance(lat, lng, e.lat, e.lng) })).filter(e => Number.isFinite(e.distanceKm) && e.distanceKm <= 250).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 8);
    const risk = clamp(near.reduce((s, e) => s + (e.kind === "war" ? 28 : e.kind === "terror" ? 24 : e.kind === "crisis" ? 14 : 8), 0), 0, 100) || 0;
    return { name, country, lat, lng, risk, verdict: risk >= 70 ? "urgent check" : risk >= 35 ? "watch closely" : "no nearby major signal", nearby: near };
  }).sort((a, b) => b.risk - a.risk);
}
function distance(lat1, lng1, lat2, lng2) { const R = 6371, a = Number(lat1), b = Number(lng1), c = Number(lat2), d = Number(lng2); if (![a,b,c,d].every(Number.isFinite)) return null; const x=(c-a)*Math.PI/180, y=(d-b)*Math.PI/180; const h=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2; return R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)); }
function buildLiveBrief(events, movers) {
  const useful = (events || []).filter(e => ["war", "terror", "crisis", "politics", "movement"].includes(e.kind));
  const buckets = ["war", "terror", "crisis", "politics", "movement", "money"].map(kind => ({ kind, items: events.filter(e => e.kind === kind).slice(0, 5) }));
  return { headline: "Travel security, movement disruption, crisis and money signals", generatedAt: new Date().toISOString(), keyAlerts: useful.slice(0, 12), buckets, topMarketMovers: movers.slice(0, 8) };
}
function getState() { return STATE.state; }
function getMapData() { return STATE.mapData; }
function addClient(res) { STATE.clients.add(res); }
function removeClient(res) { STATE.clients.delete(res); }
function broadcast(payload) { for (const res of STATE.clients) { try { res.write(`data: ${JSON.stringify(payload)}\n\n`); } catch {} } }
module.exports = { refreshState, getState, getMapData, addClient, removeClient };
