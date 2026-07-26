(function () {
  const STATE = {
    map: null,
    crimeMode: false,
    wikiCache: new Map()
  };

  function boot() {
    injectCss();

    const map = findMap();

    if (!map) {
      setTimeout(boot, 1000);
      return;
    }

    STATE.map = map;

    wireCrimeTracker();
    wireCrimeMapClick();
    startWikiImageEnrichment();
    removeBadOverlayIfLoaded();
  }

  function findMap() {
    if (window.map && isLeafletMap(window.map)) {
      return window.map;
    }

    for (const key of Object.keys(window)) {
      const value = window[key];

      if (isLeafletMap(value)) {
        return value;
      }
    }

    return null;
  }

  function isLeafletMap(value) {
    return (
      value &&
      typeof value.on === "function" &&
      typeof value.addLayer === "function" &&
      typeof value.removeLayer === "function" &&
      typeof value.setView === "function"
    );
  }

  function injectCss() {
    if (document.getElementById("crimeWikiPatchCss")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "crimeWikiPatchCss";

    style.textContent = `
      #crimeTrackerButton.active-crime {
        background: #ff8a00 !important;
        color: #00111f !important;
        border-color: #ff8a00 !important;
        box-shadow: 0 0 12px rgba(255, 138, 0, 0.55);
      }

      .crime-tracker-panel {
        position: fixed;
        right: 14px;
        top: 198px;
        width: 390px;
        max-width: calc(100vw - 28px);
        max-height: calc(100vh - 230px);
        overflow: auto;
        z-index: 9999;
        background: rgba(0, 17, 31, 0.97);
        border: 1px solid #00d8ff;
        color: #e8fbff;
        box-shadow: 0 0 22px rgba(0, 216, 255, 0.32);
        font-family: Inter, Arial, sans-serif;
      }

      .crime-tracker-panel header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(0, 39, 63, 0.98);
        border-bottom: 1px solid #00d8ff;
        padding: 10px 12px;
      }

      .crime-tracker-panel h2 {
        margin: 0;
        color: #00eaff;
        font-size: 20px;
        letter-spacing: 1px;
      }

      .crime-tracker-panel h3 {
        margin: 14px 0 8px;
        color: #00eaff;
        font-size: 15px;
      }

      .crime-tracker-panel button {
        background: #002842;
        border: 1px solid #00d8ff;
        color: #e8fbff;
        cursor: pointer;
        padding: 3px 8px;
        font-size: 18px;
      }

      .crime-tracker-body {
        padding: 12px;
      }

      .crime-big {
        font-size: 48px;
        line-height: 1;
        font-weight: 900;
        color: #ff8a00;
        margin: 8px 0;
      }

      .crime-muted {
        color: #95b9c8;
        font-size: 12px;
      }

      .crime-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        border-bottom: 1px solid rgba(0, 216, 255, 0.18);
        padding: 8px 0;
        font-size: 13px;
      }

      .crime-warning {
        border-left: 4px solid #ff8a00;
        background: rgba(255, 138, 0, 0.09);
        padding: 10px;
        margin: 10px 0;
        font-size: 13px;
        line-height: 1.35;
      }

      .crime-good {
        border-left: 4px solid #00ff91;
        background: rgba(0, 255, 145, 0.08);
        padding: 10px;
        margin: 10px 0;
        font-size: 13px;
        line-height: 1.35;
      }

      .crime-click-hint {
        position: fixed;
        left: 50%;
        bottom: 48px;
        transform: translateX(-50%);
        z-index: 9999;
        background: rgba(0, 17, 31, 0.97);
        border: 1px solid #ff8a00;
        color: #ffffff;
        padding: 9px 14px;
        font-size: 13px;
        box-shadow: 0 0 16px rgba(255, 138, 0, 0.35);
      }

      .wiki-place-card {
        border: 1px solid rgba(0, 216, 255, 0.35);
        background: rgba(0, 28, 46, 0.85);
        padding: 10px;
        margin: 10px 0;
      }

      .wiki-place-card img {
        width: 100%;
        max-height: 175px;
        object-fit: cover;
        border: 1px solid rgba(0, 216, 255, 0.45);
        margin-bottom: 9px;
      }

      .wiki-place-card h3 {
        margin: 0 0 8px;
        color: #00eaff;
      }

      .wiki-place-card p {
        margin: 0 0 8px;
        font-size: 13px;
        line-height: 1.35;
      }

      .wiki-place-card a {
        color: #00eaff;
      }
    `;

    document.head.appendChild(style);
  }

  function removeBadOverlayIfLoaded() {
    /*
      This deliberately does NOT draw extra country outlines.
      The previous patch made the map worse because it put a second
      Natural Earth border layer on top of the base map.
    */
    const badPanels = document.querySelectorAll("#smeLivePatchPanel, #smeCrimePanel");

    badPanels.forEach(function (panel) {
      panel.remove();
    });
  }

  function wireCrimeTracker() {
    const btn = document.getElementById("crimeTrackerButton");

    if (!btn) {
      return;
    }

    btn.addEventListener("click", function () {
      STATE.crimeMode = !STATE.crimeMode;
      btn.classList.toggle("active-crime", STATE.crimeMode);

      if (STATE.crimeMode) {
        showCrimePanel(
          "Crime Tracker",
          `
            <div class="crime-warning">
              Click the map. UK clicks use official Police.uk street-crime data.
              Outside connected areas, this shows N/A instead of fake numbers.
            </div>

            <div class="crime-row">
              <strong>Local crime feed</strong>
              <span>UK only</span>
            </div>

            <div class="crime-row">
              <strong>Fake scores</strong>
              <span>Blocked</span>
            </div>
          `
        );

        showHint("Crime Tracker on: click the map");
      } else {
        showHint("Crime Tracker off");
      }
    });
  }

  function wireCrimeMapClick() {
    if (!STATE.map) {
      return;
    }

    STATE.map.on("click", async function (event) {
      if (!STATE.crimeMode) {
        return;
      }

      const lat = event.latlng.lat;
      const lng = event.latlng.lng;

      await loadCrimeAtPoint(lat, lng);
    });
  }

  async function loadCrimeAtPoint(lat, lng) {
    showCrimePanel(
      "Crime Tracker",
      `
        <div class="crime-warning">
          Checking official local crime feed for ${lat.toFixed(4)}, ${lng.toFixed(4)}...
        </div>
      `
    );

    try {
      const response = await fetch(`/api/crime/point?lat=${lat}&lng=${lng}`);
      const data = await response.json();

      renderCrimeData(data);
    } catch (err) {
      showCrimePanel(
        "Crime Tracker",
        `
          <div class="crime-big">N/A</div>
          <div class="crime-warning">
            Crime source failed. Do not use a fake number.
          </div>
        `
      );
    }
  }

  function renderCrimeData(data) {
    if (!data || !data.localCrimeAvailable) {
      showCrimePanel(
        "Crime Tracker",
        `
          <div class="crime-muted">Official local crime count</div>
          <div class="crime-big">N/A</div>

          <div class="crime-warning">
            No official local crime feed is connected for this point.
            The app must not invent a crime score here.
          </div>

          <div class="crime-row">
            <strong>Source</strong>
            <span>N/A</span>
          </div>

          <div class="crime-row">
            <strong>Status</strong>
            <span>No local feed</span>
          </div>
        `
      );

      return;
    }

    const categories = (data.categories || [])
      .slice(0, 10)
      .map(function (item) {
        return `
          <div class="crime-row">
            <span>${escapeHtml(prettyCrimeCategory(item.category))}</span>
            <strong>${escapeHtml(item.count)}</strong>
          </div>
        `;
      })
      .join("");

    showCrimePanel(
      "Crime Tracker",
      `
        <div class="crime-muted">Official UK street-crime count near clicked point</div>
        <div class="crime-big">${escapeHtml(data.total)}</div>

        <div class="crime-row">
          <strong>Month</strong>
          <span>${escapeHtml(data.date || "N/A")}</span>
        </div>

        <div class="crime-row">
          <strong>Source</strong>
          <span>${escapeHtml(data.source || "N/A")}</span>
        </div>

        <div class="crime-row">
          <strong>Coverage</strong>
          <span>England, Wales, Northern Ireland</span>
        </div>

        <div class="crime-warning">
          Police.uk uses approximate street-level locations, not exact addresses.
        </div>

        <h3>Categories</h3>
        ${
          categories ||
          `<div class="crime-muted">No crimes returned for this point and month.</div>`
        }
      `
    );
  }

  function showCrimePanel(title, html) {
    let panel = document.getElementById("crimeTrackerPanel");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "crimeTrackerPanel";
      panel.className = "crime-tracker-panel";
      document.body.appendChild(panel);
    }

    panel.innerHTML = `
      <header>
        <h2>${escapeHtml(title)}</h2>
        <button id="crimeTrackerClose">×</button>
      </header>
      <div class="crime-tracker-body">${html}</div>
    `;

    const close = document.getElementById("crimeTrackerClose");

    if (close) {
      close.addEventListener("click", function () {
        panel.remove();
      });
    }
  }

  function showHint(text) {
    let hint = document.getElementById("crimeClickHint");

    if (!hint) {
      hint = document.createElement("div");
      hint.id = "crimeClickHint";
      hint.className = "crime-click-hint";
      document.body.appendChild(hint);
    }

    hint.textContent = text;

    clearTimeout(hint.timer);

    hint.timer = setTimeout(function () {
      hint.remove();
    }, 3500);
  }

  function startWikiImageEnrichment() {
    const observer = new MutationObserver(function () {
      enrichVisiblePlaceCards();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setInterval(enrichVisiblePlaceCards, 2500);

    enrichVisiblePlaceCards();
  }

  async function enrichVisiblePlaceCards() {
    const candidates = Array.from(
      document.querySelectorAll(
        "[data-place-name], .place-card, .city-card, .town-card, .leaflet-popup-content, #infoBody, #drawerBody"
      )
    );

    for (const el of candidates) {
      if (!el || el.dataset.wikiDone === "1") {
        continue;
      }

      const name = extractPlaceName(el);

      if (!name) {
        continue;
      }

      el.dataset.wikiDone = "1";

      try {
        const data = await getWikiPlace(name);

        if (!data || !data.found || !data.thumbnail) {
          continue;
        }

        const card = document.createElement("div");
        card.className = "wiki-place-card";

        card.innerHTML = `
          <img src="${escapeAttr(data.thumbnail)}" alt="${escapeAttr(data.title)}">
          <h3>${escapeHtml(data.title)}</h3>
          <p>${escapeHtml(shortText(data.extract || "", 230))}</p>
          ${
            data.url
              ? `<a href="${escapeAttr(data.url)}" target="_blank" rel="noopener">Wikipedia source</a>`
              : ""
          }
        `;

        el.insertBefore(card, el.firstChild);
      } catch (err) {
        /*
          Missing image is not fatal.
        */
      }
    }
  }

  function extractPlaceName(el) {
    const explicit = el.getAttribute("data-place-name");

    const heading =
      explicit ||
      el.querySelector("h1,h2,h3,strong")?.textContent ||
      "";

    const text = String(heading)
      .replace(/Clicked area:/gi, "")
      .replace(/Country:/gi, "")
      .replace(/Crime Tracker/gi, "")
      .replace(/Official local crime count/gi, "")
      .replace(/N\/A/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .split(",")[0]
      .trim();

    if (!text) return null;
    if (text.length < 3) return null;
    if (text.length > 80) return null;
    if (/^\d+$/.test(text)) return null;
    if (/source|status|coverage|month|categories|loading|official/i.test(text)) return null;

    return text;
  }

  async function getWikiPlace(name) {
    const key = name.toLowerCase();

    if (STATE.wikiCache.has(key)) {
      return STATE.wikiCache.get(key);
    }

    const response = await fetch(`/api/wiki/place?name=${encodeURIComponent(name)}`);
    const data = await response.json();

    STATE.wikiCache.set(key, data);

    return data;
  }

  function prettyCrimeCategory(category) {
    return String(category || "unknown")
      .replace(/-/g, " ")
      .replace(/\b\w/g, function (match) {
        return match.toUpperCase();
      });
  }

  function shortText(text, max) {
    const value = String(text || "").trim();

    if (value.length <= max) {
      return value;
    }

    return value.slice(0, max - 1).trim() + "…";
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("`", "&#096;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
