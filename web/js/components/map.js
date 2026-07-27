(function () {
  const MoneyMap = {};

  let map = null;
  let baseLayer = null;
  let countryLayer = null;
  let eventLayer = null;
  let nodeLayer = null;
  let cityLayer = null;
  let localLayer = null;
  let crisisLayer = null;
  let selectedLayer = null;

  let countryGeoJson = null;
  let dotsVisible = true;

  let overlays = {
    conflict: true,
    crisis: true,
    watch: true
  };

  let localTimer = null;
  let lastLocalKey = "";
  let riskCache = new Map();
  let wikiCache = new Map();

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

    baseLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
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
    crisisLayer = L.layerGroup().addTo(map);
    selectedLayer = L.layerGroup().addTo(map);

    map.on("click", function (event) {
      openRiskAt(event.latlng.lat, event.latlng.lng);
    });

    map.on("zoomend moveend", function () {
      renderCities(window.MAP_DATA && window.MAP_DATA.cityNodes ? window.MAP_DATA.cityNodes : []);
      fetchLocalPlaces();
    });

    bindDotButton();
    bindOverlayButton();
    bindLanguage();
    renderLegend();
    loadCountryColours();

    setTimeout(function () {
      map.invalidateSize();
    }, 250);
  }

  function bindLanguage() {
    const select = $("#languageSelect");
    if (!select) return;

    select.addEventListener("change", function () {
      document.documentElement.lang = select.value || "en";
      document.documentElement.dir = "ltr";
    });
  }

  function bindDotButton() {
    const button = $("#dotToggleButton");
    if (!button) return;

    button.textContent = "DOTS ON";

    button.addEventListener("click", function () {
      dotsVisible = !dotsVisible;
      button.textContent = dotsVisible ? "DOTS ON" : "DOTS OFF";

      renderEvents(window.APP_STATE && window.APP_STATE.events ? window.APP_STATE.events : []);
      renderNodes(window.MAP_DATA && window.MAP_DATA.nodes ? window.MAP_DATA.nodes : []);
      renderCities(window.MAP_DATA && window.MAP_DATA.cityNodes ? window.MAP_DATA.cityNodes : []);

      if (!dotsVisible) {
        localLayer.clearLayers();
        crisisLayer.clearLayers();
      } else {
        fetchLocalPlaces();
      }
    });
  }

  function bindOverlayButton() {
    if ($("#overlayToggleButton")) return;

    const tools = $(".left-map-tools");
    if (!tools) return;

    const button = document.createElement("button");
    button.id = "overlayToggleButton";
    button.type = "button";
    button.textContent = "OVERLAYS";

    tools.insertBefore(button, tools.children[1] || null);

    button.addEventListener("click", function () {
      showOverlayPanel();
    });
  }

  function showOverlayPanel() {
    setInfo("Map overlays", `
      <div class="info-card">
        <h3>Map overlays</h3>
        <p class="plain">Turn map colour layers on or off. Colours update when new live event data changes country risk.</p>

        <div class="quick-list">
          <label class="quick-item">
            <input id="overlayConflict" type="checkbox" ${overlays.conflict ? "checked" : ""}>
            Conflict / war pressure
          </label>

          <label class="quick-item">
            <input id="overlayCrisis" type="checkbox" ${overlays.crisis ? "checked" : ""}>
            Crisis / disaster pressure
          </label>

          <label class="quick-item">
            <input id="overlayWatch" type="checkbox" ${overlays.watch ? "checked" : ""}>
            Watch countries
          </label>

          <div class="quick-item yellow">
            <b>Note:</b> this is country-level risk colour, not an exact frontline map.
          </div>
        </div>
      </div>
    `, "overlays");

    const conflict = $("#overlayConflict");
    const crisis = $("#overlayCrisis");
    const watch = $("#overlayWatch");

    if (conflict) {
      conflict.addEventListener("change", function (event) {
        overlays.conflict = event.target.checked;
        renderCountryColours();
      });
    }

    if (crisis) {
      crisis.addEventListener("change", function (event) {
        overlays.crisis = event.target.checked;
        renderCountryColours();
      });
    }

    if (watch) {
      watch.addEventListener("change", function (event) {
        overlays.watch = event.target.checked;
        renderCountryColours();
      });
    }
  }

  async function loadCountryColours() {
    try {
      countryGeoJson = await getJson("/api/boundaries/admin0");
      renderCountryColours();
    } catch (error) {
      console.warn("Country boundary load failed", error);
    }
  }

  function countryName(feature) {
    const p = feature.properties || {};
    return p.ADMIN || p.name || p.NAME || p.admin || p.NAME_EN || "";
  }

  function liveRiskForCountry(name) {
    const rows =
      (window.MAP_DATA && window.MAP_DATA.countryRisk) ||
      (window.APP_STATE && window.APP_STATE.countryRisk) ||
      [];

    const n = String(name || "").toLowerCase();

    return rows.find(function (row) {
      const c = String(row.country || "").toLowerCase();
      return c && n && (n.includes(c) || c.includes(n));
    });
  }

  function isWatchCountry(name) {
    return /ukraine|russia|syria|yemen|sudan|somalia|mali|burkina faso|niger|iran|iraq|afghanistan|pakistan|north korea|myanmar|haiti|libya|lebanon|israel|palestine/i.test(String(name || ""));
  }

  function renderCountryColours() {
    if (!countryLayer || !countryGeoJson || !Array.isArray(countryGeoJson.features)) return;

    countryLayer.clearLayers();

    L.geoJSON(countryGeoJson, {
      style: function (feature) {
        const name = countryName(feature);
        const live = liveRiskForCountry(name);

        let fill = "#00a66a";
        let fillOpacity = 0.045;
        let lineOpacity = 0.18;
        let weight = 0.7;

        if (live && live.risk >= 55 && overlays.conflict) {
          fill = "#ff174f";
          fillOpacity = 0.34;
          lineOpacity = 0.72;
          weight = 1.3;
        } else if (live && live.risk >= 25 && overlays.crisis) {
          fill = "#ff8c00";
          fillOpacity = 0.23;
          lineOpacity = 0.58;
          weight = 1.1;
        } else if (overlays.watch && isWatchCountry(name)) {
          fill = "#ff8c00";
          fillOpacity = 0.16;
          lineOpacity = 0.42;
          weight = 1;
        }

        return {
          color: fill,
          weight,
          opacity: lineOpacity,
          fillColor: fill,
          fillOpacity,
          className: "country-risk-fill"
        };
      },

      onEachFeature: function (feature, layer) {
        layer.on("click", function (event) {
          L.DomEvent.stopPropagation(event);
          openRiskAt(event.latlng.lat, event.latlng.lng);
        });
      }
    }).addTo(countryLayer);
  }

  function setData(mapData, state) {
    window.MAP_DATA = mapData || {};
    window.APP_STATE = state || {};

    renderCountryColours();
    renderNodes(window.MAP_DATA.nodes || []);
    renderCities(window.MAP_DATA.cityNodes || []);
    renderEvents(window.APP_STATE.events || []);
    fetchLocalPlaces();

    setTimeout(function () {
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
        .on("click", function (event) {
          L.DomEvent.stopPropagation(event);

          if (window.Renderers && typeof window.Renderers.renderEvent === "function") {
            window.Renderers.renderEvent(item);
          } else {
            renderBasicEvent(item);
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
        .on("click", function (event) {
          L.DomEvent.stopPropagation(event);

          if (window.Renderers && typeof window.Renderers.renderNode === "function") {
            window.Renderers.renderNode(item);
          } else {
            renderBasicEvent(item);
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

    for (const city of (cities || []).filter(function (c) {
      return bounds.pad(0.45).contains([c.lat, c.lng]);
    }).slice(0, limit)) {
      L.marker([city.lat, city.lng], {
        icon: iconFor("city")
      })
        .on("click", function (event) {
          L.DomEvent.stopPropagation(event);

          if (window.Renderers && typeof window.Renderers.renderLocalPlace === "function") {
            window.Renderers.renderLocalPlace(city);
          } else {
            renderBasicPlace(city);
          }
        })
        .addTo(cityLayer);
    }
  }

  function fetchLocalPlaces() {
    clearTimeout(localTimer);

    localTimer = setTimeout(async function () {
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

        for (const place of places.slice(0, 180)) {
          const lat = num(place.lat);
          const lng = num(place.lng);

          if (lat === null || lng === null) continue;

          L.marker([lat, lng], {
            icon: iconFor("city")
          })
            .on("click", function (event) {
              L.DomEvent.stopPropagation(event);

              if (window.Renderers && typeof window.Renderers.renderLocalPlace === "function") {
                window.Renderers.renderLocalPlace(place);
              } else {
                renderBasicPlace(place);
              }
            })
            .addTo(localLayer);
        }
      } catch (error) {
        console.warn("Local places failed", error);
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
          <div class="quick-item"><b>Latitude:</b> ${esc(lat.toFixed(5))}</div>
          <div class="quick-item"><b>Longitude:</b> ${esc(lng.toFixed(5))}</div>
          <div class="quick-item"><b>Loading:</b> place, local crime, national indicators, live events, weather and Wikipedia image.</div>
        </div>
      </div>
    `, "risk");

    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

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
    const politics = data.politics || {};
    const eventsNear = data.eventsNear || [];

    if (!country && !data.countryCode) {
      setInfo("Ocean / unmapped area", `
        <div class="info-card">
          <h3>Ocean / unmapped area</h3>
          <p class="plain">This did not resolve to land. Crime and safety values are not shown for ocean points.</p>

          <div class="quick-list">
            <div class="quick-item"><b>Latitude:</b> ${esc(lat.toFixed(5))}</div>
            <div class="quick-item"><b>Longitude:</b> ${esc(lng.toFixed(5))}</div>
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
          ${scoreTile("Terror", scores.terror && scores.terror.value, scores.terror && scores.terror.status, scores.terror && scores.terror.reason)}
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

          <div class="quick-item"><b>Political stability:</b> ${indicatorLine(politics.politicalStability)}</div>
          <div class="quick-item"><b>Government effectiveness:</b> ${indicatorLine(politics.governmentEffectiveness)}</div>
          <div class="quick-item"><b>Corruption control:</b> ${indicatorLine(politics.corruptionControl)}</div>
          <div class="quick-item"><b>Weather:</b> ${esc(weatherLine(data.weather))}</div>

          <div class="quick-item yellow"><b>Crime accuracy:</b> town-level crime changes only where an official local feed exists. UK uses data.police.uk. Other countries use national indicators plus live risk signals.</div>
        </div>
      </div>

      <div class="info-card">
        <h3>Nearby live signals</h3>
        <div class="quick-list">
          ${
            eventsNear.length
              ? eventsNear.slice(0, 8).map(function (event) {
                  return `
                    <div class="quick-item">
                      <b>${esc(normalKind(event.kind))}:</b> ${esc(event.title || event.summary || "Live signal")}
                      <br><span>${esc(Math.round(event.distance || 0))} km away | ${esc(event.source || "source")}</span>
                    </div>
                  `;
                }).join("")
              : `<div class="quick-item">No nearby live signals loaded.</div>`
          }
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

  function indicatorLine(indicator) {
    if (!indicator || indicator.value === null || indicator.value === undefined) return "N/A";
    return `${Number(indicator.value).toFixed(2)} (${indicator.year || "latest"})`;
  }

  function scoreTile(label, value, tag, source) {
    const n = num(value);
    let cls = "grey";

    if (n !== null) {
      if (label === "Safety" || label === "Crime") {
        if (n >= 75) cls = "green";
        else if (n >= 55) cls = "yellow";
        else if (n >= 35) cls = "orange";
        else cls = "red";
      } else {
        if (n >= 60) cls = "red";
        else if (n >= 30) cls = "orange";
        else if (n > 0) cls = "yellow";
        else cls = "green";
      }
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

    return `${c.temperatureC ?? "N/A"}°C, wind ${c.windKmh ?? "N/A"} km/h, gust ${c.gustKmh ?? "N/A"} km/h, rain ${c.rainMm ?? c.precipitationMm ?? "N/A"} mm`;
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
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        wikiCache.set(cacheKey, data);
        renderWiki(target, data);
      })
      .catch(function () {
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

    if (!dotsVisible) {
      setInfo("Crisis", `
        <div class="info-card">
          <h3>Crisis</h3>
          <p class="plain">Dots are off. Turn DOTS ON to display crisis dots on the map.</p>
        </div>
      `, "crisis");

      return;
    }

    setInfo("Crisis", `
      <div class="info-card">
        <h3>Loading crisis data</h3>
        <div class="loader-bar"><span></span></div>
        <p class="plain">Checking earthquakes, disasters, natural hazards and severe weather alerts.</p>
      </div>
    `, "crisis");

    try {
      const [quakeData, disasterData] = await Promise.all([
        getJson("/api/global-weather/earthquakes").catch(function () {
          return { earthquakes: [] };
        }),
        getJson("/api/global-weather/disasters").catch(function () {
          return { disasters: [] };
        })
      ]);

      const earthquakes = quakeData.earthquakes || [];
      const disasters = disasterData.disasters || [];

      for (const q of earthquakes.slice(0, 140)) {
        const lat = num(q.lat);
        const lng = num(q.lng);

        if (lat === null || lng === null) continue;

        L.marker([lat, lng], {
          icon: iconFor("crisis")
        })
          .on("click", function (event) {
            L.DomEvent.stopPropagation(event);

            setInfo("Earthquake", `
              <div class="info-card">
                <h3>${esc(q.title || "Earthquake")}</h3>

                <div class="quick-list">
                  <div class="quick-item"><b>Magnitude:</b> ${esc(q.magnitude ?? "N/A")}</div>
                  <div class="quick-item"><b>Place:</b> ${esc(q.place || "N/A")}</div>
                  <div class="quick-item"><b>Depth:</b> ${esc(q.depthKm ?? "N/A")} km</div>
                  <div class="quick-item"><b>Source:</b> USGS</div>
                  <div class="quick-item yellow"><b>Use:</b> check nearby safety, commodities, infrastructure and local disruption.</div>
                </div>

                <p class="source-box">${q.url ? `<a target="_blank" rel="noopener" href="${esc(q.url)}">USGS source</a>` : "USGS"}</p>
              </div>
            `, "crisis");
          })
          .addTo(crisisLayer);
      }

      for (const d of disasters.slice(0, 100)) {
        const lat = num(d.lat);
        const lng = num(d.lng);

        if (lat === null || lng === null) continue;

        L.marker([lat, lng], {
          icon: iconFor("crisis")
        })
          .on("click", function (event) {
            L.DomEvent.stopPropagation(event);

            setInfo("Disaster", `
              <div class="info-card">
                <h3>${esc(d.title || "Disaster")}</h3>
                <p class="plain">${esc(d.summary || "Disaster or natural hazard alert.")}</p>

                <div class="quick-list">
                  <div class="quick-item"><b>Source:</b> ${esc(d.source || d.sourceSystem || "source")}</div>
                  <div class="quick-item"><b>Place:</b> ${esc(d.place || "mapped point")}</div>
                  <div class="quick-item yellow"><b>Use:</b> check local disruption, supply routes, weather and commodities.</div>
                </div>

                <p class="source-box">${d.url ? `<a target="_blank" rel="noopener" href="${esc(d.url)}">open source</a>` : esc(d.source || "source")}</p>
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
            ${scoreTile("Disasters", disasters.length, "GDACS / EONET / ReliefWeb / NWS", "live sources")}
          </div>

          <p class="plain">Crisis dots are now on the map. Click a crisis dot for detail.</p>
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
        <p class="plain">Click any land area. The card will load exact place, local crime where available, national indicators, live conflict pressure, crisis pressure, weather, governance indicators and Wikipedia image.</p>

        <div class="quick-list">
          <div class="quick-item"><b>Best use:</b> compare safety, crime, war, terror, politics and crisis signals.</div>
          <div class="quick-item"><b>Missing data:</b> shown as N/A instead of fake numbers.</div>
        </div>
      </div>
    `, "risk");
  }

  function newEvent(event) {
    if (!event) return;

    renderCountryColours();
    renderEvents(window.APP_STATE && window.APP_STATE.events ? window.APP_STATE.events : []);

    const toast = $("#toast");
    if (!toast) return;

    const title =
      window.Renderers && typeof window.Renderers.plainEventTitle === "function"
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
      close.onclick = function () {
        toast.classList.remove("show");
      };
    }

    const open = toast.querySelector("#liveAlertGo");
    if (open) {
      open.onclick = function () {
        if (event.lat && event.lng && map) {
          map.setView([event.lat, event.lng], Math.max(map.getZoom(), 7));
        }

        if (window.Renderers && typeof window.Renderers.renderEvent === "function") {
          window.Renderers.renderEvent(event);
        } else {
          renderBasicEvent(event);
        }
      };
    }

    setTimeout(function () {
      toast.classList.remove("show");
    }, 18000);
  }

  function renderBasicEvent(item) {
    setInfo(item.title || item.name || "Map item", `
      <div class="info-card">
        <h3>${esc(item.title || item.name || "Map item")}</h3>

        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(normalKind(item.kind))}</div>
          <div class="quick-item"><b>Place:</b> ${esc(item.place || item.country || "mapped point")}</div>
          <div class="quick-item"><b>Source:</b> ${esc(item.source || item.sourceSystem || "source")}</div>
          <div class="quick-item"><b>Summary:</b> ${esc(item.summary || item.title || "No summary")}</div>
        </div>
      </div>
    `, "event");
  }

  function renderBasicPlace(place) {
    setInfo(place.name || "Place", `
      <div class="info-card">
        <h3>${esc(place.name || "Place")}</h3>

        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(place.kind || (place.tags && (place.tags.place || place.tags.amenity)) || "place")}</div>
          <div class="quick-item"><b>Latitude:</b> ${esc(place.lat || "N/A")}</div>
          <div class="quick-item"><b>Longitude:</b> ${esc(place.lng || "N/A")}</div>
          <div class="quick-item"><b>Source:</b> ${esc(place.source || "OpenStreetMap")}</div>
        </div>
      </div>
    `, "place");
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

    legend.innerHTML = rows.map(function ([name, colour]) {
      return `<span><i style="background:${colour}"></i>${esc(name)}</span>`;
    }).join("");
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
    if ($("#sme-map-fixed-css")) return;

    const style = document.createElement("style");
    style.id = "sme-map-fixed-css";

    style.textContent = `
      #map {
        background: #082232 !important;
      }

      .leaflet-tile-pane {
        filter: saturate(1.28) hue-rotate(165deg) brightness(1.12) contrast(1.04) !important;
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

      .sme-dot-crisis {
        border-color: #ff174f !important;
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
        min-width: 88px;
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
