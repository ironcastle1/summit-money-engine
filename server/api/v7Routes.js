const express = require("express");
const { refreshState } = require("../core/stateStore");
const { searchPlaces } = require("../collectors/placeCollectors");
const { runAreaScan } = require("../services/areaScanService");
const { listHealth } = require("../core/sourceHealth");
const { productFeatureMatrix } = require("../v7/productFeatureMatrix");
const { queryDecisionLibrary, securityDecisionLibrary } = require("../v7/securityDecisionLibrary");
const { buildOfflinePack } = require("../v6/offlinePackService");

const router = express.Router();

function safePercent(scan) {
  const verdict = scan && (scan.verdict || scan.radiusVerdict || scan.summary || {});
  if (Number.isFinite(Number(verdict.safePercent))) return Number(verdict.safePercent);
  const text = JSON.stringify(scan || {}).toLowerCase();
  let unsafe = 15;
  if (text.includes("war") || text.includes("missile") || text.includes("shelling")) unsafe += 40;
  if (text.includes("terror") || text.includes("active attacker")) unsafe += 35;
  if (text.includes("avoid all travel") || text.includes("do not travel")) unsafe += 35;
  if (text.includes("airport closed") || text.includes("border closed")) unsafe += 15;
  return Math.max(8, Math.min(92, 100 - unsafe));
}

router.get("/console", async (req, res) => {
  const state = await refreshState(false);
  const health = listHealth();
  const counts = (state.events || []).reduce((acc, e) => {
    const key = e.kind || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  res.json({
    generatedAt: new Date().toISOString(),
    product: "Summit Security Companion v7",
    features: productFeatureMatrix,
    activeSignalCounts: counts,
    sourceHealth: health,
    visibleValue: [
      "area scan turns a search into a radius intelligence card",
      "route planner compares origin and destination risk before movement",
      "watch zones store important locations client-side for repeated checks",
      "offline pack produces a field checklist and country/place pack",
      "threat matrix explains what to check for each threat and country"
    ]
  });
});

router.post("/route-safety", async (req, res) => {
  const body = req.body || {};
  const from = String(body.from || body.origin || "").trim();
  const to = String(body.to || body.destination || "").trim();
  const radiusMiles = Number(body.radiusMiles || 5);
  if (!from || !to) return res.status(400).json({ ok: false, error: "from and to required" });
  const [origin, destination] = await Promise.all([
    runAreaScan({ query: from, radiusMiles, filter: "security" }),
    runAreaScan({ query: to, radiusMiles, filter: "security" })
  ]);
  const s1 = safePercent(origin), s2 = safePercent(destination);
  const routeSafe = Math.round((s1 + s2) / 2);
  const routeRisk = 100 - routeSafe;
  const verdict = routeSafe >= 75 ? "GO WITH NORMAL CHECKS" : routeSafe >= 55 ? "GO ONLY AFTER CHECKS" : routeSafe >= 35 ? "HIGH CAUTION" : "DO NOT MOVE WITHOUT LOCAL CONFIRMATION";
  res.json({
    ok: true, from, to, radiusMiles, origin, destination,
    route: {
      safePercent: routeSafe, unsafePercent: routeRisk, verdict,
      decision: [
        "Confirm latest local source before departure",
        "Check destination hospital/police/fuel access",
        "Check airport/border/road disruption within both scan circles",
        "Keep backup cash/comms/charged phone and offline map"
      ],
      mapLine: origin.target && destination.target ? [[origin.target.lat, origin.target.lng], [destination.target.lat, destination.target.lng]] : []
    }
  });
});

router.post("/watch-evaluate", async (req, res) => {
  const zones = Array.isArray(req.body && req.body.zones) ? req.body.zones : [];
  const radiusMiles = Number(req.body && req.body.radiusMiles || 5);
  const results = [];
  for (const z of zones.slice(0, 12)) {
    const query = String(z.query || z.name || "").trim();
    if (!query) continue;
    try {
      const scan = await runAreaScan({ query, radiusMiles: Number(z.radiusMiles || radiusMiles), filter: z.filter || "security" });
      results.push({ zone: z, scan, safePercent: safePercent(scan) });
    } catch (err) {
      results.push({ zone: z, error: err.message, safePercent: null });
    }
  }
  res.json({ ok: true, results });
});

router.post("/offline-pack", (req, res) => {
  const body = req.body || {};
  const pack = buildOfflinePack({
    place: body.place || body.query || "Selected destination",
    country: body.country || "",
    radiusMiles: body.radiusMiles || 5,
    mode: body.mode || "travel-security"
  });
  res.json({ ok: true, pack });
});

router.get("/threat-matrix", (req, res) => {
  const { country, iso2, threat, limit } = req.query;
  res.json({
    ok: true,
    countTotal: securityDecisionLibrary.length,
    rows: queryDecisionLibrary({ country, iso2, threat, limit: Number(limit || 60) })
  });
});

router.get("/feature-matrix", (req,res)=>res.json({ ok:true, features: productFeatureMatrix }));
router.get("/place-suggest", async (req,res)=>res.json({ ok:true, places: await searchPlaces(String(req.query.q||"")) }));
module.exports = router;
