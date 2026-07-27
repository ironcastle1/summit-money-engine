window.MoneyMap = (() => {
  let map;
  let baseLayer;
  let regionLayer;
  let nodesLayer;
  let cityLayer;
  let localLayer;
  let eventsLayer;
  let seaLayer;
  let landLayer;
  let riskPointLayer;
  let weatherLayer;

  let countryGeoJson = null;
  let currentMode = null;
  let dotPanelOpen = false;
  let localTimer = null;
  let lastLocalKey = "";
  let lastEventIds = new Set();

  window.SHOW_SEA = false;
  window.SHOW_LAND = false;
  window.SHOW_SAFETY = true;

  const activeDotTypes = new Set(["war", "terror", "disaster", "weather", "earthquake", "risk"]);

  const colors = {
    war: "#ff174f",
    terror: "#ff8c00",
    disaster: "#ff7b22",
    weather: "#ff174f",
    earthquake: "#ff174f",
    election: "#a871ff",
    politics: "#a871ff",
    shipping: "#00d8ff",
    port: "#00d8ff",
    ai: "#a871ff",
    tech: "#a871ff",
    energy: "#00ff87",
    commodity: "#ffd94a",
    finance: "#3ea0ff",
    city: "#7aa7ff",
    risk: "#ff326a"
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
    "Niger"
  ]);

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

    baseLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
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
    weatherLayer = L.layerGroup().addTo(map);
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
      currentMode = currentMode === "weather" ? null : "weather";
      setButtonModes();
      if (currentMode === "weather") await loadGlobalWeather();
      else weatherLayer.clearLayers();
    });

    document.getElementById("dotToggleButton")?.addEventListener("click", () => {
      dotPanelOpen = !dotPanelOpen;
      renderDotTogglePanel();
    });

    document.getElementById("refresh")?.addEventListener("click", () => {
      location.reload();
    });

    injectCss();
    renderLegend();
    loadCountryRegions();
    setTimeout(resize, 250);
  }

  function setButtonModes() {
    document.getElementById("globalRiskButton")?.classList.toggle("active", currentMode === "risk");
    document.getElementById("weatherTrackerButton")?.classList.toggle("active", currentMode === "weather");
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

    if (!window.SHOW_SAFETY || !countryGeoJson || !Array.isArray(countryGeoJson.features)) {
      return;
    }

    L.geoJSON(countryGeoJson, {
      style: (feature) => {
        const p = feature.properties || {};
        const name = p.name || p.admin || "";

        let fill = "#00a66a";
        let opacity = 0.06;

        if (matchesName(name, conflictNames)) {
          fill = "#ff174f";
          opacity = 0.34;
        } else if (/russia|iran|north korea|venezuela|haiti|libya/i.test(name)) {
          fill = "#ff8c00";
          opacity = 0.22;
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
          const centre = layer.getBounds().getCenter();
          await openGlobalRisk(centre.lat, centre.lng);
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
    const actual = kind === "tech" ? "ai" : kind;
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

  function weatherIcon(label, colour) {
    return L.divIcon({
      className: "",
      html: `<div class="weather-dot" style="background:${colour};box-shadow:0 0 22px ${colour};">${label}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  function dotAllowed(kind) {
    const actual = kind === "tech" ? "ai" : kind;
    if (["war", "terror", "disaster", "weather", "earthquake", "risk"].includes(actual)) return true;
    return activeDotTypes.has(actual);
  }

  function renderLegend() {
    const el = document.getElementById("legend");
    if (!el) return;

    const keys = {
      war: "war",
      terror: "terror",
      disaster: "disaster",
      earthquake: "quake",
      weather: "weather",
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
      ["disaster", "Disaster"],
      ["weather", "Weather"],
      ["earthquake", "Earthquake"],
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
      <p>Vital dots stay on. Turn extra noise on only when needed.</p>
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
      const kind = node.kind === "tech" ? "ai" : node.kind;
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
      .filter((e) => zoom < 4.5 || bounds.pad(0.55).contains([e.lat, e.lng]))
      .slice(0, zoom >= 10 ? 900 : zoom >= 8 ? 650 : zoom >= 6 ? 460 : 300);

    for (const event of visible) {
      const kind = event.kind === "tech" ? "ai" : event.kind;

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
    patchPolymarketButton();

    setTimeout(resize, 250);
  }

  async function openContext(lat, lng, zoom = null) {
    await openGlobalRisk(lat, lng, zoom);
  }

  async function openGlobalRisk(lat, lng, zoom = null) {
    if (zoom) map.setView([lat, lng], Math.max(map.getZoom(), zoom));

    riskPointLayer.clearLayers();

    setInfo("Global Risk", `
      <div class="info-card">
        <h3>Global Risk</h3>
        <p class="plain">Loading crime, war, politics, weather and money data.</p>
      </div>
    `, "risk");

    try {
      const data = await fetch(`/api/global-risk/point?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`).then((r) => r.json());
      renderGlobalRisk(data, lat, lng);
    } catch {
      setInfo("Global Risk", `
        <div class="info-card">
          <h3>Global Risk</h3>
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
      ...(data.disasters || []).slice(0, 3).map((x) => ({ ...x, type: "Disaster" })),
      ...(data.earthquakes || []).slice(0, 3).map((x) => ({ ...x, type: "Earthquake" }))
    ];

    const eventsHtml = eventList.length
      ? eventList.map((e) => `
        <div class="quick-item">
          <b>${escapeHtml(e.type)}:</b>
          ${e.url ? `<a href="${escapeAttr(e.url)}" target="_blank" rel="noopener">${escapeHtml(e.title || e.summary || "source")}</a>` : escapeHtml(e.title || e.summary || "source")}
        </div>
      `).join("")
      : `<div class="quick-item"><b>Events:</b> no current source hits.</div>`;

    setInfo("Global Risk", `
      <div class="info-card">
        <h3>${escapeHtml(name)}</h3>
        <p class="source-line">Source-backed. Missing data shows N/A.</p>

        <div class="index-grid real-indexes">
          ${scoreTile("Safety", scores.safety?.score, scores.safety?.status, scores.safety?.reason)}
          ${scoreTile("Crime", scores.crime?.score, scores.crime?.status, scores.crime?.reason)}
          ${countTile("War", scores.war?.count, scores.war?.status)}
          ${countTile("Politics", scores.politics?.count, scores.politics?.status)}
          ${countTile("Weather", scores.weather?.count, scores.weather?.status)}
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

  function countTile(label, count, tag) {
    const v = Number(count || 0);
    const cls = v >= 10 ? "red" : v >= 4 ? "orange" : v >= 1 ? "yellow" : "green";

    return `
      <div class="index-tile ${cls}">
        <div class="label">${escapeHtml(label)}</div>
        <div class="num">${escapeHtml(v)}</div>
        <div class="tag">${escapeHtml(tag || "source hits")}</div>
        <div class="mini-source">live feed count</div>
      </div>
    `;
  }

  function weatherSummary(weather) {
    if (!weather || !weather.current) return "N/A";
    const c = weather.current;
    return `${c.temperatureC ?? "N/A"}°C, wind ${c.windKmh ?? "N/A"} km/h, gust ${c.gustKmh ?? "N/A"} km/h, precipitation ${c.precipitationMm ?? "N/A"} mm`;
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
          <p class="plain">No Wikipedia image found for this place. No fake picture shown.</p>
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

  async function loadGlobalWeather() {
    weatherLayer.clearLayers();

    setInfo("Global Weather", `
      <div class="info-card">
        <h3>Global Weather</h3>
        <p class="plain">Loading global earthquakes and disaster alerts.</p>
      </div>
    `, "weather");

    const [quakeData, disasterData] = await Promise.all([
      fetch("/api/global-weather/earthquakes").then((r) => r.json()).catch(() => ({ earthquakes: [] })),
      fetch("/api/global-weather/disasters").then((r) => r.json()).catch(() => ({ disasters: [] }))
    ]);

    const earthquakes = quakeData.earthquakes || [];
    const disasters = disasterData.disasters || [];

    for (const q of earthquakes) {
      if (q.lat === null || q.lng === null) continue;

      L.marker([q.lat, q.lng], { icon: weatherIcon("Q", "#ff174f") })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          map.setView([q.lat, q.lng], Math.max(map.getZoom(), 6));
          setInfo("Earthquake", `
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
          `, "weather");
        })
        .addTo(weatherLayer);
    }

    for (const d of disasters) {
      if (d.lat === null || d.lng === null) continue;

      L.marker([d.lat, d.lng], { icon: weatherIcon("!", "#ff8c00") })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          map.setView([d.lat, d.lng], Math.max(map.getZoom(), 6));
          setInfo("Disaster Alert", `
            <div class="info-card">
              <h3>${escapeHtml(d.title || "Disaster")}</h3>
              <p class="plain">${escapeHtml(d.summary || "GDACS disaster alert")}</p>
              <p class="source-box">${d.url ? `<a href="${escapeAttr(d.url)}" target="_blank" rel="noopener">GDACS source</a>` : "GDACS"}</p>
            </div>
          `, "weather");
        })
        .addTo(weatherLayer);
    }

    setInfo("Global Weather", `
      <div class="info-card">
        <h3>Global Weather</h3>
        <div class="index-grid real-indexes">
          ${countTile("Earthquakes", earthquakes.length, "USGS 24h")}
          ${countTile("Disasters", disasters.length, "GDACS")}
        </div>
        <p class="plain">Click a weather dot, or click the map for point risk and weather.</p>
      </div>
    `, "weather");

    showToast(`Global weather loaded`);
  }

  async function openEventOnMap(event) {
    if (event.lat !== undefined && event.lng !== undefined) {
      map.setView([event.lat, event.lng], Math.max(map.getZoom(), 7));
    }

    if (Renderers.renderEvent) Renderers.renderEvent(event);

    try {
      const local = await fetch(`/api/global-events/local?lat=${encodeURIComponent(event.lat)}&lng=${encodeURIComponent(event.lng)}`).then((r) => r.json());
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
                  <br><span class="source-line">${escapeHtml(a.source || "GDELT")}</span>
                </div>
              `).join("")}
            </div>
          </div>
        `);
      }
    } catch {}
  }

  function showGlobalRiskIntro() {
    setInfo("Global Risk", `
      <div class="info-card">
        <h3>Global Risk</h3>
        <p class="plain">Click anywhere on the map.</p>
        <div class="quick-list">
          <div class="quick-item"><b>Crime:</b> local official feed where available, otherwise national homicide rate or N/A.</div>
          <div class="quick-item"><b>War:</b> GDELT conflict/news hits.</div>
          <div class="quick-item"><b>Politics:</b> GDELT politics/unrest hits.</div>
          <div class="quick-item"><b>Weather:</b> USGS, GDACS, Open-Meteo.</div>
          <div class="quick-item yellow"><b>Rule:</b> no fake local crime numbers.</div>
        </div>
      </div>
    `, "risk");
  }

  function patchPolymarketButton() {
    const btn = document.querySelector('[data-panel="polymarket"]');
    if (!btn || btn.dataset.patched === "1") return;

    btn.dataset.patched = "1";

    btn.addEventListener("click", () => {
      setTimeout(renderPlainPolymarket, 60);
    });
  }

  async function renderPlainPolymarket() {
    let state = window.APP_STATE || {};

    try {
      const fetched = await fetch("/api/state").then((r) => r.json());
      state = fetched || state;
    } catch {}

    const markets = state.polymarket || state.predictionMarkets || state.markets?.polymarket || [];

    const list = Array.isArray(markets) ? markets.slice(0, 15) : [];

    const html = `
      <div class="info-card">
        <h3>Polymarket</h3>
        <p class="plain">Plain view. This does not tell you to buy. It shows whether a market is readable or too weak to use.</p>
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
                      <div class="tag">${usable ? "priced by market" : "not enough data"}</div>
                      <div class="mini-source">Polymarket</div>
                    </div>
                  </div>
                  <div class="quick-list">
                    <div class="quick-item"><b>Use:</b> ${usable ? "Readable price. Still verify news first." : "Not useful yet."}</div>
                    <div class="quick-item"><b>Money angle:</b> only useful if you know something the current market price has missed.</div>
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
    `;

    setInfo("Polymarket", html, "polymarket");
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
      `<div class="a-title">LIVE ALERT</div>` +
      `<div class="a-meta">${escapeHtml(String(text || "Source-backed event").slice(0, 190))}</div>` +
      (event ? `<button id="liveAlertGo">OPEN ON MAP</button>` : "");

    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");

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
    weatherLayer.clearLayers();

    map.setView([20, 12], 2.75);
    setTimeout(resize, 120);
  }

  function resize() {
    if (!map) return;
    map.invalidateSize();
    setTimeout(() => map.invalidateSize(), 220);
  }

  function injectCss() {
    if (document.getElementById("smeFinalFixCss")) return;

    const style = document.createElement("style");
    style.id = "smeFinalFixCss";

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

      .weather-dot {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        border: 2px solid #fff;
        font-size: 13px;
        animation: weatherPulse 1s infinite;
      }

      @keyframes weatherPulse {
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

      #toast button {
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
