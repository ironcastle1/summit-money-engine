window.Renderers = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));

  const hasNum = (n) => Number.isFinite(Number(n));

  const money = (n) =>
    hasNum(n)
      ? "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: Number(n) < 10 ? 4 : 2 })
      : "N/A";

  const pct = (n) =>
    hasNum(n)
      ? `${Number(n) >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`
      : "N/A";

  const kindLabel = {
    war: "War",
    terror: "Terror",
    disaster: "Crisis",
    weather: "Crisis",
    earthquake: "Crisis",
    quake: "Crisis",
    crisis: "Crisis",
    election: "Politics",
    politics: "Politics",
    shipping: "Shipping",
    energy: "Energy",
    ai: "AI",
    tech: "AI",
    commodity: "Commodity",
    finance: "Finance",
    city: "City",
    risk: "Risk"
  };

  const TEXT = {
    en: {
      liveBrief: "Live Brief",
      predictions: "Predictions",
      crypto: "Crypto",
      commodities: "Commodities",
      polymarket: "Polymarket",
      routes: "Routes",
      rapid: "Rapid Movers",
      safety: "Safety Map",
      sources: "Sources",
      use: "How to use this",
      check: "Check before acting",
      noData: "No data",
      notAdvice: "This is not a buy/sell instruction.",
      noFake: "Missing data is shown as missing. No fake figures."
    },
    es: {
      liveBrief: "Resumen en vivo",
      predictions: "Predicciones",
      crypto: "Cripto",
      commodities: "Materias primas",
      polymarket: "Polymarket",
      routes: "Rutas",
      rapid: "Movimientos rápidos",
      safety: "Mapa de seguridad",
      sources: "Fuentes",
      use: "Cómo usar esto",
      check: "Verifica antes de actuar",
      noData: "Sin datos",
      notAdvice: "Esto no es una orden de compra/venta.",
      noFake: "Los datos faltantes se muestran como faltantes."
    },
    fr: {
      liveBrief: "Brief en direct",
      predictions: "Prédictions",
      crypto: "Crypto",
      commodities: "Matières premières",
      polymarket: "Polymarket",
      routes: "Routes",
      rapid: "Mouvements rapides",
      safety: "Carte sécurité",
      sources: "Sources",
      use: "Comment utiliser",
      check: "Vérifier avant d'agir",
      noData: "Aucune donnée",
      notAdvice: "Ce n'est pas un ordre d'achat/vente.",
      noFake: "Les données manquantes sont indiquées comme manquantes."
    },
    de: {
      liveBrief: "Live-Überblick",
      predictions: "Prognosen",
      crypto: "Krypto",
      commodities: "Rohstoffe",
      polymarket: "Polymarket",
      routes: "Routen",
      rapid: "Schnelle Bewegungen",
      safety: "Sicherheitskarte",
      sources: "Quellen",
      use: "So nutzt du es",
      check: "Vor dem Handeln prüfen",
      noData: "Keine Daten",
      notAdvice: "Dies ist keine Kauf-/Verkaufsanweisung.",
      noFake: "Fehlende Daten werden als fehlend angezeigt."
    },
    ar: {
      liveBrief: "ملخص مباشر",
      predictions: "توقعات",
      crypto: "العملات الرقمية",
      commodities: "السلع",
      polymarket: "Polymarket",
      routes: "المسارات",
      rapid: "حركات سريعة",
      safety: "خريطة الأمان",
      sources: "المصادر",
      use: "طريقة الاستخدام",
      check: "تحقق قبل التصرف",
      noData: "لا توجد بيانات",
      notAdvice: "هذا ليس أمر شراء أو بيع.",
      noFake: "البيانات غير المتوفرة تظهر كذلك."
    }
  };

  function lang() {
    return window.SME_LANG || localStorage.getItem("sme-language") || "en";
  }

  function t(key) {
    return TEXT[lang()]?.[key] || TEXT.en[key] || key;
  }

  function normalKind(kind) {
    if (["disaster", "weather", "earthquake", "quake"].includes(kind)) return "crisis";
    if (kind === "tech") return "ai";
    if (kind === "election") return "politics";
    return kind || "risk";
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

  function eventPlace(e) {
    return e.place || e.city || e.country || e.sourceCountry || "mapped area";
  }

  function plainEventTitle(e) {
    const kind = kindLabel[normalKind(e.kind)] || "Event";
    const place = eventPlace(e);
    const raw = String(e.title || e.summary || "").trim();

    if (!raw || isForeignText(raw)) return `${kind} report near ${place}`;
    return raw.slice(0, 135);
  }

  function plainSummary(e) {
    const kind = kindLabel[normalKind(e.kind)] || "Event";
    const place = eventPlace(e);
    const raw = String(e.summary || e.title || "").trim();

    if (!raw || isForeignText(raw)) {
      return `English fallback: ${kind} report near ${place}. Open the source to inspect the original article.`;
    }

    return raw.slice(0, 280);
  }

  function sourceLink(e) {
    const url = e.url || e.link || "";
    const source = e.source || e.domain || "source";
    if (!url) return esc(source);
    return `<a target="_blank" rel="noopener" href="${esc(url)}">${esc(source)}</a>`;
  }

  function setInfo(title, html, type) {
    if (window.Panels?.setInfo) {
      window.Panels.setInfo(title, html, type);
      return;
    }

    const panel = document.getElementById("infoPanel");
    const titleEl = document.getElementById("infoTitle");
    const body = document.getElementById("infoBody");

    if (panel) {
      panel.style.display = "";
      panel.classList.add("open");
    }

    if (titleEl) titleEl.textContent = title;
    if (body) body.innerHTML = html;
  }

  function setDrawer(title, html, type) {
    if (window.Panels?.setDrawer) {
      window.Panels.setDrawer(title, html, type);
      return;
    }

    const drawer = document.getElementById("drawerPanel");
    const titleEl = document.getElementById("drawerTitle");
    const body = document.getElementById("drawerBody");

    if (drawer) {
      drawer.style.display = "";
      drawer.classList.add("open");
    }

    if (titleEl) titleEl.textContent = title;
    if (body) body.innerHTML = html;
  }

  function renderMarkets(markets) {
    const el = document.getElementById("ticker");
    if (!el) return;

    el.innerHTML =
      (markets || [])
        .slice(0, 22)
        .map((m) => {
          const move = hasNum(m.changePct) ? Number(m.changePct) : 0;
          const cls = move >= 0 ? "up" : "down";
          return `<span><b>${esc(m.id || m.symbol || "ASSET")}</b> ${money(m.price)} <span class="${cls}">${pct(move)}</span></span>`;
        })
        .join("") || "<span>No market data</span>";
  }

  function scoreClass(value) {
    if (value === null || value === undefined || value === "N/A") return "grey";
    const v = Number(value);
    if (v >= 75) return "green";
    if (v >= 55) return "yellow";
    if (v >= 35) return "orange";
    return "red";
  }

  function scoreTile(label, value, tag, source) {
    const missing = value === null || value === undefined || Number.isNaN(Number(value));
    const v = missing ? "N/A" : Math.round(Number(value));

    return `
      <div class="index-tile ${scoreClass(value)}">
        <div class="label">${esc(label)}</div>
        <div class="num">${esc(v)}</div>
        <div class="tag">${esc(tag || (missing ? "No data" : "Measured"))}</div>
        <div class="mini-source">${esc(source || "")}</div>
      </div>
    `;
  }

  function eventCard(e) {
    const kind = normalKind(e.kind);
    const original = isForeignText(e.title) ? e.title : e.originalTitle;

    return `
      <div class="info-card">
        <h3>${esc(plainEventTitle(e))}</h3>
        <div class="quick-list">
          <div class="quick-item ${kind}">
            <b>Type:</b> ${esc(kindLabel[kind] || kind)} | <b>Place:</b> ${esc(eventPlace(e))}
          </div>
          <div class="quick-item">
            <b>What happened:</b> ${esc(plainSummary(e))}
          </div>
          <div class="quick-item yellow">
            <b>${t("check")}:</b> open the source, check local reports, then check price reaction.
          </div>
        </div>
        ${original ? `<p class="original-title"><b>Original title:</b> ${esc(original)}</p>` : ""}
        <p class="source-box">${sourceLink(e)}</p>
      </div>
    `;
  }

  function renderEvent(e) {
    setInfo(plainEventTitle(e), eventCard(e), normalKind(e.kind));
  }

  function marketRows(list) {
    return `
      <div class="market-table compact-market-table">
        ${(list || [])
          .map((m) => {
            const move = Number(m.changePct || 0);
            const cls = move >= 0 ? "up" : "down";
            const id = m.id || m.symbol || "ASSET";
            const chart = marketChartUrl(id);

            return `
              <div class="market-row">
                <div class="sym">${esc(id)}</div>
                <div>
                  <div class="name">${esc(m.name || id)}</div>
                  <div class="sub">${esc(m.source || "market feed")} | ${esc(m.status || "live/delayed")}</div>
                </div>
                <div class="price">
                  <b>${money(m.price)}</b><br>
                  <span class="${cls}">${pct(move)}</span><br>
                  <a target="_blank" rel="noopener" href="${esc(chart)}">chart</a>
                </div>
              </div>
            `;
          })
          .join("") || `<div class="warn">${t("noData")}</div>`}
      </div>
    `;
  }

  function marketChartUrl(id) {
    const key = String(id || "").toUpperCase();

    const map = {
      BTC: "https://www.tradingview.com/symbols/BTCUSDT/",
      ETH: "https://www.tradingview.com/symbols/ETHUSDT/",
      SOL: "https://www.tradingview.com/symbols/SOLUSDT/",
      XRP: "https://www.tradingview.com/symbols/XRPUSDT/",
      BNB: "https://www.tradingview.com/symbols/BNBUSDT/",
      ADA: "https://www.tradingview.com/symbols/ADAUSDT/",
      GOLD: "https://www.tradingview.com/symbols/TVC-GOLD/",
      GLD: "https://www.tradingview.com/symbols/AMEX-GLD/",
      SILVER: "https://www.tradingview.com/symbols/TVC-SILVER/",
      SLV: "https://www.tradingview.com/symbols/AMEX-SLV/",
      COPPER: "https://www.tradingview.com/symbols/COMEX-HG1!/",
      BRENT: "https://www.tradingview.com/symbols/TVC-UKOIL/",
      WTI: "https://www.tradingview.com/symbols/TVC-USOIL/"
    };

    return map[key] || `https://www.tradingview.com/search/?query=${encodeURIComponent(key)}`;
  }

  function openPanel(name) {
    const state = window.APP_STATE || {};
    const markets = state.markets || [];

    if (name === "brief") return renderLiveBrief();
    if (name === "predictions") return renderPredictions();
    if (name === "polymarket") return renderPolymarket();
    if (name === "routes") return renderRoutesPanel();
    if (name === "sources") return renderSources();
    if (name === "rapid") return renderRapid();

    if (name === "crypto") {
      const crypto = markets.filter((m) => /binance|crypto/i.test(m.source || "") || /BTC|ETH|SOL|XRP|BNB|ADA|DOGE|AVAX|LINK/i.test(m.id || ""));
      return setDrawer(t("crypto"), `
        <div class="info-card">
          <h3>${t("crypto")}</h3>
          <p class="plain">Compact feed. Open the chart link for full external chart detail.</p>
        </div>
        ${marketRows(crypto.length ? crypto : markets.slice(0, 12))}
      `, "crypto");
    }

    if (name === "commodities") {
      const commodities = markets.filter((m) => /gold|silver|oil|brent|wti|copper|gas|commodity|gld|slv/i.test(`${m.id} ${m.name} ${m.source}`));
      return setDrawer(t("commodities"), `
        <div class="info-card">
          <h3>${t("commodities")}</h3>
          <p class="plain">Use these to check whether war, route, or crisis events are actually moving prices.</p>
        </div>
        ${marketRows(commodities.length ? commodities : markets.slice(0, 12))}
      `, "commodities");
    }

    if (name === "layers") {
      return setInfo(t("safety"), `
        <div class="info-card">
          <h3>${t("safety")}</h3>
          <p class="plain">Country fill colours show broad risk layer. Click the map for the detailed point card.</p>
          <div class="toggle-row">
            <label><input id="safetyToggle" type="checkbox" ${window.SHOW_SAFETY ? "checked" : ""}> Country risk colours</label>
          </div>
          <div class="quick-list">
            <div class="quick-item red"><b>Red:</b> active conflict / major risk region</div>
            <div class="quick-item orange"><b>Orange:</b> high risk watch</div>
            <div class="quick-item green"><b>Green:</b> lower current mapped risk</div>
            <div class="quick-item yellow"><b>Warning:</b> not a frontline map.</div>
          </div>
        </div>
      `, "layers");
    }
  }

  function renderLiveBrief() {
    const state = window.APP_STATE || {};
    const events = (state.events || [])
      .filter((e) => ["war", "terror", "crisis", "risk"].includes(normalKind(e.kind)))
      .slice(0, 10);

    const markets = (state.markets || []).slice(0, 10);
    const predictions = (state.predictions || []).slice(0, 6);

    setDrawer(t("liveBrief"), `
      <div class="info-card">
        <h3>${t("liveBrief")}</h3>
        <p class="plain">Plain summary of what is worth checking now. It filters for war, terror, crisis and market-sensitive events.</p>
      </div>

      <div class="info-card">
        <h3>1. Priority alerts</h3>
        <div class="quick-list">
          ${
            events.length
              ? events.map((e) => `
                <div class="quick-item ${normalKind(e.kind)}">
                  <b>${esc(kindLabel[normalKind(e.kind)] || "Event")}:</b>
                  <a target="_blank" rel="noopener" href="${esc(e.url || "#")}">${esc(plainEventTitle(e))}</a>
                  <br><span class="source-line">${esc(e.source || "source")} | ${esc(eventPlace(e))}</span>
                </div>
              `).join("")
              : `<div class="warn">No priority alerts loaded.</div>`
          }
        </div>
      </div>

      <div class="info-card">
        <h3>2. Market reaction</h3>
        <p class="plain">Check whether the market has already reacted. If there is no price movement, the alert may not matter financially.</p>
        ${marketRows(markets)}
      </div>

      <div class="info-card">
        <h3>3. What to do</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Safety:</b> click the affected map area and read Global Risk.</div>
          <div class="quick-item"><b>Money:</b> check related commodities, crypto, routes and Polymarket.</div>
          <div class="quick-item"><b>Trade:</b> only act if price, source and timing agree.</div>
          <div class="quick-item yellow"><b>Do not:</b> buy because a card says “alert”.</div>
        </div>
      </div>

      <div class="info-card">
        <h3>4. Current prediction shortlist</h3>
        <div class="quick-list">
          ${
            predictions.length
              ? predictions.map((p) => `
                <div class="quick-item">
                  <b>${esc(p.asset || p.id || "Asset")}:</b>
                  ${esc(p.rating || "N/A")} score | ${esc(p.direction || "N/A")} | ${esc((p.reasons || []).slice(0, 2).join(" / ") || "No reason loaded")}
                </div>
              `).join("")
              : `<div class="warn">No prediction rows loaded.</div>`
          }
        </div>
      </div>
    `, "brief");
  }

  function renderPredictions() {
    const state = window.APP_STATE || {};
    const predictions = state.predictions || [];

    setDrawer(t("predictions"), `
      <div class="info-card">
        <h3>${t("predictions")}</h3>
        <p class="plain">This ranks setups. It does not know the future. A high score means stronger recent price/event evidence, not guaranteed profit.</p>
        <div class="quick-list">
          <div class="quick-item"><b>Score:</b> current setup strength.</div>
          <div class="quick-item"><b>Direction:</b> whether the signal leans up, down or mixed.</div>
          <div class="quick-item"><b>Reason:</b> price movement, event match, volatility or market confirmation.</div>
          <div class="quick-item yellow"><b>Use:</b> shortlist only. Verify with chart and source before action.</div>
        </div>
      </div>

      ${
        predictions.length
          ? predictions.map((p) => {
            const rating = hasNum(p.rating) ? Number(p.rating) : null;
            return `
              <div class="info-card">
                <h3>${esc(p.asset || p.id || "Asset")} - ${esc(p.direction || "N/A")}</h3>
                <div class="index-grid real-indexes">
                  ${scoreTile("Setup score", rating, rating >= 70 ? "stronger" : rating >= 55 ? "mixed" : "weak", "engine score")}
                  ${scoreTile("Event match", Math.min(100, Number(p.eventMatches || 0) * 20), `${p.eventMatches || 0} hits`, "event feed")}
                </div>
                <div class="quick-list">
                  <div class="quick-item"><b>Plain meaning:</b> ${rating >= 70 ? "watch closely" : rating >= 55 ? "mixed, needs confirmation" : "not strong enough yet"}</div>
                  <div class="quick-item"><b>Reasons:</b> ${esc((p.reasons || []).join(" | ") || "No reason loaded")}</div>
                  <div class="quick-item yellow"><b>${t("check")}:</b> ${t("notAdvice")}</div>
                </div>
              </div>
            `;
          }).join("")
          : `<div class="warn">${t("noData")}</div>`
      }
    `, "predictions");
  }

  function renderPolymarket() {
    const state = window.APP_STATE || {};
    const markets = state.polymarket || state.predictionMarkets || state.markets?.polymarket || [];
    const list = Array.isArray(markets) ? markets : [];

    const ranked = list.map((m) => {
      const prob = Number(m.probability ?? m.prob ?? m.yesPrice ?? m.price ?? NaN);
      const chance = Number.isFinite(prob) ? (prob <= 1 ? prob * 100 : prob) : null;
      const volume = Number(m.volume ?? m.volumeNum ?? m.liquidity ?? 0);
      const moneyRank = chance === null ? 0 : Math.min(100, Math.round((chance * 0.7) + (Math.min(volume, 100000) / 100000) * 30));

      return { ...m, chance, volume, moneyRank };
    }).sort((a, b) => b.moneyRank - a.moneyRank).slice(0, 20);

    setInfo(t("polymarket"), `
      <div class="info-card">
        <h3>${t("polymarket")}</h3>
        <p class="plain">Ranked by market chance and available activity. This still cannot prove profit. It shows which markets are most worth checking.</p>
      </div>

      ${
        ranked.length
          ? ranked.map((m, i) => `
            <div class="info-card">
              <h3>#${i + 1} ${esc(m.title || m.question || m.name || "Market")}</h3>
              <div class="index-grid real-indexes">
                ${scoreTile("Market chance", m.chance, m.chance === null ? "N/A" : `${Math.round(m.chance)}% priced chance`, "Polymarket")}
                ${scoreTile("Money check", m.moneyRank, "ranking score", "chance + activity")}
              </div>
              <div class="quick-list">
                <div class="quick-item"><b>Best use:</b> compare current price with fresh news. Only interesting if you think the market is wrong.</div>
                <div class="quick-item"><b>Activity:</b> ${esc(m.volume || "N/A")}</div>
                <div class="quick-item yellow"><b>Rule:</b> high chance does not mean good value. It may already be priced in.</div>
              </div>
              <p class="source-box">${m.url ? `<a target="_blank" rel="noopener" href="${esc(m.url)}">open market</a>` : "Polymarket source"}</p>
            </div>
          `).join("")
          : `<div class="info-card"><h3>No markets loaded</h3><p class="plain">No fake odds shown.</p></div>`
      }
    `, "polymarket");
  }

  function renderRoutesPanel() {
    const routes = window.MoneyMap?.getTradeRoutes ? window.MoneyMap.getTradeRoutes() : (window.ROUTES || []);

    setInfo(t("routes"), `
      <div class="info-card">
        <h3>${t("routes")}</h3>
        <p class="plain">Search and toggle specific route lines. Exact metre-level AIS routing is not included because no AIS feed is connected.</p>

        <div class="toggle-row">
          <label><input type="checkbox" id="seaToggle" ${window.SHOW_SEA ? "checked" : ""}> Sea route web</label>
          <label><input type="checkbox" id="landToggle" ${window.SHOW_LAND ? "checked" : ""}> Land route web</label>
        </div>

        <input id="routeSearch" class="route-search" placeholder="Search route, port, goods, chokepoint..." />
      </div>

      <div id="routeList" class="route-list">
        ${routes.map((r) => routeRow(r)).join("")}
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

    document.querySelectorAll(".route-line-toggle").forEach((box) => {
      box.addEventListener("change", () => {
        const selected = [...document.querySelectorAll(".route-line-toggle:checked")].map((x) => x.value);
        window.ROUTE_FILTER_IDS = new Set(selected);
        if (window.MoneyMap?.renderRoutes) window.MoneyMap.renderRoutes(window.ROUTES || []);
      });
    });

    document.querySelectorAll(".route-open").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.routeId;
        const route = routes.find((r) => r.id === id);
        if (route) renderRoute(route);
      });
    });
  }

  function routeRow(r) {
    return `
      <div class="info-card route-row">
        <label class="route-toggle-line">
          <input class="route-line-toggle" type="checkbox" value="${esc(r.id)}" checked>
          <span>${esc(r.name)}</span>
        </label>
        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(r.type || "route")} | <b>Rank:</b> ${esc(r.rank || "major estimated lane")}</div>
          <div class="quick-item"><b>Goods:</b> ${esc(r.goods || "containers, oil, LNG, bulk goods")}</div>
          <div class="quick-item"><b>Used by:</b> ${esc(r.users || "shipping lines, freight forwarders, commodity traders")}</div>
          <div class="quick-item"><b>Chokepoints:</b> ${esc((r.chokepoints || []).join(", ") || "N/A")}</div>
        </div>
        <button class="route-open" data-route-id="${esc(r.id)}">Open route card</button>
      </div>
    `;
  }

  function renderRoute(r) {
    setInfo(r.name || "Route", `
      <div class="info-card">
        <h3>${esc(r.name || "Route")}</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(r.type || "route")}</div>
          <div class="quick-item"><b>Rank:</b> ${esc(r.rank || "major estimated lane")}</div>
          <div class="quick-item"><b>Direction:</b> ${esc(r.direction || "two-way")}</div>
          <div class="quick-item"><b>Goods:</b> ${esc(r.goods || "containers, oil, LNG, bulk goods")}</div>
          <div class="quick-item"><b>Used by:</b> ${esc(r.users || "shipping lines, freight forwarders, commodity traders")}</div>
          <div class="quick-item"><b>Chokepoints:</b> ${esc((r.chokepoints || []).join(", ") || "N/A")}</div>
          <div class="quick-item"><b>Watch:</b> ${esc((r.watch || []).join(", ") || "freight, insurance, energy, FX, port delays")}</div>
          <div class="quick-item yellow"><b>Accuracy:</b> estimated major lane. Not metre-level AIS track.</div>
        </div>
      </div>
    `, "routes");
  }

  function renderRapid() {
    const state = window.APP_STATE || {};
    const rows = state.rapid || [];

    setDrawer(t("rapid"), `
      <div class="info-card">
        <h3>${t("rapid")}</h3>
        <p class="plain">Recent speed screen. This tells you what moved, not what is guaranteed to keep moving.</p>
      </div>
      ${
        rows.length
          ? rows.map((r) => `
            <div class="info-card">
              <h3>${esc(r.asset || "Asset")}</h3>
              <div class="quick-list">
                <div class="quick-item"><b>Direction:</b> ${esc(r.direction || "N/A")}</div>
                <div class="quick-item"><b>Short move:</b> ${esc(r.shortMove || r.moveShort || "N/A")}</div>
                <div class="quick-item"><b>Window move:</b> ${esc(r.windowMove || r.moveWindow || "N/A")}</div>
                <div class="quick-item"><b>Reason:</b> ${esc((r.reasons || []).join(" | ") || "No reason loaded")}</div>
                <div class="quick-item yellow"><b>Use:</b> avoid chasing if move already extended.</div>
              </div>
            </div>
          `).join("")
          : `<div class="warn">${t("noData")}</div>`
      }
    `, "rapid");
  }

  function renderSources() {
    setDrawer(t("sources"), `<div class="info-card"><h3>${t("sources")}</h3><div class="loader-bar"><span></span></div><p>Loading source list...</p></div>`, "sources");

    fetch("/api/sources")
      .then((r) => r.json())
      .then((data) => {
        const rows = data.sources || [];
        setDrawer(t("sources"), `
          <div class="info-card">
            <h3>${t("sources")}</h3>
            <p class="plain">All bottom-right source text has been moved here.</p>
          </div>
          ${
            rows.length
              ? rows.map((s) => `
                <div class="info-card">
                  <h3>${esc(s.name || "Source")}</h3>
                  <div class="quick-list">
                    <div class="quick-item"><b>Category:</b> ${esc(s.category || "N/A")}</div>
                    <div class="quick-item"><b>Provides:</b> ${esc((s.provides || []).join(", ") || "N/A")}</div>
                    <div class="quick-item"><b>Missing means:</b> ${esc(s.missingMeans || "Data unavailable")}</div>
                  </div>
                  <p class="source-box">${s.url ? `<a target="_blank" rel="noopener" href="${esc(s.url)}">${esc(s.url)}</a>` : "No source URL"}</p>
                </div>
              `).join("")
              : `<div class="warn">No source list loaded.</div>`
          }
        `, "sources");
      })
      .catch(() => {
        setDrawer(t("sources"), `
          <div class="info-card">
            <h3>${t("sources")}</h3>
            <p class="plain">Source endpoint unavailable.</p>
            <div class="quick-list">
              <div class="quick-item"><b>Global events:</b> GDELT</div>
              <div class="quick-item"><b>Disasters:</b> GDACS</div>
              <div class="quick-item"><b>Earthquakes:</b> USGS</div>
              <div class="quick-item"><b>Macro:</b> World Bank</div>
              <div class="quick-item"><b>Local places:</b> OpenStreetMap</div>
              <div class="quick-item"><b>Weather:</b> Open-Meteo</div>
            </div>
          </div>
        `, "sources");
      });
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
              : `<div class="warn">${t("noData")}</div>`
          }
        </div>
      </div>
    `, "search");

    document.querySelectorAll(".result-row").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (window.MoneyMap?.openContext) window.MoneyMap.openContext(btn.dataset.lat, btn.dataset.lng, 9);
      });
    });
  }

  function renderLocalPlace(p) {
    const title = p.name || p.title || "Place";
    const wikiId = `wiki-${String(p.id || title).replace(/[^a-z0-9]/gi, "-")}`;

    setInfo(title, `
      <div class="info-card">
        <h3>${esc(title)}</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(p.tags?.place || p.tags?.amenity || p.kind || "local place")}</div>
          <div class="quick-item"><b>Latitude:</b> ${esc(p.lat || "N/A")}</div>
          <div class="quick-item"><b>Longitude:</b> ${esc(p.lng || "N/A")}</div>
          <div class="quick-item"><b>Source:</b> ${esc(p.source || "OpenStreetMap")}</div>
          ${p.tags?.population ? `<div class="quick-item"><b>Population:</b> ${esc(p.tags.population)}</div>` : ""}
        </div>
      </div>
      <div id="${esc(wikiId)}"><div class="warn">Loading Wikipedia image...</div></div>
    `, "place");

    loadWikiInto(wikiId, title, p.tags?.wikidata);
  }

  function loadWikiInto(id, title, wikidata) {
    const el = document.getElementById(id);
    if (!el) return;

    const qs = new URLSearchParams();
    if (title) qs.set("name", title);
    if (wikidata) qs.set("wikidata", wikidata);

    fetch(`/api/wiki/place?${qs.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d || !d.found) {
          el.innerHTML = `<div class="warn">No Wikipedia image found. No fake picture shown.</div>`;
          return;
        }

        el.innerHTML = `
          <div class="wiki-card">
            ${d.thumbnail ? `<img class="wiki-img" src="${esc(d.thumbnail)}" alt="${esc(d.title)}">` : ""}
            <div>
              <h3>${esc(d.title)}</h3>
              <p>${esc(String(d.extract || "").slice(0, 320) || "N/A")}</p>
              <p class="source-box"><a target="_blank" rel="noopener" href="${esc(d.url || "#")}">Wikipedia source</a></p>
            </div>
          </div>
        `;
      })
      .catch(() => {
        el.innerHTML = `<div class="warn">Wikipedia unavailable.</div>`;
      });
  }

  function renderNode(n) {
    setInfo(n.name || "Node", `
      <div class="info-card">
        <h3>${esc(n.name || "Node")}</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(kindLabel[normalKind(n.kind)] || n.kind || "node")}</div>
          <div class="quick-item"><b>Watch:</b> ${esc((n.watch || []).join(", ") || "N/A")}</div>
          <div class="quick-item"><b>Source:</b> ${esc(n.source || "mapped point")}</div>
        </div>
      </div>
    `, "node");
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
