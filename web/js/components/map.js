(function () {
  const MODULE = {};

  let map = null;
  let regionLayer = null;
  let nodesLayer = null;
  let cityLayer = null;
  let localLayer = null;
  let eventsLayer = null;
  let seaLayer = null;
  let landLayer = null;
  let riskPointLayer = null;
  let crisisLayer = null;

  let countryGeoJson = null;
  let dotPanelOpen = false;
  let localTimer = null;
  let lastLocalKey = "";
  let lastEventIds = new Set();
  let audioCtx = null;

  window.SHOW_SEA = false;
  window.SHOW_LAND = false;
  window.SHOW_SAFETY = true;
  window.SME_LANG = localStorage.getItem("sme-language") || "en";

  const activeDotTypes = new Set(["war", "terror", "crisis", "risk"]);

  const colors = {
    war: "#ff174f",
    terror: "#ff8c00",
    crisis: "#ffffff",
    politics: "#b24cff",
    shipping: "#00d8ff",
    ai: "#00fff0",
    energy: "#00ff87",
    commodity: "#ffd94a",
    finance: "#3ea0ff",
    city: "#7aa7ff",
    risk: "#ff326a"
  };

  const uiText = {
    en: {
      home: "HOME",
      liveBrief: "LIVE BRIEF",
      predictions: "PREDICTIONS",
      crypto: "CRYPTO",
      commodities: "COMMODITIES",
      polymarket: "POLYMARKET",
      routes: "ROUTES",
      rapid: "RAPID MOVERS",
      safety: "SAFETY MAP",
      globalRisk: "GLOBAL RISK",
      crisis: "CRISIS",
      sources: "SOURCES",
      dots: "DOTS",
      refresh: "REFRESH",
      alert: "LIVE ALERT",
      open: "OPEN ON MAP",
      loadingRisk: "Loading crime, war, politics, crisis and money data..."
    },
    de: {
      home: "START",
      liveBrief: "LIVE-BRIEF",
      predictions: "PROGNOSEN",
      crypto: "KRYPTO",
      commodities: "ROHSTOFFE",
      polymarket: "POLYMARKET",
      routes: "ROUTEN",
      rapid: "BEWEGUNGEN",
      safety: "SICHERHEIT",
      globalRisk: "GLOBALRISIKO",
      crisis: "KRISE",
      sources: "QUELLEN",
      dots: "PUNKTE",
      refresh: "NEU LADEN",
      alert: "LIVE-ALARM",
      open: "AUF KARTE",
      loadingRisk: "Lade Kriminalität, Krieg, Politik, Krise und Märkte..."
    },
    es: {
      home: "INICIO",
      liveBrief: "RESUMEN",
      predictions: "PREDICCIONES",
      crypto: "CRIPTO",
      commodities: "MATERIAS",
      polymarket: "POLYMARKET",
      routes: "RUTAS",
      rapid: "MOVIMIENTOS",
      safety: "SEGURIDAD",
      globalRisk: "RIESGO GLOBAL",
      crisis: "CRISIS",
      sources: "FUENTES",
      dots: "PUNTOS",
      refresh: "ACTUALIZAR",
      alert: "ALERTA EN VIVO",
      open: "ABRIR EN MAPA",
      loadingRisk: "Cargando crimen, guerra, política, crisis y mercados..."
    },
    fr: {
      home: "ACCUEIL",
      liveBrief: "BRIEF",
      predictions: "PRÉVISIONS",
      crypto: "CRYPTO",
      commodities: "MATIÈRES",
      polymarket: "POLYMARKET",
      routes: "ROUTES",
      rapid: "MOUVEMENTS",
      safety: "SÉCURITÉ",
      globalRisk: "RISQUE GLOBAL",
      crisis: "CRISE",
      sources: "SOURCES",
      dots: "POINTS",
      refresh: "ACTUALISER",
      alert: "ALERTE LIVE",
      open: "OUVRIR SUR CARTE",
      loadingRisk: "Chargement criminalité, guerre, politique, crise et marchés..."
    },
    ar: {
      home: "الرئيسية",
      liveBrief: "ملخص",
      predictions: "توقعات",
      crypto: "عملات",
      commodities: "سلع",
      polymarket: "POLYMARKET",
      routes: "مسارات",
      rapid: "حركات",
      safety: "أمان",
      globalRisk: "خطر عالمي",
      crisis: "أزمة",
      sources: "مصادر",
      dots: "نقاط",
      refresh: "تحديث",
      alert: "تنبيه مباشر",
      open: "افتح على الخريطة",
      loadingRisk: "جار تحميل الجريمة والحرب والسياسة والأزمات والأسواق..."
    }
  };

  const conflictNames = new Set([
    "Ukraine",
    "Russia",
    "Syria",
    "Yemen",
    "Sudan",
    "Myanmar",
    "Afghanistan",
    "Israel",
    "Palestine",
    "Lebanon",
    "Somalia",
    "Mali",
    "Burkina Faso",
    "Niger",
    "Haiti"
  ]);

  const ports = [
    ["Shanghai", 31.23, 121.49],
    ["Singapore", 1.29, 103.85],
    ["Busan", 35.10, 129.04],
    ["Tokyo", 35.65, 139.77],
    ["Jebel Ali", 25.01, 55.06],
    ["Rotterdam", 51.95, 4.14],
    ["Antwerp", 51.22, 4.40],
    ["Hamburg", 53.55, 9.99],
    ["Felixstowe", 51.96, 1.35],
    ["Valencia", 39.45, -0.32],
    ["Piraeus", 37.94, 23.64],
    ["Genoa", 44.40, 8.93],
    ["Tangier Med", 35.89, -5.50],
    ["Suez", 30.59, 32.27],
    ["Djibouti", 11.59, 43.15],
    ["Jeddah", 21.49, 39.18],
    ["Mumbai", 18.95, 72.84],
    ["Colombo", 6.93, 79.84],
    ["Los Angeles", 33.74, -118.27],
    ["Long Beach", 33.76, -118.20],
    ["Seattle", 47.60, -122.33],
    ["Vancouver", 49.29, -123.12],
    ["New York", 40.68, -74.04],
    ["Savannah", 32.08, -81.09],
    ["Houston", 29.73, -95.26],
    ["Panama", 9.08, -79.68],
    ["Santos", -23.96, -46.33],
    ["Buenos Aires", -34.60, -58.37],
    ["Cape Town", -33.91, 18.43],
    ["Durban", -29.87, 31.02],
    ["Lagos", 6.46, 3.39],
    ["Mombasa", -4.04, 39.66],
    ["Melbourne", -37.84, 144.94],
    ["Sydney", -33.86, 151.20]
  ];

  const chokepoints = {
    Malacca: [1.43, 103.86],
    Suez: [30.59, 32.27],
    Hormuz: [26.57, 56.25],
    Bab: [12.60, 43.34],
    Panama: [9.08, -79.68],
    Gibraltar: [36.14, -5.35]
  };

  const landHubs = [
    ["London", 51.5, -0.12],
    ["Paris", 48.85, 2.35],
    ["Berlin", 52.52, 13.4],
    ["Warsaw", 52.23, 21.01],
    ["Kyiv", 50.45, 30.52],
    ["Istanbul", 41.01, 28.97],
    ["Baku", 40.41, 49.86],
    ["Tbilisi", 41.72, 44.79],
    ["Tehran", 35.69, 51.39],
    ["Dubai", 25.2, 55.27],
    ["Delhi", 28.61, 77.21],
    ["Tashkent", 41.31, 69.28],
    ["Almaty", 43.22, 76.85],
    ["Urumqi", 43.82, 87.62],
    ["Beijing", 39.9, 116.4],
    ["Shanghai", 31.23, 121.49],
    ["Bangkok", 13.75, 100.5],
    ["Singapore", 1.29, 103.85]
  ];

  function tx(key) {
    const language = window.SME_LANG || "en";
    return uiText[language]?.[key] || uiText.en[key] || key;
  }

  function init() {
    if (map) return;

    map = L.map("map", {
      preferCanvas: true,
      worldCopyJump: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      minZoom: 2.62,
      maxZoom: 16,
      zoomControl: true,
      attributionControl: true,
      maxBounds: [[-82, -179.95], [82, 179.95]],
      maxBoundsViscosity: 1
    }).setView([20, 12], 2.75);

    window.map = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      updateWhenIdle: false,
      updateWhenZooming: false,
      keepBuffer: 4
    }).addTo(map);

    regionLayer = L.layerGroup().addTo(map);
    seaLayer = L.layerGroup();
    landLayer = L.layerGroup();
    riskPointLayer = L.layerGroup().addTo(map);
    crisisLayer = L.layerGroup().addTo(map);
    nodesLayer = L.layerGroup().addTo(map);
    cityLayer = L.layerGroup().addTo(map);
    localLayer = L.layerGroup().addTo(map);
    eventsLayer = L.layerGroup().addTo(map);

    injectCss();
    bindControls();
    unlockAudio();
    applyLanguage();
    renderLegend();
    loadCountryRegions();

    map.on("click", async (event) => {
      await openGlobalRisk(event.latlng.lat, event.latlng.lng);
    });

    map.on("zoomend moveend", () => {
      renderEvents(window.APP_STATE?.events || []);
      renderCities(window.MAP_DATA?.cityNodes || []);
      fetchLocalPlaces();
    });

    setTimeout(resize, 250);
  }

  function bindControls() {
    document.addEventListener("change", (event) => {
      if (event.target?.id === "seaToggle") {
        window.SHOW_SEA = !!event.target.checked;
        renderRoutes(window.ROUTES || []);
      }

      if (event.target?.id === "landToggle") {
        window.SHOW_LAND = !!event.target.checked;
        renderRoutes(window.ROUTES || []);
      }

      if (event.target?.id === "safetyToggle") {
        window.SHOW_SAFETY = !!event.target.checked;
        renderCountryRegionColours();
      }

      if (event.target?.id === "languageSelect") {
        window.SME_LANG = event.target.value || "en";
        localStorage.setItem("sme-language", window.SME_LANG);
        applyLanguage();
      }

      if (event.target?.dataset?.dotType) {
        const type = event.target.dataset.dotType;

        if (event.target.checked) activeDotTypes.add(type);
        else activeDotTypes.delete(type);

        renderEvents(window.APP_STATE?.events || []);
        renderBase(window.MAP_DATA?.nodes || []);
        renderCities(window.MAP_DATA?.cityNodes || []);
        fetchLocalPlaces();
      }
    });

    document.getElementById("globalRiskButton")?.addEventListener("click", () => {
      showGlobalRiskIntro();
    });

    document.getElementById("weatherTrackerButton")?.addEventListener("click", async () => {
      await loadCrisis();
    });

    document.getElementById("dotToggleButton")?.addEventListener("click", () => {
      dotPanelOpen = !dotPanelOpen;
      renderDotTogglePanel();
    });

    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) {
      languageSelect.value = window.SME_LANG || "en";
    }
  }

  function applyLanguage() {
    const items = [
      ["homeMap", "home"],
      ["liveBriefButton", "liveBrief"],
      [null, "predictions", '[data-panel="predictions"]'],
      [null, "crypto", '[data-panel="crypto"]'],
      [null, "commodities", '[data-panel="commodities"]'],
      ["polymarketButton", "polymarket"],
      [null, "routes", '[data-panel="routes"]'],
      [null, "rapid", '[data-panel="rapid"]'],
      [null, "safety", '[data-panel="layers"]'],
      ["globalRiskButton", "globalRisk"],
      ["weatherTrackerButton", "crisis"],
      [null, "sources", '[data-panel="sources"]'],
      ["dotToggleButton", "dots"],
      ["refresh", "refresh"]
    ];

    for (const [id, key, selector] of items) {
      const el = id ? document.getElementById(id) : document.querySelector(selector);
      if (el) el.textContent = tx(key);
    }

    document.documentElement.lang = window.SME_LANG || "en";
    document.documentElement.dir = window.SME_LANG === "ar" ? "rtl" : "ltr";
  }

  function unlockAudio() {
    const unlock = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === "suspended") audioCtx.resume();
      } catch {}

      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
  }

  async function loadCountryRegions() {
    try {
      const data = await fetch("/api/boundaries/admin0").then((r) => r.json());
      countryGeoJson = data;
      renderCountryRegionColours();
    } catch (err) {
      console.warn("country regions failed", err);
    }
  }

  function renderCountryRegionColours() {
    if (!regionLayer) return;

    regionLayer.clearLayers();

    if (!window.SHOW_SAFETY || !countryGeoJson || !Array.isArray(countryGeoJson.features)) return;

    L.geoJSON(countryGeoJson, {
      style: (feature) => {
        const p = feature.properties || {};
        const name = p.name || p.admin || "";

        let fill = "#00a66a";
        let opacity = 0.045;

        if (matchesName(name, conflictNames)) {
          fill = "#ff174f";
          opacity = 0.32;
        } else if (/iran|north korea|venezuela|libya|pakistan|iraq/i.test(name)) {
          fill = "#ff8c00";
          opacity = 0.18;
        }

        return {
          color: fill,
          weight: 0,
          opacity: 0,
          fillColor: fill,
          fillOpacity: opacity,
          className: "country-map-colour"
        };
      },
      onEachFeature: (feature, layer) => {
        layer.on("click", async (event) => {
          L.DomEvent.stopPropagation(event);
          await openGlobalRisk(event.latlng.lat, event.latlng.lng);
        });
      }
    }).addTo(regionLayer);
  }

  function matchesName(name, set) {
    const n = String(name || "").toLowerCase();

    for (const x of set) {
      if (n.includes(String(x).toLowerCase())) return true;
    }

    return false;
  }

  function normalKind(kind) {
    if (["disaster", "weather", "earthquake", "quake"].includes(kind)) return "crisis";
    if (kind === "tech") return "ai";
    if (kind === "election") return "politics";
    return kind || "risk";
  }

  function dotAllowed(kind) {
    const actual = normalKind(kind);
    if (["war", "terror", "crisis", "risk"].includes(actual)) return true;
    return activeDotTypes.has(actual);
  }

  function icon(kind, flash = false) {
    const actual = normalKind(kind);

    return L.divIcon({
      className: "",
      html: `<div class="node-dot ${actual} ${flash ? "flash" : ""}"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  function localIcon(kind) {
    return L.divIcon({
      className: "",
      html: `<div class="local-dot ${kind || "place"}"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  }

  function crisisIcon(label, colour) {
    return L.divIcon({
      className: "",
      html: `<div class="crisis-dot" style="background:${colour};box-shadow:0 0 22px ${colour};">${label}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  function renderLegend() {
    const el = document.getElementById("legend");
    if (!el) return;

    const keys = {
      war: "war",
      terror: "terror",
      crisis: "crisis",
      politics: "politics",
      shipping: "shipping",
      ai: "AI",
      commodity: "commodity",
      energy: "energy",
      finance: "finance",
      city: "city"
    };

    el.innerHTML = Object.entries(keys)
      .map(([key, label]) => `<span><i style="background:${colors[key] || "#00d8ff"}"></i>${label}</span>`)
      .join("");
  }

  function renderDotTogglePanel() {
    let box = document.getElementById("dotTogglePanel");

    if (!dotPanelOpen) {
      if (box) box.remove();
      return;
    }

    if (!box) {
      box = document.createElement("div");
      box.id = "dotTogglePanel";
      box.className = "dot-toggle-panel";
      document.body.appendChild(box);
    }

    const types = [
      ["war", "War"],
      ["terror", "Terror"],
      ["crisis", "Crisis"],
      ["shipping", "Shipping"],
      ["ai", "AI"],
      ["commodity", "Commodity"],
      ["energy", "Energy"],
      ["finance", "Finance"],
      ["city", "Cities"],
      ["politics", "Politics"]
    ];

    box.innerHTML = `
      <h3>Dots</h3>
      <p>Vital dots stay on. Turn extra dots on only when needed.</p>
      ${types.map(([key, label]) => {
        const checked = activeDotTypes.has(key) ? "checked" : "";

        return `
          <label>
            <input type="checkbox" data-dot-type="${key}" ${checked}>
            <span><i style="background:${colors[key] || "#00d8ff"}"></i>${label}</span>
          </label>
        `;
      }).join("")}
    `;
  }

  function renderBase(nodes) {
    if (!nodesLayer) return;

    nodesLayer.clearLayers();

    for (const node of nodes || []) {
      const kind = normalKind(node.kind);
      if (!dotAllowed(kind)) continue;

      L.marker([node.lat, node.lng], {
        icon: icon(kind)
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);

          if (window.Renderers && typeof window.Renderers.renderNode === "function") {
            window.Renderers.renderNode(node);
          }
        })
        .addTo(nodesLayer);
    }

    renderLegend();
  }

  function renderCities(cities) {
    if (!cityLayer || !map) return;

    cityLayer.clearLayers();

    if (!activeDotTypes.has("city")) return;

    const zoom = map.getZoom();
    if (zoom < 4) return;

    const bounds = map.getBounds();
    const limit = zoom >= 11 ? 900 : zoom >= 9 ? 650 : zoom >= 7 ? 420 : zoom >= 5 ? 220 : 120;

    for (const city of (cities || []).filter((x) => bounds.pad(0.55).contains([x.lat, x.lng])).slice(0, limit)) {
      L.marker([city.lat, city.lng], {
        icon: icon(city.kind || "city")
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);

          if (window.Renderers && typeof window.Renderers.renderLocalPlace === "function") {
            window.Renderers.renderLocalPlace(city);
          }
        })
        .addTo(cityLayer);
    }
  }

  function renderLocalPlaces(places) {
    if (!localLayer || !map) return;

    localLayer.clearLayers();

    if (!activeDotTypes.has("city")) return;
    if (map.getZoom() < 6) return;

    const limit = map.getZoom() >= 12 ? 220 : map.getZoom() >= 10 ? 160 : 90;

    for (const place of (places || []).slice(0, limit)) {
      L.marker([place.lat, place.lng], {
        icon: localIcon(place.kind)
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);

          if (window.Renderers && typeof window.Renderers.renderLocalPlace === "function") {
            window.Renderers.renderLocalPlace(place);
          }
        })
        .addTo(localLayer);
    }
  }

  function fetchLocalPlaces() {
    clearTimeout(localTimer);

    localTimer = setTimeout(async () => {
      if (!map || map.getZoom() < 6 || !activeDotTypes.has("city")) {
        if (localLayer) localLayer.clearLayers();
        return;
      }

      const b = map.getBounds();
      const key = [
        b.getSouth().toFixed(2),
        b.getWest().toFixed(2),
        b.getNorth().toFixed(2),
        b.getEast().toFixed(2),
        Math.floor(map.getZoom())
      ].join(",");

      if (key === lastLocalKey) return;
      lastLocalKey = key;

      try {
        const url =
          `/api/local-places?south=${b.getSouth()}` +
          `&west=${b.getWest()}` +
          `&north=${b.getNorth()}` +
          `&east=${b.getEast()}` +
          `&zoom=${map.getZoom()}`;

        const data = await fetch(url).then((r) => r.json());
        renderLocalPlaces(data.places || []);
      } catch (err) {
        console.warn("local places failed", err);
        if (localLayer) localLayer.clearLayers();
      }
    }, 550);
  }

  function renderEvents(events, flashIds = new Set()) {
    if (!eventsLayer || !map) return;

    eventsLayer.clearLayers();

    const zoom = map.getZoom();
    const bounds = map.getBounds();

    const visible = (events || [])
      .filter((e) => dotAllowed(e.kind))
      .filter((e) => Number.isFinite(Number(e.lat)) && Number.isFinite(Number(e.lng)))
      .filter((e) => zoom < 4.5 || bounds.pad(0.55).contains([e.lat, e.lng]))
      .slice(0, zoom >= 10 ? 900 : zoom >= 8 ? 650 : zoom >= 6 ? 460 : 300);

    for (const event of visible) {
      const kind = normalKind(event.kind);

      L.marker([event.lat, event.lng], {
        icon: icon(kind, flashIds.has(event.id))
      })
        .on("click", (leafletEvent) => {
          L.DomEvent.stopPropagation(leafletEvent);
          openEventOnMap(event);
        })
        .addTo(eventsLayer);
    }
  }

  function generateTradeWeb() {
    const sea = [];
    const land = [];

    function findPort(name) {
      return ports.find((p) => p[0] === name);
    }

    function addSea(from, to, mids) {
      const a = findPort(from);
      const b = findPort(to);

      if (!a || !b) return;

      const middle = (mids || []).map((m) => chokepoints[m]).filter(Boolean);

      sea.push({
        id: `sea-${from}-${to}`.replace(/\s+/g, "-").toLowerCase(),
        type: "sea",
        name: `${from} → ${to}`,
        goods: "containers, oil, LNG, bulk goods",
        direction: "two-way",
        watch: ["freight", "ports", "insurance", "oil", "FX"],
        points: [[a[1], a[2]], ...middle, [b[1], b[2]]],
        color: "#00d8ff"
      });
    }

    function addLandByName(from, to) {
      const a = landHubs.find((p) => p[0] === from);
      const b = landHubs.find((p) => p[0] === to);

      if (!a || !b) return;

      land.push({
        id: `land-${from}-${to}`.replace(/\s+/g, "-").toLowerCase(),
        type: "land",
        name: `${from} → ${to}`,
        goods: "rail freight, trucks, energy, industrial goods",
        direction: "two-way",
        watch: ["FX", "diesel", "rail", "border delays"],
        points: [[a[1], a[2]], [b[1], b[2]]],
        color: "#ffd94a"
      });
    }

    const europe = ["Rotterdam", "Hamburg", "Antwerp", "Felixstowe", "Valencia", "Piraeus", "Genoa"];
    const asia = ["Shanghai", "Singapore", "Busan", "Tokyo", "Mumbai", "Colombo"];
    const usWest = ["Los Angeles", "Long Beach", "Seattle", "Vancouver"];
    const usEast = ["New York", "Savannah", "Houston"];

    for (const a of asia) {
      for (const e of europe) {
        addSea(a, e, ["Malacca", "Suez"]);
      }
    }

    for (const a of ["Shanghai", "Busan", "Tokyo"]) {
      for (const u of usWest) {
        addSea(a, u, []);
      }
    }

    for (const u of usEast) {
      for (const e of ["Rotterdam", "Antwerp", "Felixstowe"]) {
        addSea(u, e, []);
      }
    }

    addSea("Jebel Ali", "Rotterdam", ["Hormuz", "Suez"]);
    addSea("Jebel Ali", "Singapore", ["Hormuz", "Malacca"]);
    addSea("Jeddah", "Singapore", ["Bab", "Malacca"]);
    addSea("Santos", "Rotterdam", []);
    addSea("Buenos Aires", "Rotterdam", []);
    addSea("Cape Town", "Rotterdam", []);
    addSea("Durban", "Singapore", []);
    addSea("Lagos", "Rotterdam", []);
    addSea("Mombasa", "Singapore", []);
    addSea("Melbourne", "Singapore", []);
    addSea("Sydney", "Singapore", []);
    addSea("Panama", "New York", []);
    addSea("Panama", "Los Angeles", []);
    addSea("Panama", "Shanghai", []);

    for (let i = 0; i < landHubs.length - 1; i++) {
      addLandByName(landHubs[i][0], landHubs[i + 1][0]);
    }

    addLandByName("London", "Paris");
    addLandByName("Paris", "Berlin");
    addLandByName("Berlin", "Warsaw");
    addLandByName("Warsaw", "Kyiv");
    addLandByName("Istanbul", "Baku");
    addLandByName("Baku", "Tbilisi");
    addLandByName("Tbilisi", "Tehran");
    addLandByName("Tehran", "Dubai");
    addLandByName("Tashkent", "Almaty");
    addLandByName("Almaty", "Urumqi");
    addLandByName("Urumqi", "Beijing");
    addLandByName("Beijing", "Shanghai");
    addLandByName("Bangkok", "Singapore");

    return { sea, land };
  }

  function renderRoutes(routes) {
    if (!map || !seaLayer || !landLayer) return;

    if (map.hasLayer(seaLayer)) map.removeLayer(seaLayer);
    if (map.hasLayer(landLayer)) map.removeLayer(landLayer);

    seaLayer.clearLayers();
    landLayer.clearLayers();

    if (window.SHOW_SEA) seaLayer.addTo(map);
    if (window.SHOW_LAND) landLayer.addTo(map);

    if (!window.SHOW_SEA && !window.SHOW_LAND) return;

    const web = generateTradeWeb();

    const allRoutes = [
      ...(routes || []),
      ...(window.SHOW_SEA ? web.sea : []),
      ...(window.SHOW_LAND ? web.land : [])
    ];

    for (const route of allRoutes) {
      if (!Array.isArray(route.points) || route.points.length < 2) continue;
      if (route.type === "sea" && !window.SHOW_SEA) continue;
      if (route.type === "land" && !window.SHOW_LAND) continue;

      const layer = route.type === "sea" ? seaLayer : landLayer;
      const points = route.points.map((p) => [p[0], p[1]]);
      const colour = route.color || (route.type === "sea" ? "#00d8ff" : "#ffd94a");

      L.polyline(points, {
        color: colour,
        weight: 1.15,
        opacity: route.id?.startsWith("sea-") || route.id?.startsWith("land-") ? 0.38 : 0.78,
        className: route.type === "sea" ? "moving-route sea-route thin-trade-line" : "moving-route land-route thin-trade-line"
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);

          if (window.Renderers && typeof window.Renderers.renderRoute === "function") {
            window.Renderers.renderRoute(route);
          }
        })
        .addTo(layer);
    }
  }

  function setData(mapData, state) {
    window.MAP_DATA = mapData || {};
    window.ROUTES = mapData?.routes || [];

    window.SHOW_SEA = false;
    window.SHOW_LAND = false;
    window.SHOW_SAFETY = true;

    if (map && seaLayer && map.hasLayer(seaLayer)) map.removeLayer(seaLayer);
    if (map && landLayer && map.hasLayer(landLayer)) map.removeLayer(landLayer);

    renderCountryRegionColours();
    renderBase(mapData?.nodes || []);
    renderCities(mapData?.cityNodes || []);
    fetchLocalPlaces();
    renderRoutes(mapData?.routes || []);
    renderEvents(state?.events || []);

    setTimeout(resize, 250);
  }

  async function openContext(lat, lng, zoom = null) {
    await openGlobalRisk(Number(lat), Number(lng), zoom);
  }

  async function openGlobalRisk(lat, lng, zoom = null) {
    if (!map) return;

    if (zoom) {
      map.setView([lat, lng], Math.max(map.getZoom(), zoom));
    }

    riskPointLayer.clearLayers();

    setInfo(tx("globalRisk"), `
      <div class="info-card loading-card">
        <h3>${tx("globalRisk")}</h3>
        <div class="loader-bar"><span></span></div>
        <p class="plain">${tx("loadingRisk")}</p>
      </div>
    `, "risk");

    try {
      const data = await fetch(`/api/global-risk/point?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`).then((r) => r.json());
      renderGlobalRisk(data, lat, lng);
    } catch (err) {
      console.error(err);

      setInfo(tx("globalRisk"), `
        <div class="info-card">
          <h3>${tx("globalRisk")}</h3>
          <div class="index-grid real-indexes">
            <div class="index-tile grey">
              <div class="label">Risk</div>
              <div class="num">N/A</div>
              <div class="tag">source failed</div>
            </div>
          </div>
        </div>
      `, "risk");
    }
  }

  function renderGlobalRisk(data, lat, lng) {
    const scores = data.scores || {};
    const place = data.place || {};
    const name = [place.city, place.state, place.country].filter(Boolean).join(", ") || data.countryName || "Selected area";

    L.circle([lat, lng], {
      radius: 1600,
      color: "#00d8ff",
      fillColor: "#00d8ff",
      fillOpacity: 0.10,
      weight: 2
    }).addTo(riskPointLayer);

    const localCrime = data.localCrime || {};
    const homicide = data.national?.homicide;

    const localCrimeLine = localCrime.available
      ? `${localCrime.total} official local crimes, ${localCrime.date}`
      : "N/A, no official local crime feed connected here";

    const events = [
      ...(data.warEvents || []).slice(0, 3).map((x) => ({ ...x, type: "War" })),
      ...(data.politicalEvents || []).slice(0, 3).map((x) => ({ ...x, type: "Politics" })),
      ...(data.terrorEvents || []).slice(0, 3).map((x) => ({ ...x, type: "Terror" })),
      ...(data.disasters || []).slice(0, 3).map((x) => ({ ...x, type: "Crisis" })),
      ...(data.earthquakes || []).slice(0, 3).map((x) => ({ ...x, type: "Crisis" }))
    ];

    const eventsHtml = events.length
      ? events.map((event) => `
          <div class="quick-item">
            <b>${escapeHtml(event.type)}:</b>
            ${event.url ? `<a href="${escapeAttr(event.url)}" target="_blank" rel="noopener">${escapeHtml(event.title || event.summary || "source")}</a>` : escapeHtml(event.title || event.summary || "source")}
            ${event.originalTitle ? `<br><span class="source-line">Original: ${escapeHtml(event.originalTitle)}</span>` : ""}
          </div>
        `).join("")
      : `<div class="quick-item"><b>Events:</b> low current source signal.</div>`;

    setInfo(tx("globalRisk"), `
      <div class="info-card">
        <h3>${escapeHtml(name)}</h3>
        <p class="source-line">Source-backed. Estimated tiles are labelled.</p>

        <div class="index-grid real-indexes">
          ${scoreTile("Safety", scores.safety?.score, scores.safety?.status, scores.safety?.reason)}
          ${scoreTile("Crime", scores.crime?.score, scores.crime?.status, scores.crime?.reason)}
          ${estimateTile("War", scores.war)}
          ${estimateTile("Politics", scores.politics)}
          ${estimateTile("Terror", scores.terror)}
          ${estimateTile("Crisis", scores.crisis)}
          ${scoreTile("Money", scores.money?.score, scores.money?.status, scores.money?.reason)}
        </div>

        <div class="quick-list">
          <div class="quick-item"><b>Local crime:</b> ${escapeHtml(localCrimeLine)}</div>
          <div class="quick-item"><b>National crime:</b> ${
            homicide?.value !== null && homicide?.value !== undefined
              ? `${Number(homicide.value).toFixed(1)} homicides / 100k, ${escapeHtml(homicide.year)}`
              : "N/A"
          }</div>
          <div class="quick-item"><b>Weather now:</b> ${weatherSummary(data.weather)}</div>
          <div class="quick-item yellow"><b>Rule:</b> no fake local crime numbers.</div>
        </div>
      </div>

      <div class="info-card">
        <h3>Source hits</h3>
        <div class="quick-list">${eventsHtml}</div>
      </div>
    `, "risk");
  }

  function scoreTile(label, value, tag, source) {
    const empty = value === null || value === undefined || Number.isNaN(Number(value));
    const v = empty ? "N/A" : Math.round(Number(value));
    const cls = empty ? "grey" : v >= 75 ? "green" : v >= 55 ? "yellow" : v >= 35 ? "orange" : "red";

    return `
      <div class="index-tile ${cls}">
        <div class="label">${escapeHtml(label)}</div>
        <div class="num">${escapeHtml(v)}</div>
        <div class="tag">${escapeHtml(tag || (empty ? "No data" : "Measured"))}</div>
        <div class="mini-source">${escapeHtml(source || "source-backed")}</div>
      </div>
    `;
  }

  function estimateTile(label, section) {
    const value = section?.display || "LOW";
    const estimated = section?.estimated ? " (estimated)" : "";
    const cls =
      section?.value >= 70 ? "red" :
      section?.value >= 45 ? "orange" :
      section?.value >= 1 ? "yellow" :
      "green";

    return `
      <div class="index-tile ${cls}">
        <div class="label">${escapeHtml(label)}</div>
        <div class="num small-num">${escapeHtml(value)}</div>
        <div class="tag">${escapeHtml((section?.status || "Low signal") + estimated)}</div>
        <div class="mini-source">${escapeHtml(section?.reason || "connected sources")}</div>
      </div>
    `;
  }

  async function loadCrisis() {
    crisisLayer.clearLayers();

    setInfo(tx("crisis"), `
      <div class="info-card loading-card">
        <h3>${tx("crisis")}</h3>
        <div class="loader-bar"><span></span></div>
        <p class="plain">Loading USGS earthquakes and GDACS disaster alerts...</p>
      </div>
    `, "crisis");

    const [quakeData, disasterData] = await Promise.all([
      fetch("/api/global-weather/earthquakes").then((r) => r.json()).catch(() => ({ earthquakes: [] })),
      fetch("/api/global-weather/disasters").then((r) => r.json()).catch(() => ({ disasters: [] }))
    ]);

    const earthquakes = quakeData.earthquakes || [];
    const disasters = disasterData.disasters || [];

    for (const q of earthquakes) {
      if (q.lat === null || q.lng === null) continue;

      L.marker([q.lat, q.lng], {
        icon: crisisIcon("Q", "#ff174f")
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          map.setView([q.lat, q.lng], Math.max(map.getZoom(), 6));

          setInfo(tx("crisis"), `
            <div class="info-card">
              <h3>${escapeHtml(q.title || "Earthquake")}</h3>
              <div class="quick-list">
                <div class="quick-item"><b>Magnitude:</b> ${escapeHtml(q.magnitude ?? "N/A")}</div>
                <div class="quick-item"><b>Place:</b> ${escapeHtml(q.place || "N/A")}</div>
                <div class="quick-item"><b>Depth:</b> ${escapeHtml(q.depthKm ?? "N/A")} km</div>
                <div class="quick-item"><b>Time:</b> ${escapeHtml(q.time || "N/A")}</div>
              </div>
              <p class="source-box">${q.url ? `<a href="${escapeAttr(q.url)}" target="_blank" rel="noopener">USGS source</a>` : "USGS"}</p>
            </div>
          `, "crisis");
        })
        .addTo(crisisLayer);
    }

    for (const d of disasters) {
      if (d.lat === null || d.lng === null) continue;

      L.marker([d.lat, d.lng], {
        icon: crisisIcon("!", "#ffffff")
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          map.setView([d.lat, d.lng], Math.max(map.getZoom(), 6));

          setInfo(tx("crisis"), `
            <div class="info-card">
              <h3>${escapeHtml(d.title || "Disaster")}</h3>
              <p class="plain">${escapeHtml(d.summary || "GDACS disaster alert")}</p>
              <p class="source-box">${d.url ? `<a href="${escapeAttr(d.url)}" target="_blank" rel="noopener">GDACS source</a>` : "GDACS"}</p>
            </div>
          `, "crisis");
        })
        .addTo(crisisLayer);
    }

    setInfo(tx("crisis"), `
      <div class="info-card">
        <h3>${tx("crisis")}</h3>
        <div class="index-grid real-indexes">
          ${estimateTile("Earthquakes", { display: String(earthquakes.length), value: earthquakes.length, status: "USGS 24h", estimated: false, reason: "USGS feed" })}
          ${estimateTile("Disasters", { display: String(disasters.length), value: disasters.length, status: "GDACS", estimated: false, reason: "GDACS feed" })}
        </div>
        <p class="plain">Click a crisis dot, or click the map for point risk and weather.</p>
      </div>
    `, "crisis");

    showToast("Crisis data loaded");
  }

  function usefulEvent(event) {
    const kind = normalKind(event.kind);
    if (["war", "terror", "crisis", "risk"].includes(kind)) return true;

    const text = `${event.title || ""} ${event.summary || ""}`.toLowerCase();

    return /war|missile|drone|attack|earthquake|flood|storm|tornado|coup|sanction|riot|protest|port|suez|hormuz|malacca|shipping|pipeline|oil|gas|lng|gold|copper|central bank|inflation/.test(text);
  }

  async function openEventOnMap(event) {
    let lat = Number(event.lat);
    let lng = Number(event.lng);

    const placeQuery = [event.place, event.country, event.title].filter(Boolean).join(" ");

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || looksWrongEventLocation(event)) {
      try {
        const geo = await fetch(`/api/geocode/place?q=${encodeURIComponent(placeQuery)}`).then((r) => r.json());

        if (geo.ok && Number.isFinite(Number(geo.lat)) && Number.isFinite(Number(geo.lng))) {
          lat = Number(geo.lat);
          lng = Number(geo.lng);
        }
      } catch (err) {
        console.warn("event geocode failed", err);
      }
    }

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], Math.max(map.getZoom(), 7));
    }

    if (window.Renderers && typeof window.Renderers.renderEvent === "function") {
      window.Renderers.renderEvent(event);
    }

    try {
      const local = await fetch(`/api/global-events/local?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`).then((r) => r.json());
      const articles = local.articles || [];
      const body = document.getElementById("infoBody");

      if (body && articles.length) {
        body.insertAdjacentHTML("beforeend", `
          <div class="info-card">
            <h3>Local news near alert</h3>
            <div class="quick-list">
              ${articles.slice(0, 8).map((a) => `
                <div class="quick-item">
                  <a href="${escapeAttr(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.title)}</a>
                  ${a.originalTitle ? `<br><span class="source-line">Original: ${escapeHtml(a.originalTitle)}</span>` : ""}
                  <br><span class="source-line">${escapeHtml(a.source || "GDELT")}</span>
                </div>
              `).join("")}
            </div>
          </div>
        `);
      }
    } catch (err) {
      console.warn("local news failed", err);
    }
  }

  function looksWrongEventLocation(event) {
    const title = String(event.title || "").toLowerCase();
    const place = String(event.place || event.country || "").toLowerCase();

    if (title.includes("korea") && !place.includes("korea")) return true;
    if (title.includes("iran") && !place.includes("iran")) return true;
    if (title.includes("russia") && !place.includes("russia")) return true;
    if (title.includes("ukraine") && !place.includes("ukraine")) return true;

    return false;
  }

  function showGlobalRiskIntro() {
    setInfo(tx("globalRisk"), `
      <div class="info-card">
        <h3>${tx("globalRisk")}</h3>
        <p class="plain">Click anywhere on the map.</p>
        <div class="quick-list">
          <div class="quick-item"><b>Crime:</b> official local feed where available, otherwise national homicide rate or N/A.</div>
          <div class="quick-item"><b>War:</b> GDELT live hits + labelled baseline estimate.</div>
          <div class="quick-item"><b>Politics:</b> GDELT live hits + labelled baseline estimate.</div>
          <div class="quick-item"><b>Crisis:</b> USGS, GDACS, Open-Meteo + labelled estimate.</div>
          <div class="quick-item yellow"><b>Rule:</b> no fake local crime numbers.</div>
        </div>
      </div>
    `, "risk");
  }

  function newEvent(event) {
    if (!event || lastEventIds.has(event.id)) return;
    if (!usefulEvent(event)) return;

    lastEventIds.add(event.id);

    const title = window.Renderers && typeof window.Renderers.plainEventTitle === "function"
      ? window.Renderers.plainEventTitle(event)
      : event.title;

    showToast(title, event);
    beep();
    renderEvents(window.APP_STATE?.events || [], new Set([event.id]));
  }

  function showToast(text, event = null) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerHTML =
      `<button class="toast-close" id="toastClose">×</button>` +
      `<div class="a-title">${tx("alert")}</div>` +
      `<div class="a-meta">${escapeHtml(String(text || "Source-backed event").slice(0, 190))}</div>` +
      (event ? `<button id="liveAlertGo">${tx("open")}</button>` : "");

    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");

    const close = document.getElementById("toastClose");
    if (close) close.onclick = () => toast.classList.remove("show");

    const btn = document.getElementById("liveAlertGo");
    if (btn && event) btn.onclick = () => openEventOnMap(event);

    setTimeout(() => toast.classList.remove("show"), 18000);
  }

  function beep() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === "suspended") audioCtx.resume();

      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.045;

      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();

      setTimeout(() => {
        oscillator.frequency.value = 1180;
      }, 90);

      setTimeout(() => {
        oscillator.stop();
      }, 290);
    } catch (err) {
      console.warn("audio blocked", err);
    }
  }

  function setInfo(title, html, type) {
    if (window.Panels && typeof window.Panels.setInfo === "function") {
      window.Panels.setInfo(title, html, type);
      return;
    }

    const panel = document.getElementById("infoPanel");
    const titleEl = document.getElementById("infoTitle");
    const body = document.getElementById("infoBody");

    if (panel) panel.classList.add("open");
    if (titleEl) titleEl.textContent = title;
    if (body) body.innerHTML = html;
  }

  function goHome() {
    if (!map) return;

    if (window.Panels && typeof window.Panels.closeAll === "function") {
      window.Panels.closeAll();
    }

    riskPointLayer.clearLayers();
    crisisLayer.clearLayers();

    map.setView([20, 12], 2.75);
    setTimeout(resize, 120);
  }

  function resize() {
    if (!map) return;

    map.invalidateSize();

    setTimeout(() => {
      map.invalidateSize();
    }, 220);
  }

  function weatherSummary(weather) {
    if (!weather || !weather.current) return "N/A";

    const c = weather.current;

    return `${c.temperatureC ?? "N/A"}°C, wind ${c.windKmh ?? "N/A"} km/h, gust ${c.gustKmh ?? "N/A"} km/h, rain ${c.precipitationMm ?? "N/A"} mm`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (match) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[match]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }

  function injectCss() {
    if (document.getElementById("smeStableMapCss")) return;

    const style = document.createElement("style");
    style.id = "smeStableMapCss";

    style.textContent = `
      .boot-error {
        color: #ff3860;
        font-family: monospace;
        padding: 20px;
        white-space: pre-wrap;
      }

      .leaflet-tile-pane {
        filter: saturate(1.15) hue-rotate(170deg) brightness(0.72) contrast(1.1);
      }

      .country-map-colour {
        pointer-events: auto;
        mix-blend-mode: screen;
      }

      .left-map-tools {
        position: absolute;
        left: 12px;
        top: 268px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .left-map-tools button {
        background: rgba(0, 24, 40, 0.95);
        border: 1px solid #00d8ff;
        color: #e8fbff;
        padding: 7px 9px;
        font-weight: 900;
        cursor: pointer;
        font-size: 11px;
      }

      .node-dot.terror {
        background: #ff8c00 !important;
        box-shadow: 0 0 14px rgba(255, 140, 0, 0.75);
      }

      .node-dot.war {
        background: #ff174f !important;
        box-shadow: 0 0 14px rgba(255, 23, 79, 0.75);
      }

      .node-dot.crisis {
        background: #ffffff !important;
        border: 2px solid #ff174f;
        box-shadow: 0 0 16px rgba(255, 255, 255, 0.95);
      }

      .node-dot.ai {
        background: #00fff0 !important;
        box-shadow: 0 0 14px rgba(0, 255, 240, 0.75);
      }

      .node-dot.politics {
        background: #b24cff !important;
        box-shadow: 0 0 14px rgba(178, 76, 255, 0.75);
      }

      .crisis-dot {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        color: #111;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        border: 2px solid #ff174f;
        font-size: 13px;
        animation: crisisPulse 1s infinite;
      }

      @keyframes crisisPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.22); opacity: 0.86; }
        100% { transform: scale(1); opacity: 1; }
      }

      .dot-toggle-panel {
        position: fixed;
        left: 12px;
        top: 360px;
        z-index: 9999;
        width: 180px;
        background: rgba(0, 17, 31, 0.96);
        border: 1px solid #00d8ff;
        color: #e8fbff;
        padding: 10px;
        font-family: Inter, Arial, sans-serif;
        box-shadow: 0 0 18px rgba(0,216,255,0.28);
      }

      .dot-toggle-panel h3 {
        margin: 0 0 6px;
        color: #00eaff;
      }

      .dot-toggle-panel p {
        margin: 0 0 8px;
        color: #9ec7d5;
        font-size: 11px;
        line-height: 1.25;
      }

      .dot-toggle-panel label {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 6px 0;
        font-size: 12px;
        cursor: pointer;
      }

      .dot-toggle-panel i {
        display: inline-block;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        margin-right: 5px;
      }

      .thin-trade-line {
        stroke-dasharray: 1 11;
        animation: tradeFlow 16s linear infinite;
      }

      .sea-route {
        stroke-dasharray: 2 13;
        animation: tradeFlow 18s linear infinite;
      }

      .land-route {
        stroke-dasharray: 2 10;
        animation: tradeFlow 14s linear infinite;
      }

      @keyframes tradeFlow {
        to {
          stroke-dashoffset: -120;
        }
      }

      .loader-bar {
        height: 8px;
        background: rgba(0,216,255,0.15);
        border: 1px solid rgba(0,216,255,0.4);
        overflow: hidden;
        margin: 10px 0;
      }

      .loader-bar span {
        display: block;
        width: 38%;
        height: 100%;
        background: #00eaff;
        animation: loadSlide 1s infinite linear;
      }

      @keyframes loadSlide {
        0% {
          transform: translateX(-100%);
        }

        100% {
          transform: translateX(280%);
        }
      }

      .small-num {
        font-size: 26px !important;
      }

      .toast-close {
        position: absolute;
        top: 5px;
        right: 7px;
        border: 1px solid #00d8ff;
        background: #001f32;
        color: #fff;
        width: 24px;
        height: 24px;
        cursor: pointer;
        font-weight: 900;
      }

      #toast {
        position: relative;
      }

      #toast button#liveAlertGo {
        margin-top: 8px;
        border: 1px solid #00d8ff;
        background: #001f32;
        color: #fff;
        padding: 6px 9px;
        font-weight: 800;
        cursor: pointer;
      }

      .tv-wrap {
        width: 100%;
        min-height: 320px;
        margin: 12px 0;
        border: 1px solid rgba(0,216,255,0.35);
        background: #001827;
      }
    `;

    document.head.appendChild(style);
  }

  MODULE.init = init;
  MODULE.setData = setData;
  MODULE.newEvent = newEvent;
  MODULE.resize = resize;
  MODULE.goHome = goHome;
  MODULE.openContext = openContext;
  MODULE.renderEvents = renderEvents;
  MODULE.renderCities = renderCities;
  MODULE.renderRoutes = renderRoutes;
  MODULE.renderRiskRegions = renderCountryRegionColours;
  MODULE.renderSafetyRegions = renderCountryRegionColours;
  MODULE.renderConflictCountries = renderCountryRegionColours;
  MODULE.renderSafetyCountries = renderCountryRegionColours;

  window.MoneyMap = MODULE;
  window.dispatchEvent(new Event("MoneyMapReady"));
})();
