window.MoneyMap = (() => {
  let map;
  let nodesLayer;
  let cityLayer;
  let localLayer;
  let eventsLayer;
  let seaLayer;
  let landLayer;
  let crimeLayer;

  let currentFilter = "all";
  let localTimer = null;
  let lastLocalKey = "";
  let crimeMode = false;
  let lastEventIds = new Set();

  window.SHOW_SEA = false;
  window.SHOW_LAND = false;
  window.SHOW_SAFETY = false;

  const colors = {
    war: "#ff174f",
    terror: "#ff8c00",
    disaster: "#ff7b22",
    election: "#a871ff",
    shipping: "#00d8ff",
    port: "#00d8ff",
    ai: "#a871ff",
    tech: "#a871ff",
    energy: "#00ff87",
    commodity: "#ffd94a",
    finance: "#3ea0ff",
    city: "#7aa7ff",
    risk: "#ff326a",
    crime: "#ff8c00"
  };

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

    /*
      IMPORTANT:
      Expose map globally so features like crime tracker can use the real map.
      Previous patch failed because the map variable was private inside this file.
    */
    window.map = map;

    /*
      Clean blue/navy map.
      Do not draw a second green/yellow country-border overlay.
      The previous overlay looked wrong because it used different/simplified geometry
      from the tile map.
    */
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      noWrap: true,
      bounds: [[-85, -180], [85, 180]],
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      updateWhenIdle: false,
      updateWhenZooming: false,
      keepBuffer: 4
    }).addTo(map);

    seaLayer = L.layerGroup();
    landLayer = L.layerGroup();
    nodesLayer = L.layerGroup().addTo(map);
    cityLayer = L.layerGroup().addTo(map);
    localLayer = L.layerGroup().addTo(map);
    eventsLayer = L.layerGroup().addTo(map);
    crimeLayer = L.layerGroup().addTo(map);

    map.on("zoomend moveend", () => {
      renderEvents(window.APP_STATE?.events || []);
      renderCities(window.MAP_DATA?.cityNodes || []);
      fetchLocalPlaces();
    });

    map.on("click", async (event) => {
      if (crimeMode) {
        await openCrimeTracker(event.latlng.lat, event.latlng.lng);
        return;
      }

      openContext(event.latlng.lat, event.latlng.lng);
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

      if (event.target?.dataset?.layer) {
        document.body.classList.toggle(
          "hide-" + event.target.dataset.layer,
          !event.target.checked
        );
      }

      /*
        Safety polygon toggle deliberately does not draw old inaccurate country polygons.
        It only controls event visibility for now.
      */
      if (event.target?.id === "safetyToggle") {
        window.SHOW_SAFETY = !!event.target.checked;
        showMapNotice(
          "Safety map",
          "Old country polygon overlays are disabled because they did not match the map accurately. Use source-backed event dots and country cards until exact matching polygon data is rebuilt."
        );
      }
    });

    const crimeButton = document.getElementById("crimeTrackerButton");

    if (crimeButton) {
      crimeButton.addEventListener("click", () => {
        crimeMode = !crimeMode;
        crimeButton.classList.toggle("active", crimeMode);

        if (crimeMode) {
          showCrimeIntro();
        } else {
          showToast("Crime Tracker off");
        }
      });
    }

    injectCrimeCss();
    setTimeout(resize, 250);
  }

  function icon(kind, flash = false) {
    return L.divIcon({
      className: "",
      html: `<div class="node-dot ${kind} ${flash ? "flash" : ""}"></div>`,
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

  function renderLegend() {
    const el = document.getElementById("legend");

    if (!el) return;

    const keys = {
      war: "war",
      terror: "terror",
      disaster: "disaster",
      election: "election",
      shipping: "shipping",
      ai: "AI",
      commodity: "commodity",
      energy: "energy",
      finance: "finance",
      city: "city"
    };

    el.innerHTML = Object.entries(keys)
      .map(([key, label]) => {
        return `<span class="${key}-key"><i style="background:${colors[key]}"></i>${label}</span>`;
      })
      .join("");
  }

  /*
    Disabled inaccurate polygon overlays.
    These functions are kept so existing app calls do not crash.
  */
  function renderRiskRegions() {
    return;
  }

  function renderSafetyRegions() {
    return;
  }

  function renderConflictCountries() {
    return;
  }

  function renderSafetyCountries() {
    return;
  }

  function renderBase(nodes) {
    nodesLayer.clearLayers();

    for (const node of nodes || []) {
      const kind = node.kind === "tech" ? "ai" : node.kind;

      L.marker([node.lat, node.lng], {
        icon: icon(kind)
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          Renderers.renderNode(node);
        })
        .addTo(nodesLayer);
    }

    renderLegend();
  }

  function renderCities(cities) {
    cityLayer.clearLayers();

    const zoom = map.getZoom();

    if (zoom < 4.0) return;

    const bounds = map.getBounds();

    const limit =
      zoom >= 11 ? 900 :
      zoom >= 9 ? 650 :
      zoom >= 7 ? 420 :
      zoom >= 5 ? 220 :
      120;

    for (const city of (cities || [])
      .filter((x) => bounds.pad(0.55).contains([x.lat, x.lng]))
      .slice(0, limit)) {
      L.marker([city.lat, city.lng], {
        icon: icon(city.kind || "city")
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          Renderers.renderLocalPlace
            ? Renderers.renderLocalPlace(city)
            : Renderers.renderNode(city);
        })
        .addTo(cityLayer);
    }
  }

  function renderLocalPlaces(places) {
    localLayer.clearLayers();

    const zoom = map.getZoom();

    if (zoom < 6) return;

    const limit =
      zoom >= 12 ? 220 :
      zoom >= 10 ? 160 :
      90;

    for (const place of (places || []).slice(0, limit)) {
      L.marker([place.lat, place.lng], {
        icon: localIcon(place.kind)
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          Renderers.renderLocalPlace
            ? Renderers.renderLocalPlace(place)
            : Renderers.renderNode(place);
        })
        .addTo(localLayer);
    }
  }

  function fetchLocalPlaces() {
    clearTimeout(localTimer);

    localTimer = setTimeout(async () => {
      if (!map || map.getZoom() < 6) {
        localLayer.clearLayers();
        return;
      }

      const bounds = map.getBounds();

      const key = [
        bounds.getSouth().toFixed(2),
        bounds.getWest().toFixed(2),
        bounds.getNorth().toFixed(2),
        bounds.getEast().toFixed(2),
        Math.floor(map.getZoom())
      ].join(",");

      if (key === lastLocalKey) return;

      lastLocalKey = key;

      try {
        const url =
          `/api/local-places?south=${bounds.getSouth()}` +
          `&west=${bounds.getWest()}` +
          `&north=${bounds.getNorth()}` +
          `&east=${bounds.getEast()}` +
          `&zoom=${map.getZoom()}`;

        const data = await fetch(url).then((r) => r.json());

        renderLocalPlaces(data.places || []);
      } catch (err) {
        /*
          OSM/Overpass can fail/rate limit.
          Do not fake local places.
        */
      }
    }, 550);
  }

  function renderEvents(events, flashIds = new Set()) {
    eventsLayer.clearLayers();

    const zoom = map.getZoom();
    const bounds = map.getBounds();

    const filtered = (events || []).filter((event) => {
      if (currentFilter === "all") return true;
      if (event.kind === currentFilter) return true;
      if (currentFilter === "ai" && event.kind === "tech") return true;
      return false;
    });

    const visible = filtered
      .filter((event) => zoom < 4.5 || bounds.pad(0.55).contains([event.lat, event.lng]))
      .slice(0, zoom >= 10 ? 900 : zoom >= 8 ? 650 : zoom >= 6 ? 460 : 300);

    for (const event of visible) {
      const kind = event.kind === "tech" ? "ai" : event.kind;

      L.marker([event.lat, event.lng], {
        icon: icon(kind, flashIds.has(event.id))
      })
        .on("click", (leafletEvent) => {
          L.DomEvent.stopPropagation(leafletEvent);
          Renderers.renderEvent(event);
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

    const addRoute = (route) => {
      const layer = route.type === "sea" ? seaLayer : landLayer;
      const points = route.points.map((point) => [point[0], point[1]]);
      const className = route.type === "sea" ? "moving-route sea-route" : "moving-route land-route";

      L.polyline(points, {
        color: route.color,
        weight: route.type === "sea" ? 8 : 7,
        opacity: 0.18,
        className: "route-shadow"
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          Renderers.renderRoute(route);
        })
        .addTo(layer);

      L.polyline(points, {
        color: route.color,
        weight: 3,
        opacity: 0.92,
        className
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          Renderers.renderRoute(route);
        })
        .addTo(layer);

      if (map.getZoom() >= 4.2) {
        const mid = points[Math.floor(points.length / 2)];

        L.marker(mid, {
          icon: L.divIcon({
            className: "route-label",
            html: `${route.name}<br><span>${route.goods}</span>`,
            iconSize: null
          })
        })
          .on("click", (event) => {
            L.DomEvent.stopPropagation(event);
            Renderers.renderRoute(route);
          })
          .addTo(layer);
      }
    };

    for (const route of routes || []) {
      if (route.type === "sea" && window.SHOW_SEA) addRoute(route);
      if (route.type === "land" && window.SHOW_LAND) addRoute(route);
    }
  }

  function setData(mapData, state) {
    window.MAP_DATA = mapData;
    window.ROUTES = mapData.routes || [];

    window.SHOW_SEA = false;
    window.SHOW_LAND = false;
    window.SHOW_SAFETY = false;

    if (map.hasLayer(seaLayer)) map.removeLayer(seaLayer);
    if (map.hasLayer(landLayer)) map.removeLayer(landLayer);

    /*
      Deliberately do not render mapData.conflictCountries or mapData.safetyCountries.
      They are inaccurate old polygon overlays and make the map worse.
    */

    renderBase(mapData.nodes || []);
    renderCities(mapData.cityNodes || []);
    fetchLocalPlaces();
    renderRoutes(mapData.routes || []);
    renderEvents(state?.events || []);

    setTimeout(resize, 250);
  }

  async function openContext(lat, lng, zoom = null) {
    if (
      map &&
      zoom &&
      Number.isFinite(Number(lat)) &&
      Number.isFinite(Number(lng))
    ) {
      map.setView([Number(lat), Number(lng)], Math.max(map.getZoom(), zoom));
    }

    const data = await fetch(
      `/api/context?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
    ).then((r) => r.json());

    try {
      const reverse = await fetch(
        `/api/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
      ).then((r) => r.json());

      data.reverse = reverse;
    } catch (err) {
      /*
        Reverse lookup failed. Continue with source-backed context only.
      */
    }

    Renderers.renderContext(data);
  }

  async function openCrimeTracker(lat, lng) {
    crimeLayer.clearLayers();

    const loadingHtml = `
      <div class="info-card">
        <h3>Crime Tracker</h3>
        <p class="plain">Checking official local crime data for this point...</p>
        <div class="metric-row"><span>Latitude</span><b>${Number(lat).toFixed(4)}</b></div>
        <div class="metric-row"><span>Longitude</span><b>${Number(lng).toFixed(4)}</b></div>
      </div>
    `;

    Panels.setInfo("Crime Tracker", loadingHtml, "crime");

    try {
      const data = await fetch(
        `/api/crime/point?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
      ).then((r) => r.json());

      renderCrimeResult(data, lat, lng);
    } catch (err) {
      Panels.setInfo(
        "Crime Tracker",
        `
          <div class="info-card">
            <h3>Crime Tracker</h3>
            <div class="index-grid real-indexes">
              <div class="index-tile grey">
                <div class="label">Local Crime</div>
                <div class="num">N/A</div>
                <div class="tag">No data</div>
                <div class="mini-source">source failed</div>
              </div>
            </div>
            <p class="source-box">Crime source failed. No fake score shown.</p>
          </div>
        `,
        "crime"
      );
    }
  }

  function renderCrimeResult(data, lat, lng) {
    if (!data || !data.localCrimeAvailable) {
      Panels.setInfo(
        "Crime Tracker",
        `
          <div class="info-card">
            <h3>Crime Tracker</h3>
            <p class="source-line">Clicked point: ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}</p>

            <div class="index-grid real-indexes">
              <div class="index-tile grey">
                <div class="label">Local Crime</div>
                <div class="num">N/A</div>
                <div class="tag">No data</div>
                <div class="mini-source">No official local feed</div>
              </div>
            </div>

            <div class="quick-list">
              <div class="quick-item"><b>Source:</b> N/A</div>
              <div class="quick-item"><b>Status:</b> No official local crime feed connected here.</div>
              <div class="quick-item yellow"><b>Rule:</b> No fake crime number is shown.</div>
            </div>
          </div>
        `,
        "crime"
      );

      return;
    }

    const categoryHtml = (data.categories || [])
      .slice(0, 12)
      .map((item) => {
        return `
          <div class="metric-row">
            <span>${escapeHtml(prettyCrime(item.category))}</span>
            <b>${escapeHtml(item.count)}</b>
          </div>
        `;
      })
      .join("");

    const total = Number(data.total || 0);

    const level =
      total >= 250 ? "red" :
      total >= 100 ? "orange" :
      total >= 40 ? "yellow" :
      "green";

    L.circle([lat, lng], {
      radius: 1200,
      color: colors.crime,
      fillColor: colors.crime,
      fillOpacity: 0.14,
      weight: 2
    }).addTo(crimeLayer);

    L.marker([lat, lng], {
      icon: icon("terror")
    }).addTo(crimeLayer);

    Panels.setInfo(
      "Crime Tracker",
      `
        <div class="info-card">
          <h3>Crime Tracker</h3>
          <p class="source-line">Official UK street-crime count near clicked point.</p>

          <div class="index-grid real-indexes">
            <div class="index-tile ${level}">
              <div class="label">Local Crime</div>
              <div class="num">${escapeHtml(total)}</div>
              <div class="tag">Official count</div>
              <div class="mini-source">${escapeHtml(data.source || "data.police.uk")}</div>
            </div>
          </div>

          <div class="quick-list">
            <div class="quick-item"><b>Month:</b> ${escapeHtml(data.date || "N/A")}</div>
            <div class="quick-item"><b>Coverage:</b> England, Wales and Northern Ireland only.</div>
            <div class="quick-item yellow"><b>Note:</b> Police.uk uses approximate street-level locations, not exact addresses.</div>
          </div>
        </div>

        <div class="info-card">
          <h3>Crime categories</h3>
          ${categoryHtml || `<div class="warn">No categories returned for this point and month.</div>`}
        </div>
      `,
      "crime"
    );
  }

  function showCrimeIntro() {
    Panels.setInfo(
      "Crime Tracker",
      `
        <div class="info-card">
          <h3>Crime Tracker</h3>
          <p class="plain">Click anywhere on the map.</p>

          <div class="quick-list">
            <div class="quick-item"><b>UK:</b> uses official Police.uk street-crime data.</div>
            <div class="quick-item"><b>Outside UK feed:</b> shows N/A.</div>
            <div class="quick-item yellow"><b>Rule:</b> no fake city crime numbers.</div>
          </div>
        </div>
      `,
      "crime"
    );

    showToast("Crime Tracker on. Click the map.");
  }

  function newEvent(event) {
    if (!event || lastEventIds.has(event.id)) return;

    lastEventIds.add(event.id);

    showToast(
      Renderers.plainEventTitle
        ? Renderers.plainEventTitle(event)
        : event.title
    );

    sound();

    renderEvents(window.APP_STATE?.events || [], new Set([event.id]));
  }

  function showToast(text) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.innerHTML =
      `<div class="a-title">LIVE ALERT</div>` +
      `<div class="a-meta">${String(text || "Source-backed event").slice(0, 190)}</div>`;

    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 14000);
  }

  function showMapNotice(title, text) {
    Panels.setInfo(
      title,
      `
        <div class="info-card">
          <h3>${escapeHtml(title)}</h3>
          <p class="plain">${escapeHtml(text)}</p>
        </div>
      `,
      "layers"
    );
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
    } catch (err) {
      /*
        Browser may block sound until user interaction.
      */
    }
  }

  function goHome() {
    if (!map) return;

    Panels?.closeAll?.();
    crimeMode = false;

    const crimeButton = document.getElementById("crimeTrackerButton");
    if (crimeButton) crimeButton.classList.remove("active");

    crimeLayer.clearLayers();
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

  function injectCrimeCss() {
    if (document.getElementById("crimeTrackerCoreCss")) return;

    const style = document.createElement("style");
    style.id = "crimeTrackerCoreCss";

    style.textContent = `
      #crimeTrackerButton.active {
        background: #ff8c00 !important;
        color: #00121f !important;
        border-color: #ff8c00 !important;
        box-shadow: 0 0 12px rgba(255, 140, 0, 0.55);
      }

      .node-dot.terror {
        background: #ff8c00 !important;
        box-shadow: 0 0 14px rgba(255, 140, 0, 0.75);
      }

      .node-dot.war {
        background: #ff174f !important;
        box-shadow: 0 0 14px rgba(255, 23, 79, 0.75);
      }
    `;

    document.head.appendChild(style);
  }

  function prettyCrime(value) {
    return String(value || "unknown")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (match) => match.toUpperCase());
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/[&<>"']/g, (match) => {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[match];
      });
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
    renderRiskRegions,
    renderSafetyRegions,
    renderConflictCountries,
    renderSafetyCountries
  };
})();
