(function () {
  const APP = {
    state: null,
    mapData: null
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function setStatus(text) {
    const el = $("#status");
    if (el) el.textContent = text;
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

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForMoneyMap() {
    for (let i = 0; i < 80; i++) {
      if (window.MoneyMap && typeof window.MoneyMap.init === "function") {
        return window.MoneyMap;
      }

      await wait(75);
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

      APP.state = state || {};
      window.APP_STATE = APP.state;

      if (window.Renderers && typeof window.Renderers.renderMarkets === "function") {
        window.Renderers.renderMarkets(APP.state.markets || []);
      }

      return APP.state;
    } catch (error) {
      console.error(error);

      APP.state = {
        events: [],
        markets: [],
        predictions: [],
        rapid: []
      };

      window.APP_STATE = APP.state;

      if (window.Renderers && typeof window.Renderers.renderMarkets === "function") {
        window.Renderers.renderMarkets([]);
      }

      setStatus("state failed");

      return APP.state;
    }
  }

  async function loadMapData() {
    try {
      const mapData = await getJson("/api/map-data");

      APP.mapData = mapData || {};
      window.MAP_DATA = APP.mapData;

      return APP.mapData;
    } catch (error) {
      console.error(error);

      APP.mapData = {
        nodes: [],
        cityNodes: [],
        routes: []
      };

      window.MAP_DATA = APP.mapData;

      return APP.mapData;
    }
  }

  async function refreshNow() {
    setStatus("refreshing");

    try {
      try {
        await postJson("/api/refresh");
      } catch (error) {
        console.warn("refresh endpoint failed, loading current state", error);
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
    } catch (error) {
      console.error(error);
      setStatus("refresh failed");
    }
  }

  function bindMenu() {
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
            `<div class="info-card"><h3>${escapeHtml(button.textContent || "Panel")}</h3><p>Panel renderer missing.</p></div>`,
            panel
          );
        }
      });
    });

    const refresh = $("#refresh");
    if (refresh) {
      refresh.addEventListener("click", refreshNow);
    }

    const home = $("#homeMapButton");
    if (home) {
      home.addEventListener("click", () => {
        if (window.MoneyMap && typeof window.MoneyMap.goHome === "function") {
          window.MoneyMap.goHome();
        }
      });
    }

    const globalRisk = $("#globalRiskButton");
    if (globalRisk) {
      globalRisk.addEventListener("click", () => {
        if (window.MoneyMap && typeof window.MoneyMap.showGlobalRiskIntro === "function") {
          window.MoneyMap.showGlobalRiskIntro();
        }
      });
    }

    const crisis = $("#weatherTrackerButton");
    if (crisis) {
      crisis.addEventListener("click", () => {
        if (window.MoneyMap && typeof window.MoneyMap.loadCrisis === "function") {
          window.MoneyMap.loadCrisis();
        }
      });
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
            `<div class="info-card">
              <h3>Searching</h3>
              <div class="loader-bar"><span></span></div>
              <p>${escapeHtml(q)}</p>
            </div>`,
            "search"
          );
        }

        try {
          const result = await getJson(`/api/search?q=${encodeURIComponent(q)}`);
          const first = result.places && result.places[0];

          if (first && window.MoneyMap && typeof window.MoneyMap.openContext === "function") {
            window.MoneyMap.openContext(Number(first.lat), Number(first.lng), 9);
          } else if (window.Panels && typeof window.Panels.setInfo === "function") {
            window.Panels.setInfo(
              "Search",
              `<div class="info-card"><h3>No result</h3><p>No matching place returned.</p></div>`,
              "search"
            );
          }
        } catch (error) {
          console.error(error);

          if (window.Panels && typeof window.Panels.setInfo === "function") {
            window.Panels.setInfo(
              "Search failed",
              `<div class="info-card"><h3>Search failed</h3><p>No result loaded.</p></div>`,
              "search"
            );
          }
        }
      });
    }

    document.addEventListener("click", (event) => {
      const close = event.target.closest("[data-close]");
      if (!close) return;

      const target = close.dataset.close;

      if (target === "info") {
        const panel = $("#infoPanel");
        if (panel) panel.classList.remove("open", "active");
      }

      if (target === "drawer") {
        const panel = $("#drawerPanel");
        if (panel) panel.classList.remove("open", "active");
      }
    });
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
            window.APP_STATE = APP.state;

            if (window.Renderers && typeof window.Renderers.renderMarkets === "function") {
              window.Renderers.renderMarkets(APP.state.markets || []);
            }

            if (window.MoneyMap && typeof window.MoneyMap.renderEvents === "function") {
              window.MoneyMap.renderEvents(APP.state.events || []);
            }
          }

          if (payload.type === "event" && payload.event) {
            if (!APP.state) APP.state = { events: [] };
            if (!Array.isArray(APP.state.events)) APP.state.events = [];

            APP.state.events.unshift(payload.event);
            APP.state.events = APP.state.events.slice(0, 700);
            window.APP_STATE = APP.state;

            if (window.MoneyMap && typeof window.MoneyMap.newEvent === "function") {
              window.MoneyMap.newEvent(payload.event);
            }
          }
        } catch (error) {
          console.warn("stream parse failed", error);
        }
      });
    } catch (error) {
      console.warn("stream unavailable", error);
    }
  }

  function installErrorBox() {
    window.addEventListener("error", (event) => {
      const map = $("#map");
      if (!map) return;

      const message = event.error && event.error.stack
        ? event.error.stack
        : event.message;

      map.innerHTML = `<pre class="boot-error">${escapeHtml(message)}</pre>`;
    });

    window.addEventListener("unhandledrejection", (event) => {
      const map = $("#map");
      if (!map) return;

      const message = event.reason && event.reason.stack
        ? event.reason.stack
        : String(event.reason || "Unhandled promise rejection");

      map.innerHTML = `<pre class="boot-error">${escapeHtml(message)}</pre>`;
    });
  }

  async function boot() {
    installErrorBox();
    bindMenu();

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
  }

  document.addEventListener("DOMContentLoaded", () => {
    boot().catch((error) => {
      console.error(error);
      setStatus("boot failed");

      const map = $("#map");
      if (map) {
        map.innerHTML = `<pre class="boot-error">${escapeHtml(error.stack || error.message || error)}</pre>`;
      }
    });
  });
})();
