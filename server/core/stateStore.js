const { collectGdelt } = require("../collectors/gdeltCollector");
const { collectReliefWeb } = require("../collectors/reliefwebCollector");
const { collectSecurityNews } = require("../collectors/securityNewsCollector");
const { collectUSGS, collectGDACS, collectEONET } = require("../collectors/crisisCollectors");
const { collectMarkets } = require("../collectors/marketCollectors");
const { countryMeta } = require("../data/countryMeta");
const citySeeds = require("../data/citySeeds");
const { marketSignals, countEvents, clamp } = require("./scoring");
const ACTIVE_WAR_OVERLAY = new Set(["Ukraine","Russia","Syria","Sudan","Yemen","Somalia","Mali","Burkina Faso","Niger","Myanmar","Palestine","Israel","Lebanon","Iraq","Afghanistan","Pakistan"]);
const CONFLICT_ZONES = [
  { id: "ukraine-east-south", name: "Ukraine east/south active conflict belt", country: "Ukraine", parties: "Ukraine vs Russia and Russian-backed forces", status: "Russia holds/presses parts of the east and south; Ukraine contests and strikes the area", duration: "full-scale invasion since 2022; conflict since 2014", avoid: "frontline oblasts, occupied areas, military sites, bridges, depots, rail hubs and border areas", type: "estimated conflict zone", source: "public conflict reporting estimate", polygon: [[51.4,34.6],[51.0,37.8],[49.7,39.2],[48.4,39.1],[47.1,37.7],[46.0,35.1],[46.3,32.1],[47.2,31.6],[48.4,32.8],[49.2,34.0],[50.4,34.5]] },
  { id: "russia-border-war-context", name: "Russia border war context zone", country: "Russia", parties: "Russia vs Ukraine cross-border strike/security context", status: "border regions remain exposed to strikes, drones and security restrictions", duration: "active since the Russia-Ukraine war escalated", avoid: "border regions, military sites, oil depots, air bases and checkpoints", type: "estimated conflict-adjacent zone", source: "public conflict reporting estimate", polygon: [[51.6,34.0],[51.6,40.0],[49.7,40.2],[49.5,37.8],[50.3,35.1]] },
  { id: "gaza", name: "Gaza active conflict zone", country: "Palestine", parties: "Israel vs Hamas and other armed groups", status: "high-intensity urban conflict and humanitarian risk", duration: "current war escalated in 2023; broader conflict is long-running", avoid: "all active combat areas, border fence, military positions, aid convoy routes and damaged buildings", type: "estimated conflict zone", source: "public conflict reporting estimate", polygon: [[31.60,34.25],[31.60,34.58],[31.20,34.58],[31.20,34.25]] },
  { id: "israel-lebanon-border", name: "Israel/Lebanon border conflict zone", country: "Lebanon", parties: "Israel vs Hezbollah / armed groups across the border area", status: "recurring strikes, shelling, rocket/drone alerts and displacement", duration: "escalated since 2023; border conflict recurring", avoid: "border belt, military positions, roads near the frontier and known launch/strike areas", type: "estimated conflict zone", source: "public conflict reporting estimate", polygon: [[33.35,35.18],[33.35,35.95],[32.95,35.95],[32.95,35.18]] },
  { id: "syria-northwest", name: "Northwest Syria conflict zone", country: "Syria", parties: "Syrian government/Russia/Iran-aligned forces vs opposition and jihadist groups; Turkish-linked actors in parts", status: "contested pockets, strikes and security incidents", duration: "Syrian war since 2011", avoid: "frontlines, checkpoints, military sites, camps, border corridors and rural roads after dark", type: "estimated conflict zone", source: "public security reporting estimate", polygon: [[36.4,35.7],[36.4,37.7],[35.1,37.7],[35.1,35.7]] },
  { id: "syria-east", name: "Eastern Syria security zone", country: "Syria", parties: "SDF/coalition, Syrian government, Iran-aligned groups, ISIS cells and tribal actors", status: "fragmented security control and recurring attacks", duration: "Syrian war since 2011; ISIS/security threat ongoing", avoid: "desert roads, oil/gas sites, checkpoints, river crossings and military bases", type: "estimated conflict/security zone", source: "public security reporting estimate", polygon: [[35.7,39.0],[35.7,41.9],[33.8,41.9],[33.8,39.0]] },
  { id: "sudan-khartoum", name: "Khartoum conflict zone", country: "Sudan", parties: "Sudanese Armed Forces vs Rapid Support Forces", status: "urban conflict and shelling risk", duration: "war since 2023", avoid: "military sites, bridges, airports, markets during fighting and main junctions", type: "estimated conflict zone", source: "public conflict reporting estimate", polygon: [[16.2,31.8],[16.2,33.2],[14.9,33.2],[14.9,31.8]] },
  { id: "sudan-darfur", name: "Darfur conflict zone", country: "Sudan", parties: "SAF/RSF and aligned local armed actors", status: "severe insecurity and displacement risk", duration: "current war since 2023; Darfur conflict history longer", avoid: "town outskirts, checkpoints, IDP routes and contested roads", type: "estimated conflict zone", source: "public conflict reporting estimate", polygon: [[15.9,21.0],[15.9,26.8],[10.0,26.8],[10.0,21.0]] },
  { id: "yemen-west", name: "Yemen western conflict/security zone", country: "Yemen", parties: "Houthis, Yemeni government-aligned forces, regional/international actors", status: "missile/drone/maritime/security risk", duration: "war escalated from 2014/2015; continuing security crisis", avoid: "ports, military sites, frontlines, main roads near fighting and Red Sea coastal security areas", type: "estimated conflict/security zone", source: "public conflict reporting estimate", polygon: [[17.4,42.6],[17.4,45.5],[13.0,45.5],[13.0,42.6]] },
  { id: "somalia-south", name: "South/Central Somalia active security zone", country: "Somalia", parties: "Somali government/partners vs al-Shabaab and armed actors", status: "insurgent attacks, checkpoints and road insecurity", duration: "long-running insurgency", avoid: "rural roads, checkpoints, government/security sites, hotels used by officials and convoy routes", type: "estimated security zone", source: "public security reporting estimate", polygon: [[4.5,42.5],[4.5,47.5],[-1.5,47.5],[-1.5,42.5]] },
  { id: "sahel-belt", name: "Central Sahel insurgency risk belt", country: "Mali", parties: "state forces and international/local partners vs jihadist and armed groups", status: "rural insurgency, attacks and road ambush risk", duration: "serious regional conflict since the 2010s", avoid: "rural roads, border zones, military convoys, isolated towns and night travel", type: "estimated security zone", source: "public security reporting estimate", polygon: [[17.0,-4.8],[16.4,2.5],[13.0,5.0],[10.8,1.0],[11.0,-5.0],[14.0,-7.0]] }
];
const { stableId } = require("./geo");

const STATE = { state: null, mapData: null, updatedAt: 0, refreshing: false, clients: new Set() };

async function refreshState(force = false) {
  if (!force && STATE.state && Date.now() - STATE.updatedAt < 5 * 60 * 1000) return STATE.state;
  if (STATE.refreshing && STATE.state) return STATE.state;
  STATE.refreshing = true;
  try {
    const [gdelt, news, relief, usgs, gdacs, eonet, marketPack] = await Promise.all([collectGdelt(), collectSecurityNews(), collectReliefWeb(), collectUSGS(), collectGDACS(), collectEONET(), collectMarkets()]);
    const events = dedupe([...gdelt, ...news, ...relief, ...usgs, ...gdacs, ...eonet]).slice(0, 850);
    const markets = marketPack.markets || [];
    const movers = marketSignals(markets, events);
    const countryRisk = buildCountryRisk(events);
    const liveBrief = buildLiveBrief(events, movers);
    STATE.state = { version: "summit-security-companion-v5-politics-crime-security-expansion", updatedAt: new Date().toISOString(), events, markets, rapid: movers.slice(0, 30), predictions: movers.slice(0, 24), countryRisk, liveBrief, fx: marketPack.fx, product: "travel-security-business-resilience", sourcesSummary: "No fake local data: local only when the source is local; otherwise national/live/estimated/missing labels are shown." };
    STATE.mapData = { nodes: events.filter(e => e.displayOnMap !== false).slice(0, 250), cityNodes: citySeeds.map(([name, country, lat, lng]) => ({ id: stableId(`${name}:${country}`), name, country, lat, lng, kind: "city", source: "city-seed" })), countryRisk, conflictZones: CONFLICT_ZONES };
    STATE.updatedAt = Date.now();
    broadcast({ type: "state", state: STATE.state });
    return STATE.state;
  } finally { STATE.refreshing = false; }
}
function dedupe(events) { const seen = new Set(); return events.filter(e => { const key = stableId(`${e.title}:${e.lat}:${e.lng}:${e.sourceSystem}`); if (seen.has(key)) return false; seen.add(key); return true; }); }
function buildCountryRisk(events) {
  return countryMeta.map(c => {
    const countryEvents = (events || []).filter(e => String(e.country || "").toLowerCase() === String(c.name || "").toLowerCase());
    const strictWar = countryEvents.filter(e => e.kind === "war" && Number(e.severity || 0) >= 4 && /\b(airstrike|missile|shelling|frontline|combat|invasion|drone attack|troops killed|military offensive|armed clashes?)\b/i.test(`${e.title || ""} ${e.summary || ""}`)).length;
    const war = strictWar;
    const terror = countryEvents.filter(e => e.kind === "terror").length;
    const crisisEvents = countryEvents.filter(e => e.kind === "crisis" && !(e.subtype === "earthquake" && Number(e.magnitude || 0) < 5));
    const crisis = crisisEvents.length;
    const politics = countryEvents.filter(e => e.kind === "politics").length;
    const movement = countryEvents.filter(e => e.kind === "movement").length;
    const crime = countryEvents.filter(e => e.kind === "crime").length;
    const overlayWar = ACTIVE_WAR_OVERLAY.has(c.name) && (strictWar > 0 || c.watch === true);
    const risk = clamp(strictWar * 28 + terror * 22 + crisis * 12 + politics * 10 + crime * 8 + movement * 6, 0, 100) || 0;
    const crisisType = crisisEvents.some(e => e.subtype === "earthquake") ? "earthquake / seismic risk" : crisisEvents.some(e => /flood|storm|wildfire|hurricane|weather/i.test(`${e.title || ""} ${e.summary || ""}`)) ? "weather/disaster disruption" : crisis ? "humanitarian/disaster signal" : "none";
    const crisisMeaning = crisis ? `${crisis} serious crisis signal(s) loaded for this country from crisis feeds or security RSS` : "no serious crisis signal loaded";
    return { country: c.name, iso2: c.iso2, region: c.region, centre: c.centre, watch: !!c.watch, familyPriority: !!c.familyPriority, overlayWar, war, terror, crisis, politics, movement, risk, crisisType, crisisMeaning, colour: overlayWar ? "#ff174f" : risk >= 25 ? "#ff8c00" : "#00a66a" };
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
function eventImportance(e) {
  const k = e.kind;
  const sev = Number(e.severity || 0);
  let score = sev * 20;
  if (k === "war" || k === "terror") score += 35;
  if (k === "movement") score += 18;
  if (k === "politics") score += 10;
  if (k === "crisis") score += (e.subtype === "earthquake" && Number(e.magnitude || 0) < 5) ? -100 : 12;
  if (/warning|warned/i.test(e.title || "") && k === "war") score -= 35;
  if (/sports|uniform|marine warning|small craft|lake michigan|commonwealth games/i.test(e.title || "")) score -= 100;
  return score;
}
function buildLiveBrief(events, movers) {
  const useful = (events || [])
    .filter(e => ["war", "terror", "movement", "politics", "crisis"].includes(e.kind))
    .map(e => ({ ...e, importance: eventImportance(e) }))
    .filter(e => e.importance >= 35)
    .filter(e => !(e.subtype === "earthquake" && Number(e.magnitude || 0) < 5))
    .sort((a, b) => b.importance - a.importance);
  const buckets = ["war", "terror", "movement", "politics", "crisis"].map(kind => ({
    kind,
    items: useful.filter(e => e.kind === kind).slice(0, 6)
  }));
  const countriesWorse = buildCountryRisk(useful).filter(c => c.risk >= 25).sort((a,b)=>b.risk-a.risk).slice(0, 10);
  return {
    headline: "What matters for travel/security right now",
    generatedAt: new Date().toISOString(),
    keyAlerts: useful.slice(0, 14),
    buckets,
    countriesWorse,
    topMarketMovers: movers.slice(0, 8),
    rules: [
      "Only high-importance war, terror, movement, politics and serious crisis signals are shown.",
      "Low-magnitude earthquake noise, sports, marine warnings and generic junk are filtered out.",
      "Use Area Scan for a street/neighbourhood radius check."
    ]
  };
}
function getState() { return STATE.state; }
function getMapData() { return STATE.mapData; }
function addClient(res) { STATE.clients.add(res); }
function removeClient(res) { STATE.clients.delete(res); }
function broadcast(payload) { for (const res of STATE.clients) { try { res.write(`data: ${JSON.stringify(payload)}\n\n`); } catch {} } }
module.exports = { refreshState, getState, getMapData, addClient, removeClient };
