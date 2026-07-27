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
      ? "$" + Number(n).toLocaleString(undefined, {
          maximumFractionDigits: Number(n) < 10 ? 4 : 2
        })
      : "N/A";

  const num = (n) =>
    hasNum(n)
      ? Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "N/A";

  const pctText = (n) =>
    hasNum(n)
      ? `${Number(n) >= 0 ? "up" : "down"} ${Math.abs(Number(n)).toFixed(2)}%`
      : "N/A";

  const arrow = (n) =>
    `<span class="${hasNum(n) ? (Number(n) >= 0 ? "up" : "down") : "muted"}">${pctText(n)}</span>`;

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
    news: "News",
    risk: "Risk"
  };

  const translations = {
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
      source: "Source",
      plainView: "Plain view",
      routeWarning: "Full AIS-grade world route coverage requires a real AIS/density feed. This view shows a dense source-aware approximation of major trade lanes.",
      notFinancialAdvice: "Not a buy/sell instruction. Use this as a signal screen, then verify with price action, liquidity and source links."
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
      source: "Fuente",
      plainView: "Vista simple",
      routeWarning: "La cobertura AIS completa requiere una fuente AIS/densidad real. Esta vista muestra una aproximación de rutas principales.",
      notFinancialAdvice: "No es una orden de compra/venta. Verifica precio, liquidez y fuentes."
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
      source: "Source",
      plainView: "Vue simple",
      routeWarning: "Une couverture AIS mondiale complète nécessite un vrai flux AIS/densité. Cette vue est une approximation des grandes routes.",
      notFinancialAdvice: "Ce n'est pas un ordre d'achat/vente. Vérifiez prix, liquidité et sources."
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
      source: "Quelle",
      plainView: "Einfache Ansicht",
      routeWarning: "Vollständige AIS-Routenabdeckung braucht echte AIS/Dichte-Daten. Diese Ansicht zeigt eine große Routen-Näherung.",
      notFinancialAdvice: "Keine Kauf-/Verkaufsanweisung. Preis, Liquidität und Quellen prüfen."
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
      source: "المصدر",
      plainView: "عرض بسيط",
      routeWarning: "التغطية الكاملة لمسارات AIS تحتاج مصدر AIS حقيقي. هذا عرض تقريبي للمسارات الكبرى.",
      notFinancialAdvice: "ليس أمر شراء أو بيع. تحقق من السعر والسيولة والمصادر."
    }
  };

  function lang() {
    return window.SME_LANG || localStorage.getItem("sme-language") || "en";
  }

  function t(key) {
    return translations[lang()]?.[key] || translations.en[key] || key;
  }

  function isForeignText(text) {
    const s = String(text || "");
    if (!s) return false;

    const nonAscii = (s.match(/[^\x00-\x7F]/g) || []).length;
    const invertedPunctuation = /[¿¡]/.test(s);
    const cyrillic = /[\u0400-\u04FF]/.test(s);
    const arabic = /[\u0600-\u06FF]/.test(s);
    const han = /[\u4E00-\u9FFF]/.test(s);

    return invertedPunctuation || cyrillic || arabic || han || nonAscii / Math.max(s.length, 1) > 0.08;
  }

  function normalKind(kind) {
    if (["disaster", "weather", "earthquake", "quake"].includes(kind)) return "crisis";
    if (kind === "tech") return "ai";
    if (kind === "election") return "politics";
    return kind || "risk";
  }

  function eventPlace(e) {
    return e.place || e.city || e.country || e.sourceCountry || "mapped area";
  }

  function plainEventTitle(e) {
    const kind = kindLabel[normalKind(e.kind)] || "Event";
    const place = eventPlace(e);
    const raw = String(e.title || e.summary || "").trim();

    if (!raw || isForeignText(raw)) {
      return `${kind} report near ${place}`;
    }

    return raw.slice(0, 135);
  }

  function plainSummary(e) {
    const kind = kindLabel[normalKind(e.kind)] || "Event";
    const place = eventPlace(e);
    const raw = String(e.summary || e.title || "").trim();

    if (!raw || isForeignText(raw)) {
      return `English fallback: ${kind} report near ${place}. Open the source to inspect the original article.`;
    }

    return raw.slice(0, 260);
  }

  function sourceList(sources) {
    return (sources || [])
      .filter((s) => s && (s.url || s.name || s.source))
      .map((s) => `<a target="_blank" rel="noopener" href="${esc(s.url || "#")}">${esc(s.name || s.source || "source")}</a>`)
      .join(" | ") || "source pending";
  }

  function scoreClass(value) {
    if (value === null || value === undefined || value === "NA" || value === "N/A") return "grey";
    const v = Number(value);
    if (v >= 75) return "green";
    if (v >= 55) return "yellow";
    if (v >= 35) return "orange";
    return "red";
  }

  function scoreLabel(value) {
    if (value === null || value === undefined || value === "NA" || value === "N/A") return t("noData");
    const v = Number(value);
    if (v >= 75) return "Good";
    if (v >= 55) return "Mixed";
    if (v >= 35) return "Weak";
    return "Bad";
  }

  function indexTile(label, value, source) {
    const v = value === null || value === undefined ? "N/A" : Math.round(Number(value));
    return `
      <div class="index-tile ${scoreClass(value)}">
        <div class="label">${esc(label)}</div>
        <div class="num">${esc(v)}</div>
        <div class="tag">${scoreLabel(value)}</div>
        ${source ? `<div class="mini-source">${esc(source)}</div>` : ""}
      </div>
    `;
  }

  function eventCard(e) {
    const kind = normalKind(e.kind);
    const cls = kind === "war" ? "red" : kind === "terror" ? "orange" : kind === "crisis" ? "yellow" : "blue";
    const title = plainEventTitle(e);
    const original = isForeignText(e.title) ? e.title : e.originalTitle;

    return `
      <div class="info-card">
        <h3>${esc(title)}</h3>
        <div class="quick-list">
          <div class="quick-item ${cls}">
            <b>Type:</b> ${esc(kindLabel[kind] || kind)} | <b>Place:</b> ${esc(eventPlace(e))}
          </div>
          <div class="quick-item">
            <b>What happened:</b> ${esc(plainSummary(e))}
          </div>
          <div class="quick-item yellow">
            <b>${t("check")}:</b> open the source, compare local news, then check market reaction.
          </div>
        </div>
        <p class="action-line"><b>Assets:</b> ${(e.watch || []).map(esc).join(", ") || "N/A"}</p>
        ${original ? `<p class="original-title"><b>Original title:</b> ${esc(original)}</p>` : ""}
        <p class="source-box">${sourceList(e.sources || [{ name: e.source, url: e.url }])}</p>
      </div>
    `;
  }

  function eventList(events) {
    return (events || []).map(eventCard).join("") || `<div class="warn">${t("noData")}</div>`;
  }

  function groupMarkets(kind) {
    const list = window.APP_STATE?.markets || [];
    return list.filter((m) => kind === "all" || m.group === kind || m.type === kind || (kind === "crypto" && m.source === "Binance"));
  }

  function renderTicker(markets) {
    const el = document.getElementById("ticker");
    if (!el) return;

    el.innerHTML =
      (markets || [])
        .slice(0, 22)
        .map((m) => `<span><b>${esc(m.id)}</b> ${money(m.price)} ${arrow(m.changePct)}</span>`)
        .join("") || "<span>No market data</span>";
  }

  function renderMarkets(markets) {
    renderTicker(markets);
  }

  function tradingViewWidget(symbol, height = 360) {
    const safeSymbol = esc(symbol);
    const id = `tv-${safeSymbol.replace(/[^a-z0-9]/gi, "-")}-${Math.random().toString(36).slice(2)}`;

    setTimeout(() => {
      const holder = document.getElementById(id);
      if (!holder) return;

      holder.innerHTML = `
        <div class="tradingview-widget-container__widget"></div>
        <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>
        {
          "autosize": true,
          "symbol": "${safeSymbol}",
          "interval": "60",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "calendar": false,
          "support_host": "https://www.tradingview.com"
        }
        </script>
      `;
    }, 80);

    return `<div class="tv-wrap" id="${id}" style="height:${height}px;"></div>`;
  }

  function symbolForTradingView(m) {
    const id = String(m.symbol || m.id || "").toUpperCase();

    const map = {
      BTC: "BINANCE:BTCUSDT",
      ETH: "BINANCE:ETHUSDT",
      SOL: "BINANCE:SOLUSDT",
      XRP: "BINANCE:XRPUSDT",
      BNB: "BINANCE:BNBUSDT",
      ADA: "BINANCE:ADAUSDT",
      GLD: "AMEX:GLD",
      SLV: "AMEX:SLV",
      USO: "AMEX:USO",
      BRENT: "TVC:UKOIL",
      WTI: "TVC:USOIL",
      GOLD: "TVC:GOLD",
      SILVER: "TVC:SILVER",
      COPPER: "COMEX:HG1!",
      NATGAS: "NYMEX:NG1!"
    };

    return map[id] || map[String(m.id || "").toUpperCase()] || id || "TVC:GOLD";
  }

  function marketTable(list) {
    return `
      <div class="market-table">
        ${(list || [])
          .map((m) => `
            <div class="market-row">
              <div class="sym">${esc(m.id)}</div>
              <div>
                <div class="name">${esc(m.name || m.id)}</div>
                <div class="sub">${esc(m.source || "source")} | ${esc(m.status || "live/delayed")}</div>
              </div>
              <div class="price"><b>${money(m.price)}</b><br>${arrow(m.changePct)}</div>
            </div>
          `)
          .join("") || `<div class="warn">${t("noData")}</div>`}
      </div>
    `;
  }

  function marketChartGrid(list) {
    const symbols = (list || []).slice(0, 6).map(symbolForTradingView);
    return symbols.map((s) => tradingViewWidget(s, 340)).join("");
  }

  function routeControls() {
    return `
      <p class="plain">${t("routeWarning")}</p>
      <div class="toggle-row">
        <label><input type="checkbox" id="seaToggle" ${window.SHOW_SEA ? "checked" : ""}> Sea route web</label>
        <label><input type="checkbox" id="landToggle" ${window.SHOW_LAND ? "checked" : ""}> Land route web</label>
      </div>
      <div class="info-card">
        <h3>${t("use")}</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Thin blue web:</b> sea trade lanes.</div>
          <div class="quick-item"><b>Thin yellow web:</b> land corridors.</div>
          <div class="quick-item"><b>Chokepoints:</b> Suez, Hormuz, Malacca, Panama, Bosporus, Bab el-Mandeb.</div>
          <div class="quick-item yellow"><b>Reality check:</b> exact ship-by-ship routes need AIS data.</div>
        </div>
      </div>
    `;
  }

  function riskLegend() {
    return `
      <div class="safety-key">
        <span class="risk-pill red">CONFLICT</span>
        <span class="risk-pill orange">HIGH</span>
        <span class="risk-pill yellow">WATCH</span>
        <span class="risk-pill green">LOWER</span>
        <span class="risk-pill grey">N/A</span>
      </div>
    `;
  }

  function predictionList(rows) {
    return (rows || [])
      .map((p) => {
        const rating = hasNum(p.rating) ? Number(p.rating) : null;
        const cls = rating === null ? "grey" : rating >= 70 ? "green" : rating >= 55 ? "yellow" : "orange";

        return `
          <div class="info-card prediction-card ${cls}">
            <h3>${esc(p.asset)} - ${esc(p.label || "rating")}</h3>
            <div class="index-grid real-indexes">
              ${indexTile("Rise score", rating, "measured score")}
              ${indexTile("24h move", hasNum(p.changePct) ? Math.abs(p.changePct) * 10 : null, hasNum(p.changePct) ? `${Number(p.changePct).toFixed(2)}%` : "N/A")}
              ${indexTile("Event hits", Math.min(100, Number(p.eventMatches || 0) * 20), `${p.eventMatches || 0} hits`)}
            </div>
            <div class="quick-list">
              <div class="quick-item"><b>Plain meaning:</b> ${rating >= 70 ? "stronger upside setup" : rating >= 55 ? "mixed but watchable" : "weak/no clear setup"}</div>
              <div class="quick-item"><b>Direction:</b> ${esc(p.direction || "N/A")}</div>
              <div class="quick-item"><b>Price:</b> ${money(p.price)}</div>
              <div class="quick-item"><b>Why:</b> ${(p.reasons || []).map(esc).join(" | ") || "N/A"}</div>
              <div class="quick-item yellow"><b>${t("check")}:</b> ${t("notFinancialAdvice")}</div>
            </div>
          </div>
        `;
      })
      .join("") || `<div class="warn">${t("noData")}</div>`;
  }

  function renderBriefFromState() {
    const state = window.APP_STATE || {};
    const events = (state.events || [])
      .filter((e) => ["war", "terror", "crisis", "disaster", "weather", "earthquake", "risk"].includes(normalKind(e.kind)))
      .slice(0, 12);

    const rapid = (state.rapid || []).slice(0, 8);
    const preds = (state.predictions || []).slice(0, 8);
    const markets = (state.markets || []).slice(0, 12);

    Panels.setDrawer(t("liveBrief"), `
      <div class="info-card">
        <h3>${t("liveBrief")}</h3>
        <p class="plain">This shows what is worth checking now. It filters out low-value noise and random company news.</p>
      </div>

      <div class="info-card">
        <h3>Priority alerts</h3>
        <div class="quick-list">
          ${
            events.length
              ? events.map((e) => `
                <div class="quick-item">
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
        <h3>Market reaction to check</h3>
        <div class="quick-list">
          ${
            markets.length
              ? markets.map((m) => `
                <div class="quick-item">
                  <b>${esc(m.id)}:</b> ${money(m.price)} | ${pctText(m.changePct)}
                </div>
              `).join("")
              : `<div class="warn">No market data loaded.</div>`
          }
        </div>
      </div>

      <div class="info-card">
        <h3>How to act</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Step 1:</b> Click the alert/country and read the source card.</div>
          <div class="quick-item"><b>Step 2:</b> Check if related markets moved already.</div>
          <div class="quick-item"><b>Step 3:</b> Use Predictions/Rapid Movers only as a ranking screen.</div>
          <div class="quick-item yellow"><b>Do not:</b> buy just because an alert appears.</div>
        </div>
      </div>

      <div class="info-card">
        <h3>Prediction shortlist</h3>
        <div class="quick-list">
          ${
            preds.length
              ? preds.map((p) => `
                <div class="quick-item">
                  <b>${esc(p.asset)}:</b> ${esc(p.rating)}% | ${esc(p.direction || "N/A")} | ${esc((p.reasons || []).slice(0, 2).join(" / ") || "N/A")}
                </div>
              `).join("")
              : `<div class="warn">No prediction rows loaded.</div>`
          }
        </div>
      </div>

      <div class="info-card">
        <h3>Rapid movers</h3>
        <div class="quick-list">
          ${
            rapid.length
              ? rapid.map((r) => `
                <div class="quick-item">
                  <b>${esc(r.asset)}:</b> ${esc(r.direction || "N/A")} | short ${esc(r.shortMove || r.moveShort || "N/A")} | window ${esc(r.windowMove || r.moveWindow || "N/A")}
                </div>
              `).join("")
              : `<div class="warn">No rapid movers loaded.</div>`
          }
        </div>
      </div>
    `, "brief");
  }

  function renderPlainPolymarket() {
    const state = window.APP_STATE || {};
    const markets = state.polymarket || state.predictionMarkets || state.markets?.polymarket || [];
    const list = Array.isArray(markets) ? markets.slice(0, 20) : [];

    Panels.setInfo(t("polymarket"), `
      <div class="info-card">
        <h3>${t("polymarket")}</h3>
        <p class="plain">Plain view. The useful question is: is the market mispriced compared with fresh news?</p>
      </div>

      ${
        list.length
          ? list.map((m) => {
              const title = m.title || m.question || m.name || "Market";
              const prob = Number(m.probability ?? m.prob ?? m.yesPrice ?? m.price ?? NaN);
              const pct = Number.isFinite(prob) ? Math.round(prob <= 1 ? prob * 100 : prob) : null;
              const volume = Number(m.volume ?? m.volumeNum ?? m.liquidity ?? 0);
              const usable = pct !== null && volume > 0;

              return `
                <div class="info-card">
                  <h3>${esc(title)}</h3>
                  <div class="index-grid real-indexes">
                    <div class="index-tile ${usable ? "yellow" : "grey"}">
                      <div class="label">Market chance</div>
                      <div class="num">${pct === null ? "N/A" : pct + "%"}</div>
                      <div class="tag">${usable ? "priced by users" : "not useful yet"}</div>
                      <div class="mini-source">Polymarket</div>
                    </div>
                  </div>
                  <div class="quick-list">
                    <div class="quick-item"><b>Use:</b> ${usable ? "Readable price. Compare against fresh news." : "Ignore until price/volume exists."}</div>
                    <div class="quick-item"><b>Money angle:</b> only interesting if the real probability is higher/lower than the shown price.</div>
                    <div class="quick-item yellow"><b>Rule:</b> no guaranteed buy/sell call.</div>
                  </div>
                  <p class="source-box">${m.url ? `<a target="_blank" rel="noopener" href="${esc(m.url)}">open market</a>` : "Polymarket source"}</p>
                </div>
              `;
            }).join("")
          : `
            <div class="info-card">
              <h3>No readable markets</h3>
              <p class="plain">No Polymarket data loaded. No fake odds shown.</p>
            </div>
          `
      }
    `, "polymarket");
  }

  function renderSources(data) {
    const rows = (data.sources || [])
      .map((s) => `
        <div class="info-card">
          <h3>${esc(s.name)}</h3>
          <div class="quick-list">
            <div class="quick-item"><b>Category:</b> ${esc(s.category)}</div>
            <div class="quick-item"><b>Provides:</b> ${(s.provides || []).map(esc).join(", ")}</div>
            <div class="quick-item"><b>Missing means:</b> ${esc(s.missingMeans)}</div>
          </div>
          <p class="source-box"><a target="_blank" rel="noopener" href="${esc(s.url)}">${esc(s.url)}</a></p>
        </div>
      `)
      .join("");

    Panels.setDrawer(t("sources"), `<div class="info-card"><h3>Coverage</h3><div class="metric-row"><span>Total sources</span><b>${num(data.total)}</b></div></div>${rows}`, "sources");
  }

  function openPanel(name) {
    const state = window.APP_STATE || {};

    if (name === "brief") {
      renderBriefFromState();
      return;
    }

    if (name === "crypto") {
      const list = groupMarkets("crypto");
      Panels.setDrawer(t("crypto"), `
        <div class="info-card">
          <h3>${t("crypto")}</h3>
          <p class="plain">Imported TradingView charts plus your live feed table. Use chart trend + live move together.</p>
        </div>
        ${marketTable(list)}
        ${marketChartGrid(list)}
      `, "crypto");
      return;
    }

    if (name === "commodities") {
      const list = groupMarkets("commodity");
      const defaultList = list.length ? list : [
        { id: "GOLD", name: "Gold" },
        { id: "SILVER", name: "Silver" },
        { id: "WTI", name: "WTI Oil" },
        { id: "BRENT", name: "Brent Oil" },
        { id: "COPPER", name: "Copper" },
        { id: "NATGAS", name: "Natural Gas" }
      ];

      Panels.setDrawer(t("commodities"), `
        <div class="info-card">
          <h3>${t("commodities")}</h3>
          <p class="plain">Imported TradingView charts. Use these to confirm whether crisis/route alerts are actually moving prices.</p>
        </div>
        ${marketTable(list)}
        ${marketChartGrid(defaultList)}
      `, "commodities");
      return;
    }

    if (name === "predictions") {
      Panels.setDrawer(t("predictions"), `
        <div class="info-card">
          <h3>${t("predictions")}</h3>
          <p class="plain">This ranks setups. It does not know the future. A high score means stronger recent price/event evidence, not guaranteed profit.</p>
          <div class="quick-list">
            <div class="quick-item"><b>Rise score:</b> higher means stronger measured upside setup.</div>
            <div class="quick-item"><b>24h move:</b> shows recent movement, not future movement.</div>
            <div class="quick-item"><b>Event hits:</b> shows related news/risk matches.</div>
            <div class="quick-item yellow"><b>How to act:</b> only consider it after checking chart, liquidity, and source news.</div>
          </div>
        </div>
        ${predictionList(state.predictions || [])}
      `, "predictions");
      return;
    }

    if (name === "polymarket") {
      renderPlainPolymarket();
      return;
    }

    if (name === "routes") {
      Panels.setInfo(t("routes"), `
        ${routeControls()}
        <div class="route-list">
          ${(window.ROUTES || []).slice(0, 35).map((r) => `
            <div class="info-card route-chip" data-route="${esc(r.id)}">
              <h3>${esc(r.name)}</h3>
              <div class="quick-list">
                <div class="quick-item"><b>Goods:</b> ${esc(r.goods || "container/oil/bulk goods")}</div>
                <div class="quick-item"><b>Direction:</b> ${esc(r.direction || "two-way")}</div>
                <div class="quick-item"><b>Watch:</b> ${(r.watch || []).map(esc).join(", ") || "freight, oil, ports, insurance"}</div>
              </div>
            </div>
          `).join("")}
        </div>
      `, "routes");
      return;
    }

    if (name === "layers") {
      Panels.setInfo(t("safety"), `
        ${riskLegend()}
        <p class="plain">Country colour is fill-only. It is not a fake frontline map.</p>
        <div class="toggle-row">
          <label><input id="safetyToggle" type="checkbox" ${window.SHOW_SAFETY ? "checked" : ""}> Country risk colours</label>
        </div>
      `, "layers");
      return;
    }

    if (name === "sources") {
      Panels.setDrawer(t("sources"), `<div class="warn">Loading source status...</div>`, "sources");
      fetch("/api/sources")
        .then((r) => r.json())
        .then(renderSources)
        .catch(() => Panels.setDrawer(t("sources"), `<div class="warn">Source list unavailable.</div>`, "sources"));
      return;
    }

    if (name === "rapid") {
      Panels.setDrawer(t("rapid"), `
        <div class="info-card">
          <h3>${t("rapid")}</h3>
          <p class="plain">Measured recent moves only. This shows speed and direction, not a guaranteed continuation.</p>
          <div class="quick-list">
            <div class="quick-item"><b>Short move:</b> nearest-term move.</div>
            <div class="quick-item"><b>Window move:</b> broader recent move.</div>
            <div class="quick-item"><b>Volatility:</b> how unstable the asset is.</div>
            <div class="quick-item yellow"><b>How to act:</b> avoid late entries if the move already extended and volume is fading.</div>
          </div>
        </div>
        ${(state.rapid || []).map((r) => `
          <div class="rapid-card">
            <h3>${esc(r.asset)} - ${esc(r.label || "rapid move")}</h3>
            <div class="metric-row"><span>Short move</span><b>${esc(r.moveShort || r.shortMove || "N/A")}%</b></div>
            <div class="metric-row"><span>Window move</span><b>${esc(r.moveWindow || r.windowMove || "N/A")}%</b></div>
            <div class="metric-row"><span>Volatility</span><b>${esc(r.volatilityPct || r.volatility || "N/A")}%</b></div>
            <div class="quick-list">
              <div class="quick-item"><b>Direction:</b> ${esc(r.direction || "N/A")}</div>
              <div class="quick-item"><b>Measured facts:</b> ${(r.reasons || []).map(esc).join(" | ") || "N/A"}</div>
              <div class="quick-item yellow"><b>Warning:</b> ${esc(r.warning || "Recent measurements only.")}</div>
            </div>
          </div>
        `).join("") || `<div class="warn">${t("noData")}</div>`}
      `, "rapid");
    }
  }

  function loadWikiInto(id, title, wikidata) {
    const el = document.getElementById(id);
    if (!el || (!title && !wikidata)) return;

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
              <p>${esc(String(d.extract || "").slice(0, 260) || "N/A")}</p>
              <p class="source-box"><a target="_blank" rel="noopener" href="${esc(d.url || "#")}">Wikipedia source</a></p>
            </div>
          </div>
        `;
      })
      .catch(() => {
        el.innerHTML = `<div class="warn">Wikipedia unavailable.</div>`;
      });
  }

  function renderLocalPlace(p) {
    const wikiId = `wiki-${String(p.id || p.name).replace(/[^a-z0-9]/gi, "-")}`;

    Panels.setInfo(p.name, `
      <div class="info-card">
        <h3>${esc(p.name)}</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(p.tags?.place || p.tags?.amenity || p.kind || "local place")}</div>
          <div class="quick-item"><b>Source:</b> ${esc(p.source || "OpenStreetMap")}</div>
          ${p.tags?.population ? `<div class="quick-item"><b>Population:</b> ${esc(p.tags.population)}</div>` : ""}
        </div>
      </div>
      <div id="${esc(wikiId)}"><div class="warn">Loading Wikipedia image...</div></div>
    `, "context");

    loadWikiInto(wikiId, p.name, p.tags?.wikidata);
  }

  function renderSearch(result) {
    const places = result?.places || [];

    Panels.setInfo("Search", `
      <div class="info-card">
        <h3>Search results</h3>
        <p class="source-box">Source: ${esc(result?.source || "OpenStreetMap Nominatim")}</p>
        <div class="quick-list">
          ${
            places.map((p) => `
              <button class="result-row" data-lat="${esc(p.lat)}" data-lng="${esc(p.lng)}">
                <b>${esc(p.name || p.displayName)}</b>
                <span>${esc(p.displayName || "")}</span>
              </button>
            `).join("") || `<div class="warn">${t("noData")}</div>`
          }
        </div>
      </div>
    `, "context");

    document.querySelectorAll(".result-row").forEach((btn) => {
      btn.addEventListener("click", () => MoneyMap.openContext(btn.dataset.lat, btn.dataset.lng, 9));
    });
  }

  function renderNode(n) {
    const wikiId = `wiki-node-${String(n.id || n.name).replace(/[^a-z0-9]/gi, "-")}`;

    Panels.setInfo(n.name, `
      <div class="info-card">
        <h3>${esc(n.name)}</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Type:</b> ${esc(kindLabel[normalKind(n.kind)] || n.kind)}</div>
          <div class="quick-item"><b>Watch:</b> ${(n.watch || []).map(esc).join(", ") || "N/A"}</div>
          <div class="quick-item"><b>Source:</b> ${esc(n.source || "mapped reference point")}</div>
        </div>
      </div>
      <div id="${esc(wikiId)}"></div>
    `, "context");

    loadWikiInto(wikiId, n.name, n.tags?.wikidata);
  }

  function renderEvent(e) {
    Panels.setInfo(plainEventTitle(e), eventCard(e), normalKind(e.kind));
  }

  function renderRoute(r) {
    Panels.setInfo(r.name, `
      <div class="info-card">
        <h3>${esc(r.name)}</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Goods:</b> ${esc(r.goods || "container/oil/bulk goods")}</div>
          <div class="quick-item"><b>Direction:</b> ${esc(r.direction || "two-way")}</div>
          <div class="quick-item"><b>Watch:</b> ${(r.watch || []).map(esc).join(", ") || "freight, ports, energy, insurance"}</div>
        </div>
      </div>
    `, "routes");
  }

  function renderRiskRegion(r) {
    Panels.setInfo(r.name, `
      <div class="info-card">
        <h3>${esc(r.name)}</h3>
        <div class="quick-list">
          <div class="quick-item red"><b>Type:</b> ${esc(r.kind || "risk")}</div>
          <div class="quick-item"><b>Status:</b> ${esc(r.level || "tracked")}</div>
          <div class="quick-item"><b>Source:</b> ${esc((r.sources || []).join(", ") || r.source || "N/A")}</div>
        </div>
      </div>
    `, "layers");
  }

  function renderCountryConflict(c) {
    const english = c.englishName || c.name;

    Panels.setInfo(english, `
      <div class="info-card country-card">
        <h3>${esc(english)}</h3>
        <div class="quick-list">
          <div class="quick-item red"><b>Status:</b> ${esc(c.status || c.level || "tracked")}</div>
          <div class="quick-item"><b>Source:</b> ${esc(c.source || "country polygon layer")}</div>
          <div class="quick-item"><b>Watch:</b> ${(c.watch || []).map(esc).join(", ") || "N/A"}</div>
        </div>
        <p class="source-box">Country colour layer. Not a frontline estimate.</p>
      </div>
    `, "layers");
  }

  function renderSafetyCountry(c) {
    const english = c.englishName || c.name;

    Panels.setInfo(english, `
      <div class="info-card country-card">
        <h3>${esc(english)}</h3>
        <div class="quick-list">
          <div class="quick-item"><b>Map colour:</b> ${esc(String(c.level || "N/A").toUpperCase())}</div>
          <div class="quick-item"><b>Source:</b> ${esc(c.source || "N/A")}</div>
          <div class="quick-item"><b>Crime feed:</b> ${esc(c.crimeFeed || "N/A")}</div>
        </div>
        <p class="source-box">Click the map for source-backed Global Risk.</p>
      </div>
    `, "layers");
  }

  function renderSafetyRegion(r) {
    Panels.setInfo(r.name, `<div class="info-card"><h3>${esc(r.name)}</h3><p>${esc(r.note || "N/A")}</p></div>`, "layers");
  }

  function renderContext(d) {
    const place = d?.reverse?.place || "Selected area";
    const country = d?.country?.englishName || d?.country?.name || "Unknown country";
    const events = (d.nearEvents || []).slice(0, 10);

    Panels.setInfo(country, `
      <div class="info-card country-card">
        <h3>${esc(country)}</h3>
        <p class="source-line">Clicked area: ${esc(place)}</p>
        <p class="plain">Use Global Risk for the newer source-backed country view.</p>
      </div>
      <div class="info-card">
        <h3>Nearby Events</h3>
        ${eventList(events)}
      </div>
    `, "context");
  }

  return {
    renderMarkets,
    openPanel,
    renderSearch,
    plainEventTitle,
    renderNode,
    renderLocalPlace,
    renderEvent,
    renderRoute,
    renderContext,
    renderRiskRegion,
    renderSafetyRegion,
    renderCountryConflict,
    renderSafetyCountry
  };
})();
