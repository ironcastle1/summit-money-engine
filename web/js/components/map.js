(function () {
  const MoneyMap = {};

  let map = null;
  let countryLayer = null;
  let eventLayer = null;
  let nodeLayer = null;
  let cityLayer = null;
  let localLayer = null;
  let crisisLayer = null;
  let selectedLayer = null;

  let countryGeoJson = null;
  let dotsVisible = true;
  let localTimer = null;
  let lastLocalKey = "";
  let riskCache = new Map();
  let wikiCache = new Map();

  const riskCountries = new Set([
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

  const watchCountries = new Set([
    "Iran",
    "Iraq",
    "Pakistan",
    "North Korea",
    "Venezuela",
    "Libya",
    "Ethiopia",
    "Democratic Republic of the Congo"
  ]);

  const dotColours = {
    war: "#ff174f",
    terror: "#ff8c00",
    crisis: "#ffffff",
    politics: "#b24cff",
    shipping: "#00d8ff",
    ai: "#00fff0",
    commodity: "#ffd94a",
    energy: "#00ff87",
    finance: "#3ea0ff",
    city: "#7aa7ff",
    risk: "#ff326a"
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (match) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[match]));
  }

  function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  async function getJson(url) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`${url} failed with ${response.status}`);
    }

    return response.json();
  }

  function init() {
    if (map) return;

    injectCss();

    map = L.map("map", {
      preferCanvas: true,
      minZoom: 2,
      maxZoom: 16,
      zoomControl: true,
      worldCopyJump: false
    }).setView([20, 12], 2.85);

    window.map = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      updateWhenIdle: false,
      keepBuffer: 4
    }).addTo(map);

    countryLayer = L.layerGroup().addTo(map);
    eventLayer = L.layerGroup().addTo(map);
    nodeLayer = L.layerGroup().addTo(map);
    cityLayer = L.layerGroup().addTo(map);
    localLayer = L.layerGroup().addTo(map);
    crisisLayer = L.layerGroup();
    selectedLayer = L.layerGroup().addTo(map);

    map.on("click", (event) => {
      openRiskAt(event.latlng.lat, event.latlng.lng);
    });

    map.on("zoomend moveend", () => {
      renderCities(window.MAP_DATA?.cityNodes || []);
      fetchLocalPlaces();
    });

    bindLanguage();
    bindDotButton();

    renderLegend();
    loadCountryColours();

    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }

  function bindLanguage() {
    const select = $("#languageSelect");
    if (!select) return;

    select.addEventListener("change", () => {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = select.value || "en";
    });
  }

  function bindDotButton() {
    const button = $("#dotToggleButton");
    if (!button) return;

    button.addEventListener("click", () => {
      dotsVisible = !dotsVisible;
      button.textContent = dotsVisible ? "DOTS ON" : "DOTS OFF";
      renderEvents(window.APP_STATE?.events || []);
      renderNodes(window.MAP_DATA?.nodes || []);
      renderCities(window.MAP_DATA?.cityNodes || []);
      fetchLocalPlaces();
    });
  }

  async function loadCountryColours() {
    try {
      countryGeoJson = await getJson("/api/boundaries/admin0");
      renderCountryColours();
    } catch (error) {
      console.warn("country boundary colours failed", error);
    }
  }

  function renderCountryColours() {
    if (!countryLayer || !countryGeoJson || !Array.isArray(countryGeoJson.features)) return;

    countryLayer.clearLayers();

    L.geoJSON(countryGeoJson, {
      style: (feature) => {
        const p = feature.properties || {};
        const name = p.name || p.admin || p.NAME || "";

        let fill = "#00a66a";
        let opacity = 0.055;

        if (nameMatch(name, riskCountries)) {
          fill = "#ff174f";
          opacity = 0.34;
        } else if (nameMatch(name, watchCountries)) {
          fill = "#ff8c00";
          opacity = 0.20;
        }

        return {
          color: fill,
          weight: 1,
          opacity: 0.55,
          fillColor: fill,
          fillOpacity: opacity,
          className: "country-risk-fill"
        };
      },
      onEachFeature: (feature, layer) => {
        layer.on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          openRiskAt(event.latlng.lat, event.latlng.lng);
        });
      }
    }).addTo(countryLayer);
  }

  function nameMatch(name, set) {
    const n = String(name || "").toLowerCase();

    for (const item of set) {
      if (n.includes(String(item).toLowerCase())) return true;
    }

    return false;
  }

  function setData(mapData, state) {
    window.MAP_DATA = mapData || {};
    window.APP_STATE = state || {};

    renderCountryColours();
    renderNodes(window.MAP_DATA.nodes || []);
    renderCities(window.MAP_DATA.cityNodes || []);
    renderEvents(window.APP_STATE.events || []);
    fetchLocalPlaces();

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);
  }

  function normalKind(kind) {
    if (["disaster", "weather", "earthquake", "quake"].includes(kind)) return "crisis";
    if (kind === "tech") return "ai";
    if (kind === "election") return "politics";
    return kind || "risk";
  }

  function iconFor(kind) {
    const k = normalKind(kind);
    const colour = dotColours[k] || dotColours.risk;

    return L.divIcon({
      className: "",
      html: `<div class="sme-dot sme-dot-${esc(k)}" style="background:${colour};box-shadow:0 0 16px ${colour};"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  function renderEvents(events) {
    if (!eventLayer) return;

    eventLayer.clearLayers();

    if (!dotsVisible) return;

    for (const item of events || []) {
      const lat = num(item.lat);
      const lng = num(item.lng);
      if (lat === null || lng === null) continue;

      L.marker([lat, lng], {
        icon: iconFor(item.kind)
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);

          if (window.Renderers && typeof window.Renderers.renderEvent === "function") {
            window.Renderers.renderEvent(item);
          }
        })
        .addTo(eventLayer);
    }
  }

  function renderNodes(nodes) {
    if (!nodeLayer) return;

    nodeLayer.clearLayers();

    if (!dotsVisible) return;

    for (const item of nodes || []) {
      const lat = num(item.lat);
      const lng = num(item.lng);
      if (lat === null || lng === null) continue;

      L.marker([lat, lng], {
        icon: iconFor(item.kind)
      })
        .on("click", (event) => {
          L.DomEvent.stopPropagation(event);

          if (window.Renderers && typeof window.Renderers.renderNode === "function") {
            window.Renderers.renderNode(item);
          }
        })
        .addTo(nodeLayer);
    }
  }

  function renderCities(cities) {
    if (!cityLayer || !map) return;

    cityLayer.clearLayers();

    if (!dotsVisible) return;
    if (map.getZoom() < 5) return;

    const bounds = map.getBounds();
    const limit = map.getZoom() >= 10 ? 700 : map.getZoom() >= 8 ? 400 : 170;

    for (const city of (cities || []).filter((c) => bounds.pad(0.45).contains([c.lat, c.lng])).slice(0, limit)) {
      L.marker([city.lat, city.lng], {
        icon: iconFor("city")
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

  function fetchLocalPlaces() {
    clearTimeout(localTimer);

    localTimer = setTimeout(async () => {
      if (!map || !localLayer) return;

      localLayer.clearLayers();

      if (!dotsVisible) return;
      if (map.getZoom() < 8) return;

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

        const data = await getJson(url);
        const places = data.places || [];

        for (const place of places.slice(0, 160)) {
          const lat = num(place.lat);
          const lng = num(place.lng);
          if (lat === null || lng === null) continue;

          L.marker([lat, lng], {
            icon: iconFor("city")
          })
            .on("click", (event) => {
              L.DomEvent.stopPropagation(event);

              if (window.Renderers && typeof window.Renderers.renderLocalPlace === "function") {
                window.Renderers.renderLocalPlace(place);
              }
            })
            .addTo(localLayer);
        }
      } catch (error) {
        console.warn("local places failed", error);
      }
    }, 350);
  }

  async function openContext(lat, lng, zoom = null) {
    if (zoom && map) {
      map.setView([lat, lng], Math.max(map.getZoom(), zoom));
    }

    await openRiskAt(Number(lat), Number(lng));
  }

  async function openRiskAt(lat, lng) {
    if (!map) return;

    selectedLayer.clearLayers();

    L.circleMarker([lat, lng], {
      radius: 7,
      color: "#00eaff",
      weight: 2,
      fillColor: "#00eaff",
      fillOpacity: 0.18
    }).addTo(selectedLayer);

    setInfo("Loading place", `
      <div class="info-card">
        <h3>Checking exact place</h3>
        <div class="loader-bar"><span></span></div>

        <div class="quick-list">
          <div class="quick-item"><b>Clicked latitude:</b> ${esc(lat.toFixed(5))}</div>
          <div class="quick-item"><b>Clicked longitude:</b> ${esc(lng.toFixed(5))}</div>
          <div class="quick-item"><b>Status:</b> loading town, country, crime, safety, weather and image data.</div>
        </div>
      </div>
    `, "risk");

    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;

    if (riskCache.has(cacheKey)) {
      renderRiskCard(riskCache.get(cacheKey), lat, lng);
      return;
    }

    try {
      const data = await getJson(`/api/global-risk/point?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
      riskCache.set(cacheKey, data);
      renderRiskCard(data, lat, lng);
    } catch (error) {
      console.error(error);

      setInfo("Risk failed", `
        <div class="info-card">
          <h3>Risk data failed</h3>
          <p class="plain">The backend did not return data. No fake values shown.</p>

          <div class="quick-list">
            <div class="quick-item"><b>Latitude:</b> ${esc(lat.toFixed(5))}</div>
            <div class="quick-item"><b>Longitude:</b> ${esc(lng.toFixed(5))}</div>
          </div>
        </div>
      `, "risk");
    }
  }

  function renderRiskCard(data, lat, lng) {
    const place = data.place || {};
    const raw = place.raw || {};
    const country = place.country || data.countryName || "";
    const scores = data.scores || {};
    const localCrime = data.localCrime || {};
    const homicide = data.national && data.national.homicide;

    if (!country && !data.countryCode) {
      setInfo("Ocean / unmapped area", `
        <div class="info-card">
          <h3>Ocean / unmapped area</h3>
          <p class="plain">This click did not resolve to land. Crime and country safety are not shown for ocean points.</p>

          <div class="quick-list">
            <div class="quick-item"><b>Latitude:</b> ${esc(lat.toFixed(5))}</div>
            <div class="quick-item"><b>Longitude:</b> ${esc(lng.toFixed(5))}</div>
            <div class="quick-item yellow"><b>Rule:</b> no fake country values for ocean clicks.</div>
          </div>
        </div>
      `, "risk");
      return;
    }

    const exactParts = [
      raw.neighbourhood,
      raw.suburb,
      raw.city,
      raw.town,
      raw.village,
      raw.county,
      raw.state,
      country
    ].filter(Boolean);

    const exactName = exactParts.join(", ") || country || "Selected land area";
    const imageId = `place-image-${Math.random().toString(16).slice(2)}`;

    setInfo("Place Risk", `
      <div class="info-card">
        <h3>${esc(exactName)}</h3>
        <p class="plain">${esc(place.displayName || exactName)}</p>

        <div class="index-grid real-indexes">
          ${scoreTile("Safety", scores.safety && scores.safety.score, scores.safety && scores.safety.status, scores.safety && scores.safety.reason)}
          ${scoreTile("Crime", scores.crime && scores.crime.score, scores.crime && scores.crime.status, scores.crime && scores.crime.reason)}
          ${scoreTile("War", scores.war && scores.war.value, scores.war && scores.war.status, scores.war && scores.war.reason)}
          ${scoreTile("Politics", scores.politics && scores.politics.value, scores.politics && scores.politics.status, scores.politics && scores.politics.reason)}
          ${scoreTile("Crisis", scores.crisis && scores.crisis.value, scores.crisis && scores.crisis.status, scores.crisis && scores.crisis.reason)}
        </div>

        <div class="quick-list">
          <div class="quick-item"><b>Clicked point:</b> ${esc(lat.toFixed(5))}, ${esc(lng.toFixed(5))}</div>
          <div class="quick-item"><b>Exact place:</b> ${esc(exactName)}</div>
          <div class="quick-item"><b>Country:</b> ${esc(country || "N/A")} ${data.countryCode ? `(${esc(data.countryCode)})` : ""}</div>
          <div class="quick-item"><b>Local crime:</b> ${
            localCrime.available
              ? esc(`${localCrime.total} official local crimes, ${localCrime.date}`)
              : "N/A, no official local crime feed connected here"
          }</div>
          <div class="quick-item"><b>National homicide:</b> ${
            homicide && homicide.value !== null && homicide.value !== undefined
              ? `${esc(Number(homicide.value).toFixed(1))} per 100k, ${esc(homicide.year)}`
              : "N/A"
          }</div>
          <div class="quick-item"><b>Weather now:</b> ${esc(weatherLine(data.weather))}</div>
          <div class="quick-item yellow"><b>Crime accuracy:</b> local crime only changes by town where an official local feed exists. Otherwise national indicators repeat because that is the available source.</div>
        </div>
      </div>

      <div id="${imageId}" class="info-card">
        <h3>Place image</h3>
        <div class="loader-bar"><span></span></div>
        <p class="plain">Checking Wikipedia for a sourced image.</p>
      </div>
    `, "risk");

    loadWikiForPlace(imageId, exactParts[0] || country, country);
  }

  function scoreTile(label, value, tag, source) {
    const n = num(value);

    let cls = "grey";

    if (n !== null) {
      if (n >= 75) cls = "green";
      else if (n >= 55) cls = "yellow";
      else if (n >= 35) cls = "orange";
      else cls = "red";
    }

    return `
      <div class="index-tile ${cls}">
        <div class="label">${esc(label)}</div>
        <div class="num">${n === null ? "N/A" : Math.round(n)}</div>
        <div class="tag">${esc(tag || (n === null ? "No data" : "Current"))}</div>
        <div class="mini-source">${esc(source || "")}</div>
      </div>
    `;
  }

  function weatherLine(weather) {
    if (!weather || !weather.current) return "N/A";

    const c = weather.current;

    return `${c.temperatureC ?? "N/A"}°C, wind ${c.windKmh ?? "N/A"} km/h, gust ${c.gustKmh ?? "N/A"} km/h, rain ${c.precipitationMm ?? "N/A"} mm`;
  }

  function loadWikiForPlace(targetId, placeName, countryName) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const query = [placeName, countryName].filter(Boolean).join(", ");
    const cacheKey = query.toLowerCase();

    if (wikiCache.has(cacheKey)) {
      renderWiki(target, wikiCache.get(cacheKey));
      return;
    }

    const params = new URLSearchParams();
    params.set("name", query);

    fetch(`/api/wiki/place?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        wikiCache.set(cacheKey, data);
        renderWiki(target, data);
      })
      .catch(() => {
        target.innerHTML = `
          <h3>Place image</h3>
          <p class="plain">Wikipedia image lookup failed.</p>
        `;
      });
  }

  function renderWiki(target, data) {
    if (!data || !data.found) {
      target.innerHTML = `
        <h3>Place image</h3>
        <p class="plain">No Wikipedia image found. No fake image inserted.</p>
      `;
      return;
    }

    target.innerHTML = `
      <h3>${esc(data.title || "Wikipedia")}</h3>
      ${data.thumbnail ? `<img class="wiki-img" src="${esc(data.thumbnail)}" alt="${esc(data.title || "Place image")}">` : ""}
      <p class="plain">${esc(String(data.extract || "").slice(0, 360) || "No summary returned.")}</p>
      <p class="source-box">${data.url ? `<a target="_blank" rel="noopener" href="${esc(data.url)}">Wikipedia source</a>` : "Wikipedia"}</p>
    `;
  }

  async function loadCrisis() {
    crisisLayer.clearLayers();

    if (!map.hasLayer(crisisLayer)) {
      crisisLayer.addTo(map);
    }

    setInfo("Crisis", `
      <div class="info-card">
        <h3>Loading crisis data</h3>
        <div class="loader-bar"><span></span></div>
        <p class="plain">Checking earthquakes and disaster feeds.</p>
      </div>
    `, "crisis");

    try {
      const [quakeData, disasterData] = await Promise.all([
        getJson("/api/global-weather/earthquakes").catch(() => ({ earthquakes: [] })),
        getJson("/api/global-weather/disasters").catch(() => ({ disasters: [] }))
      ]);

      const earthquakes = quakeData.earthquakes || [];
      const disasters = disasterData.disasters || [];

      for (const q of earthquakes.slice(0, 120)) {
        const lat = num(q.lat);
        const lng = num(q.lng);
        if (lat === null || lng === null) continue;

        L.marker([lat, lng], {
          icon: iconFor("crisis")
        })
          .on("click", (event) => {
            L.DomEvent.stopPropagation(event);

            setInfo("Earthquake", `
              <div class="info-card">
                <h3>${esc(q.title || "Earthquake")}</h3>

                <div class="quick-list">
                  <div class="quick-item"><b>Magnitude:</b> ${esc(q.magnitude ?? "N/A")}</div>
                  <div class="quick-item"><b>Place:</b> ${esc(q.place || "N/A")}</div>
                  <div class="quick-item"><b>Depth:</b> ${esc(q.depthKm ?? "N/A")} km</div>
                  <div class="quick-item"><b>Source:</b> USGS</div>
                  <div class="quick-item yellow"><b>Use:</b> check nearby ports, routes, commodities and local safety.</div>
                </div>

                <p class="source-box">${q.url ? `<a target="_blank" rel="noopener" href="${esc(q.url)}">USGS source</a>` : "USGS"}</p>
              </div>
            `, "crisis");
          })
          .addTo(crisisLayer);
      }

      setInfo("Crisis", `
        <div class="info-card">
          <h3>Crisis</h3>

          <div class="index-grid real-indexes">
            ${scoreTile("Earthquakes", earthquakes.length, "USGS records", "USGS")}
            ${scoreTile("Disasters", disasters.length, "GDACS records", "GDACS")}
          </div>

          <p class="plain">Crisis dots are added to the map. Click a dot for detail.</p>
        </div>
      `, "crisis");
    } catch (error) {
      setInfo("Crisis failed", `
        <div class="info-card">
          <h3>Crisis failed</h3>
          <p class="plain">Crisis endpoint did not respond.</p>
        </div>
      `, "crisis");
    }
  }

  function showGlobalRiskIntro() {
    setInfo("Global Risk", `
      <div class="info-card">
        <h3>Global Risk</h3>
        <p class="plain">Click any land area. The card will show the exact resolved place, available crime source, safety, war, politics, crisis, weather and Wikipedia image.</p>

        <div class="quick-list">
          <div class="quick-item"><b>Town detail:</b> uses reverse geocoding and local place data where available.</div>
          <div class="quick-item"><b>Crime:</b> town-level only where an official local crime feed exists.</div>
          <div class="quick-item"><b>Missing data:</b> shown as N/A instead of made up.</div>
        </div>
      </div>
    `, "risk");
  }

  function newEvent(event) {
    if (!event) return;

    renderEvents(window.APP_STATE?.events || []);

    const toast = $("#toast");
    if (!toast) return;

    const title = window.Renderers && typeof window.Renderers.plainEventTitle === "function"
      ? window.Renderers.plainEventTitle(event)
      : event.title || "Live alert";

    toast.innerHTML = `
      <button class="toast-close" type="button">×</button>
      <div class="a-title">LIVE ALERT</div>
      <div class="a-meta">${esc(title)}</div>
      <button id="liveAlertGo" type="button">OPEN ON MAP</button>
    `;

    toast.classList.add("show");

    const close = toast.querySelector(".toast-close");
    if (close) {
      close.onclick = () => toast.classList.remove("show");
    }

    const open = toast.querySelector("#liveAlertGo");
    if (open) {
      open.onclick = () => {
        if (event.lat && event.lng && map) {
          map.setView([event.lat, event.lng], Math.max(map.getZoom(), 7));
        }

        if (window.Renderers && typeof window.Renderers.renderEvent === "function") {
          window.Renderers.renderEvent(event);
        }
      };
    }

    setTimeout(() => {
      toast.classList.remove("show");
    }, 18000);
  }

  function renderLegend() {
    const legend = $("#legend");
    if (!legend) return;

    const rows = [
      ["war", dotColours.war],
      ["terror", dotColours.terror],
      ["crisis", dotColours.crisis],
      ["politics", dotColours.politics],
      ["shipping", dotColours.shipping],
      ["energy", dotColours.energy],
      ["finance", dotColours.finance],
      ["city", dotColours.city]
    ];

    legend.innerHTML = rows.map(([name, colour]) => `
      <span><i style="background:${colour}"></i>${esc(name)}</span>
    `).join("");
  }

  function setInfo(title, html, type) {
    if (window.Panels && typeof window.Panels.setInfo === "function") {
      window.Panels.setInfo(title, html, type);
      return;
    }

    const panel = $("#infoPanel");
    const titleEl = $("#infoTitle");
    const body = $("#infoBody");

    if (panel) panel.classList.add("open", "active");
    if (titleEl) titleEl.textContent = title || "Info";
    if (body) body.innerHTML = html || "";
  }

  function goHome() {
    if (!map) return;

    const info = $("#infoPanel");
    const drawer = $("#drawerPanel");

    if (info) info.classList.remove("open", "active");
    if (drawer) drawer.classList.remove("open", "active");

    selectedLayer.clearLayers();
    map.setView([20, 12], 2.85);
  }

  function injectCss() {
    if ($("#sme-map-fix-css")) return;

    const style = document.createElement("style");
    style.id = "sme-map-fix-css";

    style.textContent = `
      #map {
        background: #082232 !important;
      }

      .leaflet-tile-pane {
        filter: saturate(1.25) hue-rotate(165deg) brightness(1.02) contrast(1.05) !important;
      }

      .country-risk-fill {
        mix-blend-mode: screen;
        pointer-events: auto;
      }

      .sme-dot {
        width: 17px;
        height: 17px;
        border-radius: 50%;
        border: 2px solid #ffffff;
      }

      .sme-dot-war {
        background: #ff174f !important;
      }

      .sme-dot-terror {
        background: #ff8c00 !important;
      }

      .sme-dot-crisis {
        background: #ffffff !important;
        border-color: #ff174f !important;
      }

      .sme-dot-politics {
        background: #b24cff !important;
      }

      .sme-dot-ai {
        background: #00fff0 !important;
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
        padding: 8px 10px;
        font-weight: 900;
        cursor: pointer;
        font-size: 11px;
        min-width: 76px;
      }

      .left-map-tools button:hover {
        background: #00d8ff;
        color: #00111f;
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

      .wiki-img {
        width: 100%;
        max-height: 210px;
        object-fit: cover;
        border: 1px solid #00d8ff;
        margin: 8px 0;
      }

      .boot-error {
        color: #ff3860;
        padding: 20px;
        font-family: monospace;
        white-space: pre-wrap;
      }

      .toast-close {
        position: absolute;
        top: 6px;
        right: 7px;
        width: 24px;
        height: 24px;
        border: 1px solid #00d8ff;
        background: #001827;
        color: #fff;
        cursor: pointer;
      }
    `;

    document.head.appendChild(style);
  }

  MoneyMap.init = init;
  MoneyMap.setData = setData;
  MoneyMap.renderEvents = renderEvents;
  MoneyMap.renderCities = renderCities;
  MoneyMap.openContext = openContext;
  MoneyMap.goHome = goHome;
  MoneyMap.newEvent = newEvent;
  MoneyMap.loadCrisis = loadCrisis;
  MoneyMap.showGlobalRiskIntro = showGlobalRiskIntro;

  window.MoneyMap = MoneyMap;
})();
