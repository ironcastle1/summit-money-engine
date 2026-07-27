(function () {
  const APP = {
    state: null,
    mapData: null,
    booted: false
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function setStatus(text) {
    const el = $("#status");
    if (el) el.textContent = text;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForMoneyMap() {
    for (let i = 0; i < 80; i++) {
      if (window.MoneyMap && typeof window.MoneyMap.init === "function") {
        return window.MoneyMap;
      }

      await sleep(100);
    }

    throw new Error("MoneyMap did not load. Check web/js/components/map.js");
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

  async function postJson(url) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`${url} failed with ${response.status}`);
    }

    return response.json();
  }

  async function loadState() {
    try {
      const state = await getJson("/api/state");
      APP.state = state;
      window.APP_STATE = state;

      if (window.Renderers && typeof window.Renderers.renderMarkets === "function") {
        window.Renderers.renderMarkets(state.markets || []);
      }

      return state;
    } catch (err) {
      console.error(err);
      setStatus("state failed");

      APP.state = {
        events: [],
        markets: [],
        predictions: [],
        rapid: [],
        polymarket: []
      };

      window.APP_STATE = APP.state;
      return APP.state;
    }
  }

  async function loadMapData() {
    try {
      const mapData = await getJson("/api/map-data");
      APP.mapData = mapData;
      window.MAP_DATA = mapData;
      window.ROUTES = mapData.routes || [];
      return mapData;
    } catch (err) {
      console.error(err);

      APP.mapData = {
        nodes: [],
        cityNodes: [],
        routes: [],
        riskRegions: [],
        safetyRegions: [],
        conflictCountries: [],
        safetyCountries: []
      };

      window.MAP_DATA = APP.mapData;
      window.ROUTES = [];
      return APP.mapData;
    }
  }

  async function refreshNow() {
    setStatus("refreshing");

    try {
      try {
        await postJson("/api/refresh");
      } catch (err) {
        console.warn("refresh endpoint failed, loading current state instead", err);
      }

      const [state, mapData] = await Promise.all([
        loadState(),
        loadMapData()
      ]);

      if (window.MoneyMap && typeof window.MoneyMap.setData === "function") {
        window.MoneyMap.setData(mapData, state);
      }

      const time = state.lastRefresh ? new Date(state.lastRefresh) : new Date();
      setStatus(`LIVE ${time.toLocaleTimeString()}`);
    } catch (err) {
      console.error(err);
      setStatus("refresh failed");
    }
  }

  function bindTopMenu() {
    document.querySelectorAll("[data-panel]").forEach((button) => {
      button.addEventListener("click", () => {
        const panel = button.dataset.panel;

        if (window.Renderers && typeof window.Renderers.openPanel === "function") {
          window.Renderers.openPanel(panel);
          return;
        }

        if (window.Panels && typeof window.Panels.setInfo === "function") {
          window.Panels.setInfo(
            button.textContent || "Panel",
            `<div class="info-card"><h3>${button.textContent || "Panel"}</h3><p class="plain">Panel renderer not loaded.</p></div>`,
            panel
          );
        }
      });
    });

    const home = $("#homeMap");
    if (home) {
      home.addEventListener("click", () => {
        if (window.MoneyMap && typeof window.MoneyMap.goHome === "function") {
          window.MoneyMap.goHome();
        }
      });
    }

    const refresh = $("#refresh");
    if (refresh) {
      refresh.addEventListener("click", refreshNow);
    }

    const search = $("#placeSearch");
    if (search) {
      search.addEventListener("submit", async (event) => {
        event.preventDefault();

        const input = $("#placeQuery");
        const q = input ? input.value.trim() : "";

        if (!q) return;

        if (window.Panels && typeof window.Panels.setInfo === "function") {
          window.Panels.setInfo(
            "Search",
            `<div class="info-card"><h3>Search</h3><div class="loader-bar"><span></span></div><p class="plain">Searching ${escapeHtml(q)}...</p></div>`,
            "search"
          );
        }

        try {
          const result = await getJson(`/api/search?q=${encodeURIComponent(q)}`);

          if (window.Renderers && typeof window.Renderers.renderSearch === "function") {
            window.Renderers.renderSearch(result);
            return;
          }

          const first = result.places && result.places[0];
          if (first && window.MoneyMap && typeof window.MoneyMap.openContext === "function") {
            window.MoneyMap.openContext(first.lat, first.lng, 9);
          }
        } catch (err) {
          console.error(err);

          if (window.Panels && typeof window.Panels.setInfo === "function") {
            window.Panels.setInfo(
              "Search failed",
              `<div class="info-card"><h3>Search failed</h3><p class="plain">No result loaded.</p></div>`,
              "search"
            );
          }
        }
      });
    }
  }

  function bindSse() {
    if (!window.EventSource) return;

    try {
      const source = new EventSource("/api/stream");

      source.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "state" && payload.state) {
            APP.state = payload.state;
            window.APP_STATE = payload.state;

            if (window.Renderers && typeof window.Renderers.renderMarkets === "function") {
              window.Renderers.renderMarkets(payload.state.markets || []);
            }

            if (window.MoneyMap && typeof window.MoneyMap.renderEvents === "function") {
              window.MoneyMap.renderEvents(payload.state.events || []);
            }
          }

          if (payload.type === "event" && payload.event) {
            if (!APP.state) APP.state = { events: [] };
            if (!Array.isArray(APP.state.events)) APP.state.events = [];

            APP.state.events.unshift(payload.event);
            APP.state.events = APP.state.events.slice(0, 600);
            window.APP_STATE = APP.state;

            if (window.MoneyMap && typeof window.MoneyMap.newEvent === "function") {
              window.MoneyMap.newEvent(payload.event);
            }
          }
        } catch (err) {
          console.warn("stream parse failed", err);
        }
      });

      source.addEventListener("error", () => {
        console.warn("stream disconnected");
      });
    } catch (err) {
      console.warn("stream unavailable", err);
    }
  }

  function installErrorBox() {
    window.addEventListener("error", (event) => {
      const map = $("#map");
      if (!map) return;

      const message = event.error && event.error.stack
        ? event.error.stack
        : event.message;

      map.innerHTML = `
        <pre class="boot-error">${escapeHtml(message)}</pre>
      `;
    });

    window.addEventListener("unhandledrejection", (event) => {
      const map = $("#map");
      if (!map) return;

      const message = event.reason && event.reason.stack
        ? event.reason.stack
        : String(event.reason || "Unhandled promise rejection");

      map.innerHTML = `
        <pre class="boot-error">${escapeHtml(message)}</pre>
      `;
    });
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

  async function boot() {
    installErrorBox();
    bindTopMenu();

    const MoneyMap = await waitForMoneyMap();

    MoneyMap.init();

    const [state, mapData] = await Promise.all([
      loadState(),
      loadMapData()
    ]);

    MoneyMap.setData(mapData, state);

    bindSse();

    const time = state.lastRefresh ? new Date(state.lastRefresh) : new Date();
    setStatus(`LIVE ${time.toLocaleTimeString()}`);

    APP.booted = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    boot().catch((err) => {
      console.error(err);
      setStatus("boot failed");

      const map = $("#map");
      if (map) {
        map.innerHTML = `
          <pre class="boot-error">${escapeHtml(err.stack || err.message || err)}</pre>
        `;
      }
    });
  });
})();
