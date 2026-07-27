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

    return "$" + Number(value).toLocaleString(undefined, {
      maximumFractionDigits: Number(value) < 10 ? 4 : 2
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

    if (panel) {
      panel.style.display = "";
      panel.classList.add("open");
      panel.classList.add("active");
    }

    if (titleEl) titleEl.textContent = title || "Info";
    if (body) body.innerHTML = html || "";
  }

  function setDrawer(title, html, type) {
    const drawer = document.getElementById("drawerPanel");
    const titleEl = document.getElementById("drawerTitle");
    const body = document.getElementById("drawerBody");

    if (drawer) {
      drawer.style.display = "";
      drawer.classList.add("open");
      drawer.classList.add("active");
    }

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
      return `English fallback: source-backed report near ${eventPlace(event)}. Open the original source for the full article.`;
    }

    return raw.slice(0, 300);
  }

  function renderMarkets(markets) {
    const ticker = document.getElementById("ticker");
    if (!ticker) return;

    const list = Array.isArray(markets) ? markets : [];

    ticker.innerHTML = list.length
      ? list.slice(0, 20).map((m) => {
          const move = Number(m.changePct || 0);
          const cls = move >= 0 ? "up" : "down";
          const name = m.id || m.symbol || "ASSET";

          return `
            <span>
              <b>${esc(name)}</b>
              ${money(m.price)}
              <span class="${cls}">${pct(move)}</span>
            </span>
          `;
        }).join("")
      : "<span>No market data</span>";
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

  function marketRows(list) {
    const rows = Array.isArray(list) ? list : [];

    return `
      <div class="market-table compact-market-table">
        ${
          rows.length
            ? rows.map((m) => {
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
            : `<div class="warn">No data</div>`
        }
      </div>
    `;
  }

  function renderEvent(event) {
    const original = isForeignText(event.title) ? event.title : event.originalTitle;

    setInfo(plainEventTitle(event), `
      <div class="info-card">
        <h3>${esc(plainEventTitle(event))}</h3>

        <div class="quick-list">
          <div class="quick-item">
            <b>Type:</b> ${esc(normalKind(event.kind))}
          </div>

          <div class="quick-item">
            <b>Place:</b> ${esc(eventPlace(event))}
          </div>

          <div class="quick-item">
            <b>What happened:</b> ${esc(plainSummary(event))}
          </div>

          <div class="quick-item yellow">
            <b>Check:</b> open the source, compare local news, then check market reaction.
          </div>
        </div>

        ${original ? `<p class="original-title"><b>Original title:</b> ${esc(original)}</p>` : ""}

        <p class="source-box">
          ${
            event.url
              ? `<a target="_blank" rel="noopener" href="${esc(event.url)}">${esc(event.source || "source")}</a>`
              : esc(event.source || "source")
          }
        </p>
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

      <div class="info-card">
        <h3>Image</h3>
        <p class="plain">Wikipedia image lookup will show here when the source returns one.</p>
      </div>
    `, "place");
  }

  function renderRoute(route) {
    setInfo(route.name || "Route", `
      <div class="info-card">
        <h3>${esc(route.name || "Route")}</h3>

        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(route.type || "route")}</div>
          <div class="quick-item"><b>Rank:</b> ${esc(route.rank || "major estimated lane")}</div>
          <div class="quick-item"><b>Direction:</b> ${esc(route.direction || "two-way")}</div>
          <div class="quick-item"><b>Goods:</b> ${esc(route.goods || "containers, oil, LNG, bulk goods")}</div>
          <div class="quick-item"><b>Used by:</b> ${esc(route.users || "shipping lines, freight forwarders, commodity traders")}</div>
          <div class="quick-item"><b>Chokepoints:</b> ${esc((route.chokepoints || []).join(", ") || "N/A")}</div>
          <div class="quick-item yellow"><b>Accuracy:</b> estimated major lane. Not metre-level AIS track.</div>
        </div>
      </div>
    `, "routes");
  }

  function renderSearch(result) {
    const places = result?.places || [];

    setInfo("Search", `
      <div class="info-card">
        <h3>Search results</h3>

        <div class="quick-list">
          ${
            places.length
              ? places.map((p) => `
                <button class="result-row" data-lat="${esc(p.lat)}" data-lng="${esc(p.lng)}">
                  <b>${esc(p.name || p.displayName || "Place")}</b>
                  <span>${esc(p.displayName || "")}</span>
                </button>
              `).join("")
              : `<div class="warn">No data</div>`
          }
        </div>
      </div>
    `, "search");

    document.querySelectorAll(".result-row").forEach((button) => {
      button.addEventListener("click", () => {
        if (window.MoneyMap?.openContext) {
          window.MoneyMap.openContext(button.dataset.lat, button.dataset.lng, 9);
        }
      });
    });
  }

  function openPanel(name) {
    const state = window.APP_STATE || {};
    const markets = state.markets || [];

    if (name === "crypto") {
      const crypto = markets.filter((m) =>
        /BTC|ETH|SOL|XRP|BNB|ADA|DOGE|AVAX|LINK/i.test(String(m.id || m.symbol || ""))
      );

      setDrawer("Crypto", `
        <div class="info-card">
          <h3>Crypto</h3>
          <p class="plain">Compact live crypto feed. No empty graph blocks.</p>
        </div>
        ${marketRows(crypto.length ? crypto : markets.slice(0, 12))}
      `, "crypto");
      return;
    }

    if (name === "commodities") {
      const commodities = markets.filter((m) =>
        /gold|silver|oil|brent|wti|copper|gas|gld|slv|commodity/i.test(`${m.id} ${m.name} ${m.source}`)
      );

      setDrawer("Commodities", `
        <div class="info-card">
          <h3>Commodities</h3>
          <p class="plain">Use this to check whether war, crisis or route disruption is moving prices.</p>
        </div>
        ${marketRows(commodities.length ? commodities : markets.slice(0, 12))}
      `, "commodities");
      return;
    }

    if (name === "brief") {
      const events = (state.events || []).slice(0, 10);

      setDrawer("Live Brief", `
        <div class="info-card">
          <h3>Live Brief</h3>
          <p class="plain">Priority events and market checks. This is a summary screen, not a trade command.</p>
        </div>

        <div class="info-card">
          <h3>Priority alerts</h3>
          <div class="quick-list">
            ${
              events.length
                ? events.map((e) => `
                  <div class="quick-item">
                    <b>${esc(normalKind(e.kind))}:</b> ${esc(plainEventTitle(e))}
                    <br><span class="source-line">${esc(e.source || "source")} | ${esc(eventPlace(e))}</span>
                  </div>
                `).join("")
                : `<div class="warn">No alerts loaded.</div>`
            }
          </div>
        </div>

        <div class="info-card">
          <h3>How to use</h3>
          <div class="quick-list">
            <div class="quick-item"><b>Step 1:</b> click the event or map area.</div>
            <div class="quick-item"><b>Step 2:</b> check commodities, crypto, routes and Polymarket.</div>
            <div class="quick-item"><b>Step 3:</b> act only if source, timing and market reaction agree.</div>
          </div>
        </div>
      `, "brief");
      return;
    }

    if (name === "predictions") {
      const predictions = state.predictions || [];

      setDrawer("Predictions", `
        <div class="info-card">
          <h3>Predictions</h3>
          <p class="plain">Ranks possible setups. It does not know the future and it is not a buy/sell order.</p>
        </div>

        ${
          predictions.length
            ? predictions.map((p) => `
              <div class="info-card">
                <h3>${esc(p.asset || p.id || "Asset")} - ${esc(p.direction || "N/A")}</h3>
                <div class="index-grid real-indexes">
                  ${scoreTile("Setup score", p.rating, "engine score", "price/events")}
                </div>
                <div class="quick-list">
                  <div class="quick-item"><b>Reason:</b> ${esc((p.reasons || []).join(" | ") || "No reason loaded")}</div>
                  <div class="quick-item yellow"><b>Use:</b> shortlist only. Verify with chart and source.</div>
                </div>
              </div>
            `).join("")
            : `<div class="warn">No data</div>`
        }
      `, "predictions");
      return;
    }

    if (name === "polymarket") {
      const rows = state.polymarket || state.predictionMarkets || [];

      setInfo("Polymarket", `
        <div class="info-card">
          <h3>Polymarket</h3>
          <p class="plain">Ranked by chance/activity. High chance does not automatically mean good value.</p>
        </div>

        ${
          rows.length
            ? rows.slice(0, 20).map((m, i) => {
              const probability = Number(m.probability ?? m.prob ?? m.price ?? NaN);
              const chance = Number.isFinite(probability)
                ? Math.round(probability <= 1 ? probability * 100 : probability)
                : null;

              return `
                <div class="info-card">
                  <h3>#${i + 1} ${esc(m.title || m.question || m.name || "Market")}</h3>
                  <div class="index-grid real-indexes">
                    ${scoreTile("Market chance", chance, chance === null ? "N/A" : `${chance}%`, "Polymarket")}
                  </div>
                  <div class="quick-list">
                    <div class="quick-item"><b>Money angle:</b> only interesting if fresh news says the market price is wrong.</div>
                    <div class="quick-item yellow"><b>Warning:</b> high chance can already be priced in.</div>
                  </div>
                  <p class="source-box">${m.url ? `<a target="_blank" rel="noopener" href="${esc(m.url)}">open market</a>` : "Polymarket source"}</p>
                </div>
              `;
            }).join("")
            : `<div class="warn">No Polymarket data loaded.</div>`
        }
      `, "polymarket");
      return;
    }

    if (name === "routes") {
      const routes = window.MoneyMap?.getTradeRoutes ? window.MoneyMap.getTradeRoutes() : (window.ROUTES || []);

      setInfo("Routes", `
        <div class="info-card">
          <h3>Routes</h3>
          <p class="plain">Toggle route layers and search routes. Exact AIS/metre-level routing is not available without a real AIS feed.</p>

          <div class="toggle-row">
            <label><input type="checkbox" id="seaToggle" ${window.SHOW_SEA ? "checked" : ""}> Sea route web</label>
            <label><input type="checkbox" id="landToggle" ${window.SHOW_LAND ? "checked" : ""}> Land route web</label>
          </div>

          <input id="routeSearch" class="route-search" placeholder="Search route, goods, chokepoint..." />
        </div>

        <div id="routeList" class="route-list">
          ${
            routes.map((r) => `
              <div class="info-card route-row">
                <h3>${esc(r.name || "Route")}</h3>
                <div class="quick-list">
                  <div class="quick-item"><b>Type:</b> ${esc(r.type || "route")}</div>
                  <div class="quick-item"><b>Goods:</b> ${esc(r.goods || "containers, oil, LNG, bulk goods")}</div>
                  <div class="quick-item"><b>Chokepoints:</b> ${esc((r.chokepoints || []).join(", ") || "N/A")}</div>
                </div>
                <button class="route-open" data-route-id="${esc(r.id)}">Open route card</button>
              </div>
            `).join("")
          }
        </div>
      `, "routes");

      const search = document.getElementById("routeSearch");
      if (search) {
        search.addEventListener("input", () => {
          const q = search.value.toLowerCase();
          document.querySelectorAll(".route-row").forEach((row) => {
            row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
          });
        });
      }

      document.querySelectorAll(".route-open").forEach((button) => {
        button.addEventListener("click", () => {
          const route = routes.find((r) => r.id === button.dataset.routeId);
          if (route) renderRoute(route);
        });
      });

      return;
    }

    if (name === "sources") {
      setDrawer("Sources", `
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
      `, "sources");
      return;
    }

    setDrawer("Panel", `
      <div class="info-card">
        <h3>${esc(name || "Panel")}</h3>
        <p class="plain">No renderer loaded for this panel.</p>
      </div>
    `, name);
  }

  return {
    renderMarkets,
    openPanel,
    renderSearch,
    plainEventTitle,
    renderNode,
    renderLocalPlace,
    renderEvent,
    renderRoute
  };
})();
