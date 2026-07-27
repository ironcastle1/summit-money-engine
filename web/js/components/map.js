window.MoneyMap = (() => {
  let map;
  let regionLayer;
  let nodesLayer;
  let cityLayer;
  let localLayer;
  let eventsLayer;
  let seaLayer;
  let landLayer;
  let riskPointLayer;
  let crisisLayer;

  let countryGeoJson = null;
  let currentMode = null;
  let dotPanelOpen = false;
  let localTimer = null;
  let lastLocalKey = "";
  let lastEventIds = new Set();
  let language = localStorage.getItem("sme-language") || "en";

  window.SHOW_SEA = false;
  window.SHOW_LAND = false;
  window.SHOW_SAFETY = true;

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

  const labels = {
    en: {
      globalRisk: "Global Risk",
      crisis: "Crisis",
      loading: "Loading",
      localCrime: "Local crime",
      nationalCrime: "National crime",
      sourceHits: "Source hits",
      noFake: "No fake local crime numbers.",
      estimated: "estimated",
      noImage: "No Wikipedia image found for this place. No fake picture shown."
    },
    es: {
      globalRisk: "Riesgo global",
      crisis: "Crisis",
      loading: "Cargando",
      localCrime: "Crimen local",
      nationalCrime: "Crimen nacional",
      sourceHits: "Fuentes",
      noFake: "No se inventan cifras locales.",
      estimated: "estimado",
      noImage: "No se encontró imagen de Wikipedia."
    },
    fr: {
      globalRisk: "Risque global",
      crisis: "Crise",
      loading: "Chargement",
      localCrime: "Criminalité locale",
      nationalCrime: "Criminalité nationale",
      sourceHits: "Sources",
      noFake: "Aucun chiffre local inventé.",
      estimated: "estimé",
      noImage: "Aucune image Wikipedia trouvée."
    },
    de: {
      globalRisk: "Globales Risiko",
      crisis: "Krise",
      loading: "Laden",
      localCrime: "Lokale Kriminalität",
      nationalCrime: "Nationale Kriminalität",
      sourceHits: "Quellen",
      noFake: "Keine erfundenen lokalen Zahlen.",
      estimated: "geschätzt",
      noImage: "Kein Wikipedia-Bild gefunden."
    },
    ar: {
      globalRisk: "المخاطر العالمية",
      crisis: "أزمة",
      loading: "جار التحميل",
      localCrime: "الجريمة المحلية",
      nationalCrime: "الجريمة الوطنية",
      sourceHits: "مصادر",
      noFake: "لا توجد أرقام محلية مزيفة.",
      estimated: "تقديري",
      noImage: "لا توجد صورة من ويكيبيديا."
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

  function t(key) {
    return labels[language]?.[key] || labels.en[key] || key;
  }

  function init() {
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

    map.on("click", async (event) => {
      await openGlobalRisk(event.latlng.lat, event.latlng.lng);
    });

    map.on("zoomend moveend", () => {
      renderEvents(window.APP_STATE?.events || []);
      renderCities(window.MAP_DATA?.cityNodes || []);
      fetchLocalPlaces();
    });

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
        language = event.target.value || "en";
        localStorage.setItem("sme-language", language);
        showToast(`Language: ${event.target.options[event.target.selectedIndex].text}`);
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
      currentMode = currentMode === "risk" ? null : "risk";
      setButtonModes();
      showGlobalRiskIntro();
    });

    document.getElementById("weatherTrackerButton")?.addEventListener("click", async () => {
      currentMode = currentMode === "crisis" ? null : "crisis";
      setButtonModes();
      if (currentMode === "crisis") await loadCrisis();
      else crisisLayer.clearLayers();
    });

    document.getElementById("dotToggleButton")?.addEventListener("click", () => {
      dotPanelOpen = !dotPanelOpen;
      renderDotTogglePanel();
    });

    document.getElementById("refresh")?.addEventListener("click", () => {
      location.reload();
    });

    document.getElementById("liveBriefButton")?.addEventListener("click", () => {
      setTimeout(renderLiveBrief, 80);
    });

    document.getElementById("polymarketButton")?.addEventListener("click", () => {
      setTimeout(renderPlainPolymarket, 80);
    });

    const languageSelect = document.getElementById("languageSelect");
    if (languageSelect) languageSelect.value = language;

    injectCss();
    renderLegend();
    loadCountryRegions();
    setTimeout(resize, 250);
  }

  function setButtonModes() {
    document.getElementById("globalRiskButton")?.classList.toggle("active", currentMode === "risk");
    document.getElementById("weatherTrackerButton")?.classList.toggle("active", currentMode === "crisis");
  }

  async function loadCountryRegions() {
    try {
      const data = await fetch("/api/boundaries/admin0").then((r) => r.json());
      countryGeoJson = data;
      renderCountryRegionColours();
    } catch {
      countryGeoJson = null;
    }
  }

  function renderCountryRegionColours() {
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
      ${types
        .map(([key, label]) => {
          const checked = activeDotTypes.has(key) ? "checked" : "";
          return `
            <label>
              <input type="checkbox" data-dot-type="${key}" ${checked}>
              <span><i style="background:${colors[key] || "#00d8ff"}"></i>${label}</span>
            </label>
          `;
        })
        .join("")}
    `;
  }

  function renderBase(nodes) {
    nodesLayer.clearLayers();

    for (const node of nodes || []) {
      const kind = normalKind(node.kind);
      if (!dotAllowed(kind)) continue;

      L.marker([node.lat, node.lng], { icon: icon(kind) })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          if (Renderers.renderNode) Renderers.renderNode(node);
        })
        .addTo(nodesLayer);
    }

    renderLegend();
  }

  function renderCities(cities) {
    cityLayer.clearLayers();

    if (!activeDotTypes.has("city")) return;

    const zoom = map.getZoom();
    if (zoom < 4) return;

    const bounds = map.getBounds();
    const limit = zoom >= 11 ? 900 : zoom >= 9 ? 650 : zoom >= 7 ? 420 : zoom >= 5 ? 220 : 120;

    for (const city of (cities || []).filter((x) => bounds.pad(0.55).contains([x.lat, x.lng])).slice(0, limit)) {
      L.marker([city.lat, city.lng], { icon: icon(city.kind || "city") })
        .on("click", async (event) => {
          L.DomEvent.stopPropagation(event);
          await renderPlaceWithWiki(city);
        })
        .addTo(cityLayer);
    }
  }

  function renderLocalPlaces(places) {
    localLayer.clearLayers();

    if (!activeDotTypes.has("city")) return;

    const zoom = map.getZoom();
    if (zoom < 6) return;

    const limit = zoom >= 12 ? 220 : zoom >= 10 ? 160 : 90;

    for (const place of (places || []).slice(0, limit)) {
      L.marker([place.lat, place.lng], { icon: localIcon(place.kind) })
        .on("click", async (event) => {
          L.DomEvent.stopPropagation(event);
          await renderPlaceWithWiki(place);
        })
        .addTo(localLayer);
    }
  }

  function fetchLocalPlaces() {
    clearTimeout(localTimer);

    localTimer = setTimeout(async () => {
      if (!map || map.getZoom() < 6 || !activeDotTypes.has("city")) {
        localLayer.clearLayers();
        return;
      }

      const b = map.getBounds();
      const key = [b.getSouth().toFixed(2), b.getWest().toFixed(2), b.getNorth().toFixed(2), b.getEast().toFixed(2), Math.floor(map.getZoom())].join(",");

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
      } catch {
        localLayer.clearLayers();
      }
    }, 550);
  }

  function renderEvents(events, flashIds = new Set()) {
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

      L.marker([event.lat, event.lng], { icon: icon(kind, flashIds.has(event.id)) })
        .on("click", (leafletEvent) => {
          L.DomEvent.stopPropagation(leafletEvent);
          openEventOnMap(event);
        })
        .addTo(eventsLayer);
    }
  }

  function renderRoutes(routes) {
    if (map.hasLayer(seaLayer)) map.removeLayer(seaLayer);
    if (map.hasLayer(landLayer)) map.removeLayer(landLayer);

    seaLayer.clearLayers();
    landLayer.clearLayers();

    if (window.SHOW_SEA) seaLayer.addTo(map);
    if (window.SHOW_LAND) landLayer.addTo(map);
    if (!window.SHOW_SEA && !window.SHOW_LAND) return;

    for (const route of routes || []) {
      if (!Array.isArray(route.points) || route.points.length < 2) continue;
      if (route.type === "sea" && !window.SHOW_SEA) continue;
      if (route.type === "land" && !window.SHOW_LAND) continue;

      const layer = route.type === "sea" ? seaLayer : landLayer;
      const points = route.points.map((p) => [p[0], p[1]]);
      const colour = route.color || (route.type === "sea" ? "#00d8ff" : "#ffd447");

      L.polyline(points, {
        color: colour,
        weight: route.type === "sea" ? 9 : 8,
        opacity: 0.20,
        className: "route-shadow"
      }).addTo(layer);

      L.polyline(points, {
        color: colour,
        weight: 3.5,
        opacity: 0.96,
        className: route.type === "sea" ? "moving-route sea-route" : "moving-route land-route"
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          if (Renderers.renderRoute) Renderers.renderRoute(route);
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

    if (map.hasLayer(seaLayer)) map.removeLayer(seaLayer);
    if (map.hasLayer(landLayer)) map.removeLayer(landLayer);

    renderCountryRegionColours();
    renderBase(mapData?.nodes || []);
    renderCities(mapData?.cityNodes || []);
    fetchLocalPlaces();
    renderRoutes(mapData?.routes || []);
    renderEvents(state?.events || []);

    setTimeout(resize, 250);
  }

  async function openContext(lat, lng, zoom = null) {
    await openGlobalRisk(lat, lng, zoom);
  }

  async function openGlobalRisk(lat, lng, zoom = null) {
    if (zoom) map.setView([lat, lng], Math.max(map.getZoom(), zoom));

    riskPointLayer.clearLayers();

    setInfo(t("globalRisk"), `
      <div class="info-card loading-card">
        <h3>${t("globalRisk")}</h3>
        <div class="loader-bar"><span></span></div>
        <p class="plain">${t("loading")} crime, war, politics, crisis and money data...</p>
      </div>
    `, "risk");

    try {
      const data = await fetch(`/api/global-risk/point?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`).then((r) => r.json());
      renderGlobalRisk(data, lat, lng);
    } catch {
      setInfo(t("globalRisk"), `
        <div class="info-card">
          <h3>${t("globalRisk")}</h3>
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
    const localCrimeLine = localCrime.available
      ? `${localCrime.total} official local crimes, ${localCrime.date}`
      : "N/A, no official local crime feed connected here";

    const homicide = data.national?.homicide;

    const eventList = [
      ...(data.warEvents || []).slice(0, 3).map((x) => ({ ...x, type: "War" })),
      ...(data.politicalEvents || []).slice(0, 3).map((x) => ({ ...x, type: "Politics" })),
      ...(data.terrorEvents || []).slice(0, 3).map((x) => ({ ...x, type: "Terror" })),
      ...(data.disasters || []).slice(0, 3).map((x) => ({ ...x, type: "Crisis" })),
      ...(data.earthquakes || []).slice(0, 3).map((x) => ({ ...x, type: "Crisis" }))
    ];

    const eventsHtml = eventList.length
      ? eventList.map((e) => `
        <div class="quick-item">
          <b>${escapeHtml(e.type)}:</b>
          ${e.url ? `<a href="${escapeAttr(e.url)}" target="_blank" rel="noopener">${escapeHtml(e.title || e.summary || "source")}</a>` : escapeHtml(e.title || e.summary || "source")}
          ${e.originalTitle ? `<br><span class="source-line">Original: ${escapeHtml(e.originalTitle)}</span>` : ""}
        </div>
      `).join("")
      : `<div class="quick-item"><b>Events:</b> low current source signal.</div>`;

    setInfo(t("globalRisk"), `
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
          <div class="quick-item"><b>${t("localCrime")}:</b> ${escapeHtml(localCrimeLine)}</div>
          <div class="quick-item"><b>${t("nationalCrime")}:</b> ${
            homicide?.value !== null && homicide?.value !== undefined
              ? `${Number(homicide.value).toFixed(1)} homicides / 100k, ${escapeHtml(homicide.year)}`
              : "N/A"
          }</div>
          <div class="quick-item"><b>Weather now:</b> ${weatherSummary(data.weather)}</div>
          <div class="quick-item yellow"><b>Rule:</b> ${t("noFake")}</div>
        </div>
      </div>

      <div class="info-card">
        <h3>${t("sourceHits")}</h3>
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
    const estimated = section?.estimated ? ` (${t("estimated")})` : "";
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

  async function renderPlaceWithWiki(place) {
    let wiki = null;

    try {
      const name = place.name || place.title || place.label || "";
      const country = place.country || place.countryName || "";

      if (name) {
        wiki = await fetch(`/api/wiki/place?name=${encodeURIComponent(name)}&country=${encodeURIComponent(country)}`).then((r) => r.json());
      }
    } catch {
      wiki = null;
    }

    const wikiHtml = wiki?.found && wiki.thumbnail
      ? `
        <div class="info-card">
          <img src="${escapeAttr(wiki.thumbnail)}" alt="${escapeAttr(wiki.title)}" style="width:100%;max-height:190px;object-fit:cover;border:1px solid #00d8ff;margin-bottom:10px;">
          <h3>${escapeHtml(wiki.title)}</h3>
          <p class="plain">${escapeHtml(shortText(wiki.extract || "", 260))}</p>
          ${wiki.url ? `<a href="${escapeAttr(wiki.url)}" target="_blank" rel="noopener">Wikipedia source</a>` : ""}
        </div>
      `
      : `
        <div class="info-card">
          <h3>Image</h3>
          <p class="plain">${t("noImage")}</p>
        </div>
      `;

    setInfo(place.name || place.title || "Place", `
      <div class="info-card">
        <h3>${escapeHtml(place.name || place.title || "Place")}</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${escapeHtml(place.kind || "place")}</div>
          <div class="quick-item"><b>Latitude:</b> ${escapeHtml(place.lat)}</div>
          <div class="quick-item"><b>Longitude:</b> ${escapeHtml(place.lng)}</div>
        </div>
      </div>
      ${wikiHtml}
    `, "place");
  }

  async function loadCrisis() {
    crisisLayer.clearLayers();

    setInfo(t("crisis"), `
      <div class="info-card loading-card">
        <h3>${t("crisis")}</h3>
        <div class="loader-bar"><span></span></div>
        <p class="plain">${t("loading")} USGS earthquakes and GDACS disaster alerts...</p>
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

      L.marker([q.lat, q.lng], { icon: crisisIcon("Q", "#ff174f") })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          map.setView([q.lat, q.lng], Math.max(map.getZoom(), 6));
          setInfo(t("crisis"), `
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

      L.marker([d.lat, d.lng], { icon: crisisIcon("!", "#ffffff") })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          map.setView([d.lat, d.lng], Math.max(map.getZoom(), 6));
          setInfo(t("crisis"), `
            <div class="info-card">
              <h3>${escapeHtml(d.title || "Disaster")}</h3>
              <p class="plain">${escapeHtml(d.summary || "GDACS disaster alert")}</p>
              <p class="source-box">${d.url ? `<a href="${escapeAttr(d.url)}" target="_blank" rel="noopener">GDACS source</a>` : "GDACS"}</p>
            </div>
          `, "crisis");
        })
        .addTo(crisisLayer);
    }

    setInfo(t("crisis"), `
      <div class="info-card">
        <h3>${t("crisis")}</h3>
        <div class="index-grid real-indexes">
          ${estimateTile("Earthquakes", { display: String(earthquakes.length), value: earthquakes.length, status: "USGS 24h", estimated: false, reason: "USGS feed" })}
          ${estimateTile("Disasters", { display: String(disasters.length), value: disasters.length, status: "GDACS", estimated: false, reason: "GDACS feed" })}
        </div>
        <p class="plain">Click a crisis dot, or click the map for point risk and weather.</p>
      </div>
    `, "crisis");

    showToast("Crisis data loaded");
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
      } catch {}
    }

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], Math.max(map.getZoom(), 7));
    }

    if (Renderers.renderEvent) Renderers.renderEvent(event);

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
    } catch {}
  }

  function looksWrongEventLocation(event) {
    const title = String(event.title || "").toLowerCase();
    const place = String(event.place || event.country || "").toLowerCase();

    if (title.includes("korea") && !place.includes("philippines")) return true;
    if (title.includes("iran") && !place.includes("iran")) return true;
    if (title.includes("russia") && !place.includes("russia")) return true;

    return false;
  }

  function showGlobalRiskIntro() {
    setInfo(t("globalRisk"), `
      <div class="info-card">
        <h3>${t("globalRisk")}</h3>
        <p class="plain">Click anywhere on the map.</p>
        <div class="quick-list">
          <div class="quick-item"><b>Crime:</b> official local feed where available, otherwise national homicide rate or N/A.</div>
          <div class="quick-item"><b>War:</b> GDELT live hits + labelled baseline estimate.</div>
          <div class="quick-item"><b>Politics:</b> GDELT live hits + labelled baseline estimate.</div>
          <div class="quick-item"><b>Crisis:</b> USGS, GDACS, Open-Meteo + labelled estimate.</div>
          <div class="quick-item yellow"><b>Rule:</b> ${t("noFake")}</div>
        </div>
      </div>
    `, "risk");
  }

  function renderLiveBrief() {
    const events = window.APP_STATE?.events || [];
    const vital = events.filter((e) => ["war", "terror", "disaster", "weather", "earthquake", "quake", "risk"].includes(e.kind)).slice(0, 8);

    setInfo("Live Brief", `
      <div class="info-card">
        <h3>Live Brief</h3>
        <p class="plain">What matters now from connected feeds.</p>
      </div>

      <div class="info-card">
        <h3>Top risks</h3>
        <div class="quick-list">
          ${
            vital.length
              ? vital.map((e) => `
                <div class="quick-item">
                  <b>${escapeHtml(normalKind(e.kind).toUpperCase())}:</b>
                  ${escapeHtml(e.title || e.summary || "Source-backed event")}
                  <br><span class="source-line">${escapeHtml(e.source || "live source")}</span>
                </div>
              `).join("")
              : `<div class="quick-item">No vital events loaded yet. Press Refresh if the feed is stale.</div>`
          }
        </div>
      </div>

      <div class="info-card">
        <h3>Use</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Safety:</b> click affected country/region for Global Risk.</div>
          <div class="quick-item"><b>Money:</b> compare event region with commodities, crypto, routes and Polymarket.</div>
          <div class="quick-item yellow"><b>Check:</b> never act from one source. Confirm with local news and market reaction.</div>
        </div>
      </div>
    `, "brief");
  }

  async function renderPlainPolymarket() {
    let state = window.APP_STATE || {};

    try {
      const fetched = await fetch("/api/state").then((r) => r.json());
      state = fetched || state;
    } catch {}

    const markets = state.polymarket || state.predictionMarkets || state.markets?.polymarket || [];
    const list = Array.isArray(markets) ? markets.slice(0, 15) : [];

    setInfo("Polymarket", `
      <div class="info-card">
        <h3>Polymarket</h3>
        <p class="plain">Plain view. This does not tell you to buy. It shows whether the market is useful, stale, or too weak.</p>
      </div>

      ${
        list.length
          ? list.map((m) => {
              const title = m.title || m.question || m.name || "Market";
              const prob = Number(m.probability ?? m.prob ?? m.yesPrice ?? m.price ?? NaN);
              const pct = Number.isFinite(prob) ? Math.round((prob <= 1 ? prob * 100 : prob)) : null;
              const volume = Number(m.volume ?? m.volumeNum ?? m.liquidity ?? 0);
              const usable = pct !== null && volume > 0;

              return `
                <div class="info-card">
                  <h3>${escapeHtml(title)}</h3>
                  <div class="index-grid real-indexes">
                    <div class="index-tile ${usable ? "yellow" : "grey"}">
                      <div class="label">Market Chance</div>
                      <div class="num">${pct === null ? "N/A" : pct + "%"}</div>
                      <div class="tag">${usable ? "priced by users" : "not enough data"}</div>
                      <div class="mini-source">Polymarket</div>
                    </div>
                  </div>
                  <div class="quick-list">
                    <div class="quick-item"><b>Use:</b> ${usable ? "Readable price. Still verify news first." : "Not useful yet."}</div>
                    <div class="quick-item"><b>Money angle:</b> only useful if you think the current price has missed new information.</div>
                    <div class="quick-item yellow"><b>Rule:</b> no guaranteed buy/sell call.</div>
                  </div>
                </div>
              `;
            }).join("")
          : `
            <div class="info-card">
              <h3>No readable markets</h3>
              <p class="plain">No Polymarket data loaded. No fake odds shown.</p>
            </div>
          `
      }
    `, "polymarket");
  }

  function newEvent(event) {
    if (!event || lastEventIds.has(event.id)) return;
    lastEventIds.add(event.id);

    const title = Renderers.plainEventTitle ? Renderers.plainEventTitle(event) : event.title;

    showToast(title, event);
    sound();
    renderEvents(window.APP_STATE?.events || [], new Set([event.id]));
  }

  function showToast(text, event = null) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerHTML =
      `<button class="toast-close" id="toastClose">×</button>` +
      `<div class="a-title">LIVE ALERT</div>` +
      `<div class="a-meta">${escapeHtml(String(text || "Source-backed event").slice(0, 190))}</div>` +
      (event ? `<button id="liveAlertGo">OPEN ON MAP</button>` : "");

    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");

    const close = document.getElementById("toastClose");
    if (close) close.onclick = () => toast.classList.remove("show");

    const btn = document.getElementById("liveAlertGo");
    if (btn && event) btn.onclick = () => openEventOnMap(event);

    setTimeout(() => toast.classList.remove("show"), 18000);
  }

  function sound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.035;

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();

      setTimeout(() => {
        oscillator.frequency.value = 1180;
      }, 90);

      setTimeout(() => {
        oscillator.stop();
        ctx.close();
      }, 260);
    } catch {}
  }

  function setInfo(title, html, type) {
    if (window.Panels?.setInfo) {
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

    if (window.Panels?.closeAll) window.Panels.closeAll();

    currentMode = null;
    setButtonModes();

    riskPointLayer.clearLayers();
    crisisLayer.clearLayers();

    map.setView([20, 12], 2.75);
    setTimeout(resize, 120);
  }

  function resize() {
    if (!map) return;
    map.invalidateSize();
    setTimeout(() => map.invalidateSize(), 220);
  }

  function injectCss() {
    if (document.getElementById("smeFinalFixCss2")) return;

    const style = document.createElement("style");
    style.id = "smeFinalFixCss2";

    style.textContent = `
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

      .language-box {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #00eaff;
        font-size: 10px;
        font-weight: 900;
      }

      .language-box select {
        background: #001827;
        color: #e8fbff;
        border: 1px solid #00d8ff;
        font-size: 11px;
        padding: 3px 5px;
      }

      #globalRiskButton.active,
      #weatherTrackerButton.active {
        background: #ff8c00 !important;
        color: #00121f !important;
        border-color: #ff8c00 !important;
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
        0% { transform: translateX(-100%); }
        100% { transform: translateX(280%); }
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
    `;

    document.head.appendChild(style);
  }

  function shortText(text, max) {
    const v = String(text || "").trim();
    if (v.length <= max) return v;
    return v.slice(0, max - 1).trim() + "…";
  }

  function weatherSummary(weather) {
    if (!weather || !weather.current) return "N/A";
    const c = weather.current;
    return `${c.temperatureC ?? "N/A"}°C, wind ${c.windKmh ?? "N/A"} km/h, gust ${c.gustKmh ?? "N/A"} km/h, rain ${c.precipitationMm ?? "N/A"} mm`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }

  return {
    init,
    setData,
    newEvent,
    resize,
    goHome,
    openContext,
    renderEvents,
    renderCities,
    renderRoutes,
    renderRiskRegions: renderCountryRegionColours,
    renderSafetyRegions: renderCountryRegionColours,
    renderConflictCountries: renderCountryRegionColours,
    renderSafetyCountries: renderCountryRegionColours
  };
})();
