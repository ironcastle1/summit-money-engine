(function () {
  let map = null;
  let eventLayer = null;
  let nodeLayer = null;
  let routeLayer = null;
  let countryLayer = null;

  const STATE = {
    appState: {
      events: [],
      markets: [],
      predictions: [],
      rapid: [],
      polymarket: []
    },
    mapData: {
      nodes: [],
      cityNodes: [],
      routes: []
    },
    dotsOn: true,
    seaRoutesOn: false,
    landRoutesOn: false
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function setStatus(text) {
    const el = $("#status");
    if (el) el.textContent = text;
  }

  function html(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (match) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[match];
    });
  }

  function number(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function money(value) {
    const n = number(value);
    if (n === null) return "N/A";

    return "$" + n.toLocaleString(undefined, {
      maximumFractionDigits: n < 10 ? 4 : 2
    });
  }

  function pct(value) {
    const n = number(value);
    if (n === null) return "N/A";
    return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
  }

  async function getJson(url) {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      throw new Error(`${url} failed with ${res.status}`);
    }

    return res.json();
  }

  function showError(error) {
    console.error(error);

    const mapEl = $("#map");
    if (!mapEl) return;

    mapEl.innerHTML = `
      <pre class="boot-error">${html(error.stack || error.message || error)}</pre>
    `;
  }

  function injectEmergencyCss() {
    if ($("#emergency-app-css")) return;

    const style = document.createElement("style");
    style.id = "emergency-app-css";

    style.textContent = `
      html, body, #app {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
      }

      .stage {
        position: relative;
        width: 100%;
        height: calc(100vh - 96px);
        background: #061827;
      }

      #map {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        background: #061827;
        z-index: 1;
      }

      .leaflet-container {
        background: #061827;
      }

      .leaflet-tile-pane {
        filter: saturate(1.1) hue-rotate(170deg) brightness(0.72) contrast(1.08);
      }

      .boot-error {
        color: #ff3860;
        font-family: monospace;
        font-size: 13px;
        padding: 18px;
        white-space: pre-wrap;
      }

      .side-panel,
      .drawer {
        display: none;
        position: absolute;
        z-index: 5000;
        top: 12px;
        right: 12px;
        width: 360px;
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 130px);
        overflow: auto;
        background: rgba(0, 19, 34, 0.96);
        border: 1px solid #00d8ff;
        box-shadow: 0 0 20px rgba(0, 216, 255, 0.25);
        color: #e8fbff;
        padding: 10px;
      }

      .side-panel.open,
      .drawer.open {
        display: block;
      }

      .drawer {
        width: 470px;
      }

      .close {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #001a2c;
        border: 1px solid #00d8ff;
        color: #fff;
        width: 26px;
        height: 26px;
        cursor: pointer;
        font-weight: 900;
      }

      .info-card {
        background: rgba(0, 34, 56, 0.82);
        border: 1px solid rgba(0, 216, 255, 0.35);
        padding: 11px;
        margin: 10px 0;
      }

      .info-card h3 {
        margin: 0 0 8px;
        color: #00eaff;
        font-size: 16px;
      }

      .plain {
        color: #e8fbff;
        line-height: 1.4;
      }

      .quick-list {
        display: grid;
        gap: 7px;
      }

      .quick-item {
        background: rgba(0, 18, 32, 0.72);
        border-left: 3px solid #00d8ff;
        padding: 7px;
        line-height: 1.35;
      }

      .quick-item.yellow {
        border-left-color: #ffd94a;
      }

      .quick-item.red {
        border-left-color: #ff174f;
      }

      .index-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin: 10px 0;
      }

      .index-tile {
        border: 1px solid rgba(0, 216, 255, 0.35);
        padding: 8px;
        text-align: center;
        background: #001827;
      }

      .index-tile .label {
        font-size: 10px;
        text-transform: uppercase;
        color: #9edfff;
        font-weight: 900;
      }

      .index-tile .num {
        font-size: 25px;
        font-weight: 900;
      }

      .index-tile .tag {
        font-size: 11px;
        font-weight: 800;
      }

      .index-tile.green .num { color: #00ff87; }
      .index-tile.yellow .num { color: #ffd94a; }
      .index-tile.orange .num { color: #ff8c00; }
      .index-tile.red .num { color: #ff174f; }
      .index-tile.grey .num { color: #9aa; }

      .left-map-tools {
        position: absolute;
        left: 12px;
        top: 268px;
        z-index: 4500;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .left-map-tools button {
        background: rgba(0, 24, 40, 0.95);
        border: 1px solid #00d8ff;
        color: #e8fbff;
        padding: 8px 10px;
        font-weight: 900;
        cursor: pointer;
        font-size: 11px;
      }

      .legend {
        position: absolute;
        left: 16px;
        bottom: 34px;
        z-index: 4500;
        background: rgba(0, 18, 32, 0.92);
        border: 1px solid #00d8ff;
        color: #e8fbff;
        padding: 8px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        font-size: 11px;
      }

      .legend span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }

      .legend i {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        display: inline-block;
      }

      .dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid #fff;
      }

      .dot-war { background:#ff174f; box-shadow:0 0 16px #ff174f; }
      .dot-terror { background:#ff8c00; box-shadow:0 0 16px #ff8c00; }
      .dot-crisis { background:#fff; box-shadow:0 0 16px #fff; }
      .dot-politics { background:#b24cff; box-shadow:0 0 16px #b24cff; }
      .dot-shipping { background:#00d8ff; box-shadow:0 0 16px #00d8ff; }
      .dot-ai { background:#00fff0; box-shadow:0 0 16px #00fff0; }
      .dot-energy { background:#00ff87; box-shadow:0 0 16px #00ff87; }
      .dot-commodity { background:#ffd94a; box-shadow:0 0 16px #ffd94a; }
      .dot-finance { background:#3ea0ff; box-shadow:0 0 16px #3ea0ff; }
      .dot-city { background:#7aa7ff; box-shadow:0 0 16px #7aa7ff; }

      .home-control-button {
        width: 30px !important;
        height: 30px !important;
        line-height: 30px !important;
        text-align: center;
        background: #001827 !important;
        color: #00eaff !important;
        font-weight: 900;
        font-size: 19px;
        text-decoration: none;
      }

      .moving-route {
        stroke-dasharray: 2 12;
        animation: routeFlow 14s linear infinite;
      }

      @keyframes routeFlow {
        to { stroke-dashoffset: -120; }
      }

      .market-row {
        display: grid;
        grid-template-columns: 70px 1fr 110px;
        gap: 10px;
        align-items: center;
        padding: 8px;
        border: 1px solid rgba(0, 216, 255, 0.22);
        margin: 6px 0;
        background: rgba(0, 18, 32, 0.72);
      }

      .sym {
        color: #00eaff;
        font-weight: 900;
      }

      .up { color: #00ff87; }
      .down { color: #ff3860; }

      .source-box a,
      .quick-item a {
        color: #00eaff;
      }

      .route-search {
        width: 100%;
        padding: 8px;
        margin-top: 8px;
        background: #001827;
        color: #e8fbff;
        border: 1px solid #00d8ff;
      }
    `;

    document.head.appendChild(style);
  }

  function ensureMapContainer() {
    const mapEl = $("#map");

    if (!mapEl) {
      throw new Error("Missing #map element in web/index.html");
    }

    mapEl.innerHTML = "";
  }

  function initMap() {
    ensureMapContainer();

    if (!window.L) {
      throw new Error("Leaflet did not load. Check the Leaflet script tag in web/index.html");
    }

    map = L.map("map", {
      preferCanvas: true,
      minZoom: 2,
      maxZoom: 16,
      zoomControl: true,
      worldCopyJump: false
    }).setView([20, 12], 2.75);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      attribution: "&copy; OpenStreetMap &copy; CARTO"
    }).addTo(map);

    addHomeControl();

    eventLayer = L.layerGroup().addTo(map);
    nodeLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup();
    countryLayer = L.layerGroup().addTo(map);

    map.on("click", function (event) {
      openRiskAt(event.latlng.lat, event.latlng.lng);
    });

    setTimeout(function () {
      map.invalidateSize();
    }, 250);
  }

  function addHomeControl() {
    const HomeControl = L.Control.extend({
      options: { position: "topleft" },

      onAdd: function () {
        const container = L.DomUtil.create("div", "leaflet-bar leaflet-control home-control");
        const button = L.DomUtil.create("a", "home-control-button", container);
        button.href = "#";
        button.title = "Home";
        button.innerHTML = "⌂";

        L.DomEvent.on(button, "click", function (event) {
          L.DomEvent.stopPropagation(event);
          L.DomEvent.preventDefault(event);
          goHome();
        });

        return container;
      }
    });

    map.addControl(new HomeControl());
  }

  function goHome() {
    if (!map) return;
    closePanels();
    map.setView([20, 12], 2.75);
  }

  async function loadData() {
    setStatus("loading");

    try {
      const state = await getJson("/api/state");
      STATE.appState = state || STATE.appState;
      window.APP_STATE = STATE.appState;
    } catch (err) {
      console.warn("state failed", err);
    }

    try {
      const mapData = await getJson("/api/map-data");
      STATE.mapData = mapData || STATE.mapData;
      window.MAP_DATA = STATE.mapData;
      window.ROUTES = STATE.mapData.routes || [];
    } catch (err) {
      console.warn("map data failed", err);
    }

    renderTicker();
    renderDots();
    renderLegend();

    setStatus("LIVE " + new Date().toLocaleTimeString());
  }

  function renderTicker() {
    const ticker = $("#ticker");
    if (!ticker) return;

    const markets = STATE.appState.markets || [];

    ticker.innerHTML = markets.length
      ? markets.slice(0, 18).map(function (m) {
          const move = Number(m.changePct || 0);
          const cls = move >= 0 ? "up" : "down";
          const id = m.id || m.symbol || "ASSET";

          return `<span><b>${html(id)}</b> ${money(m.price)} <span class="${cls}">${pct(move)}</span></span>`;
        }).join("")
      : "<span>No market data</span>";
  }

  function kind(event) {
    const k = event.kind || "risk";
    if (["disaster", "weather", "earthquake", "quake"].includes(k)) return "crisis";
    if (k === "tech") return "ai";
    if (k === "election") return "politics";
    return k;
  }

  function iconFor(k) {
    return L.divIcon({
      className: "",
      html: `<div class="dot dot-${html(k)}"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  function renderDots() {
    if (!eventLayer || !nodeLayer) return;

    eventLayer.clearLayers();
    nodeLayer.clearLayers();

    if (STATE.dotsOn) {
      for (const event of STATE.appState.events || []) {
        const lat = number(event.lat);
        const lng = number(event.lng);
        if (lat === null || lng === null) continue;

        const k = kind(event);

        L.marker([lat, lng], {
          icon: iconFor(k)
        })
          .on("click", function (leafletEvent) {
            L.DomEvent.stopPropagation(leafletEvent);
            openEventCard(event);
          })
          .addTo(eventLayer);
      }
    }

    for (const node of STATE.mapData.nodes || []) {
      const lat = number(node.lat);
      const lng = number(node.lng);
      if (lat === null || lng === null) continue;

      const k = kind(node);

      L.marker([lat, lng], {
        icon: iconFor(k)
      })
        .on("click", function (leafletEvent) {
          L.DomEvent.stopPropagation(leafletEvent);
          openNodeCard(node);
        })
        .addTo(nodeLayer);
    }
  }

  function renderLegend() {
    const legend = $("#legend");
    if (!legend) return;

    const rows = [
      ["war", "#ff174f"],
      ["terror", "#ff8c00"],
      ["crisis", "#ffffff"],
      ["politics", "#b24cff"],
      ["shipping", "#00d8ff"],
      ["AI", "#00fff0"],
      ["commodity", "#ffd94a"],
      ["energy", "#00ff87"],
      ["finance", "#3ea0ff"],
      ["city", "#7aa7ff"]
    ];

    legend.innerHTML = rows.map(function (row) {
      return `<span><i style="background:${row[1]}"></i>${html(row[0])}</span>`;
    }).join("");
  }

  function openPanel(title, body) {
    const panel = $("#infoPanel");
    const titleEl = $("#infoTitle");
    const bodyEl = $("#infoBody");

    if (!panel || !titleEl || !bodyEl) return;

    panel.style.display = "";
    panel.classList.add("open");
    panel.classList.add("active");

    titleEl.textContent = title || "Info";
    bodyEl.innerHTML = body || "";
  }

  function openDrawer(title, body) {
    const drawer = $("#drawerPanel");
    const titleEl = $("#drawerTitle");
    const bodyEl = $("#drawerBody");

    if (!drawer || !titleEl || !bodyEl) return;

    drawer.style.display = "";
    drawer.classList.add("open");
    drawer.classList.add("active");

    titleEl.textContent = title || "Detail";
    bodyEl.innerHTML = body || "";
  }

  function closePanels() {
    const panel = $("#infoPanel");
    const drawer = $("#drawerPanel");

    if (panel) {
      panel.classList.remove("open", "active");
      panel.style.display = "none";
    }

    if (drawer) {
      drawer.classList.remove("open", "active");
      drawer.style.display = "none";
    }
  }

  function openEventCard(event) {
    const title = event.title || event.summary || "Live event";

    openPanel(title, `
      <div class="info-card">
        <h3>${html(title)}</h3>

        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${html(kind(event))}</div>
          <div class="quick-item"><b>Place:</b> ${html(event.place || event.country || "Mapped area")}</div>
          <div class="quick-item"><b>Source:</b> ${html(event.source || "source")}</div>
          <div class="quick-item"><b>Summary:</b> ${html(event.summary || event.title || "No summary")}</div>
          <div class="quick-item yellow"><b>Use:</b> check local source, then compare commodities, crypto, routes and Polymarket.</div>
        </div>

        <p class="source-box">
          ${event.url ? `<a href="${html(event.url)}" target="_blank" rel="noopener">open source</a>` : "No source URL"}
        </p>
      </div>
    `);
  }

  function openNodeCard(node) {
    openPanel(node.name || "Map point", `
      <div class="info-card">
        <h3>${html(node.name || "Map point")}</h3>

        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${html(kind(node))}</div>
          <div class="quick-item"><b>Source:</b> ${html(node.source || "mapped point")}</div>
          <div class="quick-item"><b>Watch:</b> ${html((node.watch || []).join(", ") || "N/A")}</div>
        </div>
      </div>
    `);
  }

  async function openRiskAt(lat, lng) {
    openPanel("Global Risk", `
      <div class="info-card">
        <h3>Loading clicked place...</h3>
        <p class="plain">Checking exact clicked point.</p>
        <div class="quick-list">
          <div class="quick-item"><b>Latitude:</b> ${html(lat.toFixed(5))}</div>
          <div class="quick-item"><b>Longitude:</b> ${html(lng.toFixed(5))}</div>
        </div>
      </div>
    `);

    try {
      const data = await getJson(`/api/global-risk/point?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
      renderRiskCard(data, lat, lng);
    } catch (err) {
      openPanel("Global Risk", `
        <div class="info-card">
          <h3>Risk data failed</h3>
          <p class="plain">The source endpoint did not return. No fake values shown.</p>
          <div class="quick-list">
            <div class="quick-item"><b>Latitude:</b> ${html(lat.toFixed(5))}</div>
            <div class="quick-item"><b>Longitude:</b> ${html(lng.toFixed(5))}</div>
          </div>
        </div>
      `);
    }
  }

  function tile(label, value, tag) {
    const missing = value === null || value === undefined || Number.isNaN(Number(value));
    const n = missing ? null : Number(value);

    let cls = "grey";
    if (!missing) {
      if (n >= 75) cls = "green";
      else if (n >= 55) cls = "yellow";
      else if (n >= 35) cls = "orange";
      else cls = "red";
    }

    return `
      <div class="index-tile ${cls}">
        <div class="label">${html(label)}</div>
        <div class="num">${missing ? "N/A" : Math.round(n)}</div>
        <div class="tag">${html(tag || "")}</div>
      </div>
    `;
  }

  function renderRiskCard(data, lat, lng) {
    const place = data.place || {};
    const raw = place.raw || {};
    const scores = data.scores || {};
    const country = place.country || data.countryName || "";

    if (!country && !data.countryCode) {
      openPanel("Ocean / no land area", `
        <div class="info-card">
          <h3>Ocean / no land area</h3>
          <p class="plain">This click did not resolve to a country or town. Crime and country safety are not shown for ocean clicks.</p>

          <div class="quick-list">
            <div class="quick-item"><b>Latitude:</b> ${html(lat.toFixed(5))}</div>
            <div class="quick-item"><b>Longitude:</b> ${html(lng.toFixed(5))}</div>
            <div class="quick-item yellow"><b>Rule:</b> no fake country values for ocean clicks.</div>
          </div>
        </div>
      `);
      return;
    }

    const exact = [
      raw.neighbourhood,
      raw.suburb,
      raw.city,
      raw.town,
      raw.village,
      raw.county,
      raw.state,
      country
    ].filter(Boolean).join(", ");

    const homicide = data.national?.homicide;
    const localCrime = data.localCrime;

    openPanel("Global Risk", `
      <div class="info-card">
        <h3>${html(exact || country || "Selected land area")}</h3>
        <p class="plain">${html(place.displayName || exact || country)}</p>

        <div class="index-grid">
          ${tile("Safety", scores.safety?.score, scores.safety?.status)}
          ${tile("Crime", scores.crime?.score, scores.crime?.status)}
          ${tile("Money", scores.money?.score, scores.money?.status)}
        </div>

        <div class="quick-list">
          <div class="quick-item"><b>Clicked point:</b> ${html(lat.toFixed(5))}, ${html(lng.toFixed(5))}</div>
          <div class="quick-item"><b>Country:</b> ${html(country || "N/A")} ${data.countryCode ? `(${html(data.countryCode)})` : ""}</div>
          <div class="quick-item"><b>Admin detail:</b> ${html(exact || "N/A")}</div>
          <div class="quick-item"><b>Local crime:</b> ${localCrime?.available ? html(`${localCrime.total} crimes, ${localCrime.date}`) : "N/A, no official local crime feed connected here"}</div>
          <div class="quick-item"><b>National homicide:</b> ${
            homicide?.value !== null && homicide?.value !== undefined
              ? `${Number(homicide.value).toFixed(1)} per 100k, ${html(homicide.year)}`
              : "N/A"
          }</div>
          <div class="quick-item"><b>Weather:</b> ${weatherLine(data.weather)}</div>
          <div class="quick-item yellow"><b>Rule:</b> missing data is not replaced with fake local numbers.</div>
        </div>
      </div>
    `);
  }

  function weatherLine(weather) {
    if (!weather || !weather.current) return "N/A";
    const c = weather.current;
    return `${c.temperatureC ?? "N/A"}°C, wind ${c.windKmh ?? "N/A"} km/h, gust ${c.gustKmh ?? "N/A"} km/h, rain ${c.precipitationMm ?? "N/A"} mm`;
  }

  function renderRoutes() {
    if (!routeLayer || !map) return;

    routeLayer.clearLayers();

    if (map.hasLayer(routeLayer)) {
      map.removeLayer(routeLayer);
    }

    const routes = buildRoutes();

    if (!STATE.seaRoutesOn && !STATE.landRoutesOn) return;

    routeLayer.addTo(map);

    for (const route of routes) {
      if (route.type === "sea" && !STATE.seaRoutesOn) continue;
      if (route.type === "land" && !STATE.landRoutesOn) continue;

      const points = route.points.map((p) => [p[0], p[1]]);

      L.polyline(points, {
        color: route.type === "sea" ? "#00d8ff" : "#ffd94a",
        weight: 1.2,
        opacity: 0.55,
        className: "moving-route"
      })
        .on("click", function (event) {
          L.DomEvent.stopPropagation(event);
          openRouteCard(route);
        })
        .addTo(routeLayer);
    }
  }

  function buildRoutes() {
    const sea = [
      route("sea", "Shanghai → Rotterdam", [[31.23, 121.49], [1.43, 103.86], [30.59, 32.27], [51.95, 4.14]], ["Malacca", "Suez"]),
      route("sea", "Singapore → Felixstowe", [[1.29, 103.85], [1.43, 103.86], [30.59, 32.27], [51.96, 1.35]], ["Malacca", "Suez"]),
      route("sea", "Busan → Los Angeles", [[35.10, 129.04], [33.74, -118.27]], []),
      route("sea", "Tokyo → Seattle", [[35.65, 139.77], [47.60, -122.33]], []),
      route("sea", "Jebel Ali → Rotterdam", [[25.01, 55.06], [26.57, 56.25], [30.59, 32.27], [51.95, 4.14]], ["Hormuz", "Suez"]),
      route("sea", "Santos → Rotterdam", [[-23.96, -46.33], [51.95, 4.14]], []),
      route("sea", "Panama → New York", [[9.08, -79.68], [40.68, -74.04]], ["Panama"])
    ];

    const land = [
      route("land", "London → Paris → Berlin → Warsaw", [[51.5, -0.12], [48.85, 2.35], [52.52, 13.4], [52.23, 21.01]], ["Channel", "EU rail"]),
      route("land", "Istanbul → Baku → Tehran → Dubai", [[41.01, 28.97], [40.41, 49.86], [35.69, 51.39], [25.2, 55.27]], ["Caucasus", "Iran corridor"]),
      route("land", "Urumqi → Almaty → Tashkent", [[43.82, 87.62], [43.22, 76.85], [41.31, 69.28]], ["Central Asia"])
    ];

    return sea.concat(land);
  }

  function route(type, name, points, chokepoints) {
    return {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      type,
      name,
      points,
      chokepoints,
      goods: type === "sea" ? "containers, oil, LNG, bulk goods, machinery, electronics" : "rail freight, trucks, fuel, food, industrial goods",
      users: type === "sea" ? "shipping lines, freight forwarders, commodity traders, insurers" : "rail operators, truck freight, customs brokers, distributors"
    };
  }

  function openRouteCard(route) {
    openPanel(route.name, `
      <div class="info-card">
        <h3>${html(route.name)}</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${html(route.type)}</div>
          <div class="quick-item"><b>Goods:</b> ${html(route.goods)}</div>
          <div class="quick-item"><b>Used by:</b> ${html(route.users)}</div>
          <div class="quick-item"><b>Chokepoints:</b> ${html((route.chokepoints || []).join(", ") || "N/A")}</div>
          <div class="quick-item yellow"><b>Accuracy:</b> estimated major route. Not metre-level AIS data.</div>
        </div>
      </div>
    `);
  }

  function bindMenu() {
    document.addEventListener("click", function (event) {
      const close = event.target.closest("[data-close]");
      if (close) {
        closePanels();
        return;
      }

      const button = event.target.closest("[data-panel]");
      if (button) {
        openNamedPanel(button.dataset.panel);
      }
    });

    const refresh = $("#refresh");
    if (refresh) {
      refresh.addEventListener("click", function () {
        loadData();
      });
    }

    const dots = $("#dotToggleButton");
    if (dots) {
      dots.addEventListener("click", function () {
        STATE.dotsOn = !STATE.dotsOn;
        renderDots();
        dots.textContent = STATE.dotsOn ? "DOTS ON" : "DOTS OFF";
      });
    }

    const search = $("#placeSearch");
    if (search) {
      search.addEventListener("submit", async function (event) {
        event.preventDefault();
        const q = $("#placeQuery")?.value?.trim();
        if (!q) return;

        try {
          const result = await getJson(`/api/search?q=${encodeURIComponent(q)}`);
          const first = result.places && result.places[0];

          if (first && map) {
            map.setView([Number(first.lat), Number(first.lng)], 9);
            openRiskAt(Number(first.lat), Number(first.lng));
          }
        } catch (err) {
          openPanel("Search failed", `
            <div class="info-card">
              <h3>Search failed</h3>
              <p class="plain">No result loaded.</p>
            </div>
          `);
        }
      });
    }
  }

  function openNamedPanel(name) {
    if (name === "routes") {
      openPanel("Routes", `
        <div class="info-card">
          <h3>Routes</h3>
          <p class="plain">Toggle route layers. Click any route line for details.</p>

          <div class="quick-list">
            <label class="quick-item"><input id="seaRoutesBox" type="checkbox" ${STATE.seaRoutesOn ? "checked" : ""}> Sea routes</label>
            <label class="quick-item"><input id="landRoutesBox" type="checkbox" ${STATE.landRoutesOn ? "checked" : ""}> Land routes</label>
          </div>

          <input class="route-search" placeholder="Route search placeholder. Route search will be expanded after stability fix." />
        </div>
      `);

      $("#seaRoutesBox")?.addEventListener("change", function (e) {
        STATE.seaRoutesOn = e.target.checked;
        renderRoutes();
      });

      $("#landRoutesBox")?.addEventListener("change", function (e) {
        STATE.landRoutesOn = e.target.checked;
        renderRoutes();
      });

      return;
    }

    if (name === "crypto") {
      const list = (STATE.appState.markets || []).filter((m) =>
        /BTC|ETH|SOL|XRP|BNB|ADA|DOGE|AVAX|LINK/i.test(String(m.id || m.symbol || ""))
      );

      openDrawer("Crypto", `
        <div class="info-card">
          <h3>Crypto</h3>
          <p class="plain">Compact market table. No empty chart blocks.</p>
        </div>
        ${marketTable(list)}
      `);

      return;
    }

    if (name === "commodities") {
      const list = (STATE.appState.markets || []).filter((m) =>
        /gold|silver|oil|brent|wti|copper|gas|gld|slv|commodity/i.test(`${m.id} ${m.name} ${m.source}`)
      );

      openDrawer("Commodities", `
        <div class="info-card">
          <h3>Commodities</h3>
          <p class="plain">Use this to check if war, crisis or route disruption is moving prices.</p>
        </div>
        ${marketTable(list)}
      `);

      return;
    }

    if (name === "brief") {
      const events = (STATE.appState.events || []).slice(0, 10);

      openDrawer("Live Brief", `
        <div class="info-card">
          <h3>Live Brief</h3>
          <p class="plain">Priority map events and what to check next.</p>
        </div>

        <div class="info-card">
          <h3>Priority alerts</h3>
          <div class="quick-list">
            ${
              events.length
                ? events.map((e) => `
                  <div class="quick-item">
                    <b>${html(kind(e))}:</b> ${html(e.title || e.summary || "Event")}
                    <br><span>${html(e.source || "source")} | ${html(e.place || e.country || "mapped area")}</span>
                  </div>
                `).join("")
                : `<div class="quick-item">No alerts loaded.</div>`
            }
          </div>
        </div>

        <div class="info-card">
          <h3>How to use</h3>
          <div class="quick-list">
            <div class="quick-item"><b>1:</b> click the alert or country.</div>
            <div class="quick-item"><b>2:</b> check routes, commodities, crypto and Polymarket.</div>
            <div class="quick-item"><b>3:</b> only act if source and market reaction agree.</div>
          </div>
        </div>
      `);

      return;
    }

    if (name === "predictions") {
      const predictions = STATE.appState.predictions || [];

      openDrawer("Predictions", `
        <div class="info-card">
          <h3>Predictions</h3>
          <p class="plain">Setup ranking only. Not a buy/sell instruction.</p>
        </div>

        ${
          predictions.length
            ? predictions.map((p) => `
              <div class="info-card">
                <h3>${html(p.asset || p.id || "Asset")}</h3>
                <div class="quick-list">
                  <div class="quick-item"><b>Direction:</b> ${html(p.direction || "N/A")}</div>
                  <div class="quick-item"><b>Score:</b> ${html(p.rating || "N/A")}</div>
                  <div class="quick-item"><b>Reasons:</b> ${html((p.reasons || []).join(" | ") || "N/A")}</div>
                </div>
              </div>
            `).join("")
            : `<div class="info-card"><h3>No prediction data</h3></div>`
        }
      `);

      return;
    }

    if (name === "polymarket") {
      const rows = STATE.appState.polymarket || STATE.appState.predictionMarkets || [];

      openPanel("Polymarket", `
        <div class="info-card">
          <h3>Polymarket</h3>
          <p class="plain">Shows priced chance where loaded. Profit depends on whether the market is mispriced, not on chance alone.</p>
        </div>

        ${
          rows.length
            ? rows.slice(0, 20).map((m) => `
              <div class="info-card">
                <h3>${html(m.title || m.question || m.name || "Market")}</h3>
                <div class="quick-list">
                  <div class="quick-item"><b>Chance:</b> ${html(m.probability || m.prob || m.price || "N/A")}</div>
                  <div class="quick-item"><b>Money angle:</b> only useful if new information suggests this price is wrong.</div>
                </div>
              </div>
            `).join("")
            : `<div class="info-card"><h3>No Polymarket data loaded</h3></div>`
        }
      `);

      return;
    }

    if (name === "sources") {
      openDrawer("Sources", `
        <div class="info-card">
          <h3>Sources</h3>
          <div class="quick-list">
            <div class="quick-item"><b>Global events:</b> GDELT</div>
            <div class="quick-item"><b>Disasters:</b> GDACS</div>
            <div class="quick-item"><b>Earthquakes:</b> USGS</div>
            <div class="quick-item"><b>Macro:</b> World Bank</div>
            <div class="quick-item"><b>Places:</b> OpenStreetMap</div>
            <div class="quick-item"><b>Weather:</b> Open-Meteo</div>
          </div>
        </div>
      `);

      return;
    }

    if (name === "layers") {
      openPanel("Safety Map", `
        <div class="info-card">
          <h3>Safety Map</h3>
          <p class="plain">Click the map for point risk. Country fill layer will be restored after the map stability issue is fixed.</p>
        </div>
      `);

      return;
    }

    openDrawer(name || "Panel", `
      <div class="info-card">
        <h3>${html(name || "Panel")}</h3>
        <p class="plain">Panel loaded.</p>
      </div>
    `);
  }

  function marketTable(list) {
    const rows = Array.isArray(list) ? list : [];

    return `
      <div>
        ${
          rows.length
            ? rows.map((m) => {
                const move = Number(m.changePct || 0);
                const cls = move >= 0 ? "up" : "down";
                const id = m.id || m.symbol || "ASSET";

                return `
                  <div class="market-row">
                    <div class="sym">${html(id)}</div>
                    <div>
                      <div>${html(m.name || id)}</div>
                      <div>${html(m.source || "market feed")}</div>
                    </div>
                    <div>
                      <b>${money(m.price)}</b><br>
                      <span class="${cls}">${pct(move)}</span>
                    </div>
                  </div>
                `;
              }).join("")
            : `<div class="info-card"><h3>No data</h3></div>`
        }
      </div>
    `;
  }

  function bindLanguage() {
    const select = $("#languageSelect");
    if (!select) return;

    select.addEventListener("change", function () {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = select.value || "en";
    });
  }

  function startStream() {
    if (!window.EventSource) return;

    try {
      const source = new EventSource("/api/stream");

      source.addEventListener("message", function (event) {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "state" && payload.state) {
            STATE.appState = payload.state;
            window.APP_STATE = STATE.appState;
            renderTicker();
            renderDots();
          }

          if (payload.type === "event" && payload.event) {
            if (!Array.isArray(STATE.appState.events)) STATE.appState.events = [];
            STATE.appState.events.unshift(payload.event);
            STATE.appState.events = STATE.appState.events.slice(0, 800);
            window.APP_STATE = STATE.appState;
            renderDots();
          }
        } catch (err) {
          console.warn("stream parse failed", err);
        }
      });
    } catch (err) {
      console.warn("stream failed", err);
    }
  }

  async function boot() {
    injectEmergencyCss();
    bindMenu();
    bindLanguage();

    initMap();
    await loadData();
    startStream();
  }

  document.addEventListener("DOMContentLoaded", function () {
    boot().catch(showError);
  });
})();
