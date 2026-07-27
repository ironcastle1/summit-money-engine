window.Renderers = (() => {
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (match) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[match]));
  }

  function hasNum(value) {
    return Number.isFinite(Number(value));
  }

  function money(value) {
    if (!hasNum(value)) return "N/A";

    const n = Number(value);

    return "$" + n.toLocaleString(undefined, {
      maximumFractionDigits: n < 10 ? 4 : 2
    });
  }

  function pct(value) {
    if (!hasNum(value)) return "N/A";

    const n = Number(value);
    return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
  }

  function normalKind(kind) {
    if (["disaster", "weather", "earthquake", "quake"].includes(kind)) return "crisis";
    if (kind === "tech") return "ai";
    if (kind === "election") return "politics";
    return kind || "risk";
  }

  function setInfo(title, html, type) {
    const panel = document.getElementById("infoPanel");
    const titleEl = document.getElementById("infoTitle");
    const body = document.getElementById("infoBody");

    if (panel) panel.classList.add("open", "active");
    if (titleEl) titleEl.textContent = title || "Info";
    if (body) body.innerHTML = html || "";
  }

  function setDrawer(title, html, type) {
    const panel = document.getElementById("drawerPanel");
    const titleEl = document.getElementById("drawerTitle");
    const body = document.getElementById("drawerBody");

    if (panel) panel.classList.add("open", "active");
    if (titleEl) titleEl.textContent = title || "Detail";
    if (body) body.innerHTML = html || "";
  }

  function isForeignText(text) {
    const s = String(text || "");
    if (!s) return false;

    const nonAscii = (s.match(/[^\x00-\x7F]/g) || []).length;
    const hasForeignPunctuation = /[¿¡]/.test(s);
    const hasCyrillic = /[\u0400-\u04FF]/.test(s);
    const hasArabic = /[\u0600-\u06FF]/.test(s);
    const hasHan = /[\u4E00-\u9FFF]/.test(s);

    return hasForeignPunctuation || hasCyrillic || hasArabic || hasHan || nonAscii / Math.max(s.length, 1) > 0.08;
  }

  function eventPlace(event) {
    return event.place || event.city || event.country || event.sourceCountry || "mapped area";
  }

  function plainEventTitle(event) {
    const kind = normalKind(event.kind);

    const label = {
      war: "War",
      terror: "Terror",
      crisis: "Crisis",
      politics: "Politics",
      shipping: "Shipping",
      energy: "Energy",
      ai: "AI",
      commodity: "Commodity",
      finance: "Finance",
      city: "City",
      risk: "Risk"
    }[kind] || "Event";

    const raw = String(event.title || event.summary || "").trim();

    if (!raw || isForeignText(raw)) {
      return `${label} report near ${eventPlace(event)}`;
    }

    return raw.slice(0, 140);
  }

  function plainSummary(event) {
    const raw = String(event.summary || event.title || "").trim();

    if (!raw || isForeignText(raw)) {
      return `English fallback: source-backed report near ${eventPlace(event)}. Open the source for the original article.`;
    }

    return raw.slice(0, 320);
  }

  function sourceLink(item) {
    if (!item.url) return esc(item.source || "source");
    return `<a target="_blank" rel="noopener" href="${esc(item.url)}">${esc(item.source || "open source")}</a>`;
  }

  function renderMarkets(markets) {
    const ticker = document.getElementById("ticker");
    if (!ticker) return;

    const rows = Array.isArray(markets) ? markets : [];

    ticker.innerHTML = rows.length
      ? rows.slice(0, 18).map((m) => {
          const move = Number(m.changePct || 0);
          const cls = move >= 0 ? "up" : "down";
          const id = m.id || m.symbol || "ASSET";

          return `
            <span>
              <b>${esc(id)}</b>
              ${money(m.price)}
              <span class="${cls}">${pct(move)}</span>
            </span>
          `;
        }).join("")
      : "<span>No market data</span>";
  }

  function marketRows(rows) {
    const list = Array.isArray(rows) ? rows : [];

    return `
      <div class="market-table compact-market-table">
        ${
          list.length
            ? list.map((m) => {
                const move = Number(m.changePct || 0);
                const cls = move >= 0 ? "up" : "down";
                const id = m.id || m.symbol || "ASSET";

                return `
                  <div class="market-row">
                    <div class="sym">${esc(id)}</div>
                    <div>
                      <div class="name">${esc(m.name || id)}</div>
                      <div class="sub">${esc(m.source || "market feed")}</div>
                    </div>
                    <div class="price">
                      <b>${money(m.price)}</b><br>
                      <span class="${cls}">${pct(move)}</span>
                    </div>
                  </div>
                `;
              }).join("")
            : `<div class="warn">No data loaded.</div>`
        }
      </div>
    `;
  }

  function scoreTile(label, value, tag, source) {
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
        <div class="label">${esc(label)}</div>
        <div class="num">${missing ? "N/A" : Math.round(n)}</div>
        <div class="tag">${esc(tag || (missing ? "No data" : "Measured"))}</div>
        <div class="mini-source">${esc(source || "")}</div>
      </div>
    `;
  }

  function renderEvent(event) {
    const title = plainEventTitle(event);
    const original = isForeignText(event.title) ? event.title : event.originalTitle;

    setInfo(title, `
      <div class="info-card">
        <h3>${esc(title)}</h3>

        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(normalKind(event.kind))}</div>
          <div class="quick-item"><b>Place:</b> ${esc(eventPlace(event))}</div>
          <div class="quick-item"><b>What happened:</b> ${esc(plainSummary(event))}</div>
          <div class="quick-item yellow"><b>Use:</b> open the source, check local reports, then check market reaction.</div>
        </div>

        ${original ? `<p class="original-title"><b>Original title:</b> ${esc(original)}</p>` : ""}

        <p class="source-box">${sourceLink(event)}</p>
      </div>
    `, normalKind(event.kind));
  }

  function renderNode(node) {
    setInfo(node.name || "Map point", `
      <div class="info-card">
        <h3>${esc(node.name || "Map point")}</h3>

        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(normalKind(node.kind))}</div>
          <div class="quick-item"><b>Source:</b> ${esc(node.source || "mapped point")}</div>
          <div class="quick-item"><b>Watch:</b> ${esc((node.watch || []).join(", ") || "N/A")}</div>
        </div>
      </div>
    `, "node");
  }

  function renderLocalPlace(place) {
    const title = place.name || place.title || "Place";
    const wikiId = `wiki-${String(place.id || title).replace(/[^a-z0-9]/gi, "-")}`;

    setInfo(title, `
      <div class="info-card">
        <h3>${esc(title)}</h3>

        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(place.tags?.place || place.tags?.amenity || place.kind || "local place")}</div>
          <div class="quick-item"><b>Latitude:</b> ${esc(place.lat || "N/A")}</div>
          <div class="quick-item"><b>Longitude:</b> ${esc(place.lng || "N/A")}</div>
          <div class="quick-item"><b>Source:</b> ${esc(place.source || "OpenStreetMap")}</div>
          ${place.tags?.population ? `<div class="quick-item"><b>Population:</b> ${esc(place.tags.population)}</div>` : ""}
        </div>
      </div>

      <div id="${esc(wikiId)}" class="info-card">
        <h3>Place image</h3>
        <div class="loader-bar"><span></span></div>
        <p class="plain">Checking Wikipedia. If no source image exists, no fake image is shown.</p>
      </div>
    `, "place");

    loadWiki(wikiId, title, place.tags?.wikidata);
  }

  function loadWiki(targetId, title, wikidata) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const params = new URLSearchParams();
    params.set("name", title || "");
    if (wikidata) params.set("wikidata", wikidata);

    fetch(`/api/wiki/place?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data || !data.found) {
          target.innerHTML = `
            <h3>Place image</h3>
            <p class="plain">No Wikipedia image found for this place. No stock image inserted.</p>
          `;
          return;
        }

        target.innerHTML = `
          <h3>${esc(data.title || title)}</h3>
          ${data.thumbnail ? `<img class="wiki-img" src="${esc(data.thumbnail)}" alt="${esc(data.title || title)}">` : ""}
          <p class="plain">${esc(String(data.extract || "").slice(0, 360) || "No summary returned.")}</p>
          <p class="source-box">${data.url ? `<a target="_blank" rel="noopener" href="${esc(data.url)}">Wikipedia source</a>` : "Wikipedia"}</p>
        `;
      })
      .catch(() => {
        target.innerHTML = `
          <h3>Place image</h3>
          <p class="plain">Wikipedia lookup failed.</p>
        `;
      });
  }

  function renderLiveBrief() {
    const state = window.APP_STATE || {};
    const events = (state.events || []).slice(0, 12);

    setDrawer("Live Brief", `
      <div class="info-card">
        <h3>Live Brief</h3>
        <p class="plain">Fast summary of important map events. Non-English headlines are replaced with a plain English fallback.</p>
      </div>

      <div class="info-card">
        <h3>Priority alerts</h3>
        <div class="quick-list">
          ${
            events.length
              ? events.map((event) => `
                <div class="quick-item ${esc(normalKind(event.kind))}">
                  <b>${esc(normalKind(event.kind))}:</b> ${esc(plainEventTitle(event))}
                  <br><span class="source-line">${esc(event.source || "source")} | ${esc(eventPlace(event))}</span>
                </div>
              `).join("")
              : `<div class="warn">No live events loaded.</div>`
          }
        </div>
      </div>

      <div class="info-card">
        <h3>How to use</h3>
        <div class="quick-list">
          <div class="quick-item"><b>1.</b> Click the event or the affected area on the map.</div>
          <div class="quick-item"><b>2.</b> Check whether crypto or commodities moved after the event.</div>
          <div class="quick-item"><b>3.</b> Ignore events with no market reaction unless you are using it for safety.</div>
          <div class="quick-item yellow"><b>Rule:</b> this is not a trade command.</div>
        </div>
      </div>
    `, "brief");
  }

  function renderPredictions() {
    const state = window.APP_STATE || {};
    const predictions = state.predictions || [];

    setDrawer("Predictions", `
      <div class="info-card">
        <h3>Predictions</h3>
        <p class="plain">This panel ranks possible market setups. It does not guarantee price movement.</p>

        <div class="quick-list">
          <div class="quick-item"><b>Score 75-100:</b> strong setup, check chart and source quickly.</div>
          <div class="quick-item"><b>Score 55-74:</b> mixed setup, needs confirmation.</div>
          <div class="quick-item"><b>Score below 55:</b> weak setup, usually ignore.</div>
          <div class="quick-item"><b>Direction:</b> current lean from price/events, not a certainty.</div>
          <div class="quick-item yellow"><b>Use:</b> shortlist only. Do not buy or sell from this panel alone.</div>
        </div>
      </div>

      ${
        predictions.length
          ? predictions.map((p) => `
            <div class="info-card">
              <h3>${esc(p.asset || p.id || "Asset")} - ${esc(p.direction || "N/A")}</h3>

              <div class="index-grid real-indexes">
                ${scoreTile("Setup score", p.rating, "current strength", "price + event feed")}
              </div>

              <div class="quick-list">
                <div class="quick-item"><b>Reason:</b> ${esc((p.reasons || []).join(" | ") || "No reason loaded")}</div>
                <div class="quick-item"><b>What to check:</b> chart direction, latest source, related live map events.</div>
                <div class="quick-item yellow"><b>Warning:</b> no guaranteed rise/fall percentage.</div>
              </div>
            </div>
          `).join("")
          : `<div class="warn">No prediction data loaded.</div>`
      }
    `, "predictions");
  }

  function renderCrypto() {
    const state = window.APP_STATE || {};
    const markets = state.markets || [];

    const crypto = markets.filter((m) =>
      /BTC|ETH|SOL|XRP|BNB|ADA|DOGE|AVAX|LINK|MATIC|DOT/i.test(String(m.id || m.symbol || ""))
    );

    setDrawer("Crypto", `
      <div class="info-card">
        <h3>Crypto</h3>
        <p class="plain">Live price table. Use it to check whether map events are moving crypto now.</p>
      </div>

      ${marketRows(crypto.length ? crypto : markets.slice(0, 12))}
    `, "crypto");
  }

  function renderCommodities() {
    const state = window.APP_STATE || {};
    const markets = state.markets || [];

    const commodities = markets.filter((m) =>
      /gold|silver|oil|brent|wti|copper|gas|gld|slv|commodity/i.test(`${m.id || ""} ${m.name || ""} ${m.source || ""}`)
    );

    setDrawer("Commodities", `
      <div class="info-card">
        <h3>Commodities</h3>
        <p class="plain">Use this to check whether war, crisis or shipping disruption is moving commodities.</p>
      </div>

      ${marketRows(commodities.length ? commodities : markets.slice(0, 12))}
    `, "commodities");
  }

  function renderRapid() {
    const state = window.APP_STATE || {};
    const rapid = state.rapid || [];

    setDrawer("Rapid Movers", `
      <div class="info-card">
        <h3>Rapid Movers</h3>
        <p class="plain">Assets moving quickly now. Empty means the backend has not loaded usable rapid-move data.</p>
      </div>

      ${
        rapid.length
          ? rapid.map((item) => `
            <div class="info-card">
              <h3>${esc(item.asset || item.id || "Asset")}</h3>

              <div class="quick-list">
                <div class="quick-item"><b>Direction:</b> ${esc(item.direction || "N/A")}</div>
                <div class="quick-item"><b>Move:</b> ${esc(item.move || item.shortMove || item.windowMove || "N/A")}</div>
                <div class="quick-item"><b>Reason:</b> ${esc((item.reasons || []).join(" | ") || "No reason loaded")}</div>
                <div class="quick-item yellow"><b>Use:</b> check if the move already happened. Do not chase blindly.</div>
              </div>
            </div>
          `).join("")
          : `<div class="warn">No rapid movers loaded. No fake movers shown.</div>`
      }
    `, "rapid");
  }

  function renderSources() {
    setDrawer("Sources", `
      <div class="info-card">
        <h3>Sources</h3>

        <div class="quick-list">
          <div class="quick-item"><b>Global events:</b> GDELT</div>
          <div class="quick-item"><b>Disasters:</b> GDACS</div>
          <div class="quick-item"><b>Earthquakes:</b> USGS</div>
          <div class="quick-item"><b>Macro indicators:</b> World Bank</div>
          <div class="quick-item"><b>Places:</b> OpenStreetMap / Nominatim</div>
          <div class="quick-item"><b>Weather:</b> Open-Meteo</div>
          <div class="quick-item"><b>Place images:</b> Wikipedia / Wikimedia where available</div>
          <div class="quick-item yellow"><b>Missing data:</b> shown as missing. Not replaced with fake numbers.</div>
        </div>
      </div>
    `, "sources");
  }

  function openPanel(name) {
    if (name === "brief") return renderLiveBrief();
    if (name === "predictions") return renderPredictions();
    if (name === "crypto") return renderCrypto();
    if (name === "commodities") return renderCommodities();
    if (name === "rapid") return renderRapid();
    if (name === "sources") return renderSources();

    if (name === "layers") {
      setInfo("Safety Map", `
        <div class="info-card">
          <h3>Safety Map</h3>
          <p class="plain">Country colours show broad current risk. Click a town or country for detailed local information.</p>

          <div class="quick-list">
            <div class="quick-item red"><b>Red:</b> active conflict or severe instability signal.</div>
            <div class="quick-item orange"><b>Orange:</b> high-risk watch area.</div>
            <div class="quick-item"><b>Green/blue:</b> lower current mapped risk.</div>
            <div class="quick-item yellow"><b>Warning:</b> this is not an exact frontline map.</div>
          </div>
        </div>
      `, "layers");
      return;
    }

    setDrawer("Panel", `
      <div class="info-card">
        <h3>${esc(name || "Panel")}</h3>
        <p class="plain">Panel not configured.</p>
      </div>
    `, name);
  }

  return {
    renderMarkets,
    openPanel,
    renderNode,
    renderLocalPlace,
    renderEvent,
    plainEventTitle
  };
})();
