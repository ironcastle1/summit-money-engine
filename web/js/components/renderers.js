window.Renderers = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[m]));
  const hasNum = n => Number.isFinite(Number(n));
  const money = n => hasNum(n) ? '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: Number(n) < 10 ? 4 : 2 }) : 'N/A';
  const num = n => hasNum(n) ? Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A';
  const pctText = n => hasNum(n) ? `${Number(n) >= 0 ? 'up' : 'down'} ${Math.abs(Number(n)).toFixed(2)}%` : 'N/A';
  const arrow = n => `<span class="${hasNum(n) ? (Number(n) >= 0 ? 'up' : 'down') : 'muted'}">${pctText(n)}</span>`;
  const kindLabel = { war:'War', terror:'Terror', disaster:'Disaster', election:'Election', shipping:'Shipping', energy:'Energy', ai:'AI', tech:'AI', commodity:'Commodity', finance:'Finance', city:'City', news:'News' };

  function groupMarkets(kind){
    const list = window.APP_STATE?.markets || [];
    return list.filter(m => kind === 'all' || m.group === kind || m.type === kind || (kind === 'crypto' && m.source === 'Binance'));
  }
  function renderTicker(markets){
    document.getElementById('ticker').innerHTML = (markets || []).slice(0, 22).map(m => `<span><b>${esc(m.id)}</b> ${money(m.price)} ${arrow(m.changePct)}</span>`).join('') || '<span>No market data</span>';
  }
  function renderMarkets(markets){ renderTicker(markets); }
  function marketTable(list){
    return `<div class="market-table">${(list || []).map(m => `<div class="market-row"><div class="sym">${esc(m.id)}</div><div><div class="name">${esc(m.name)}</div><div class="sub">${esc(m.source)} | ${esc(m.status || 'unknown')}${m.ageSec ? ` | ${esc(m.ageSec)}s old` : ''}</div></div><div class="price"><b>${money(m.price)}</b><br>${arrow(m.changePct)}</div></div>`).join('') || '<div class="warn">No feed result. Check API/network status.</div>'}</div>`;
  }
  function sourceList(sources){
    return (sources || []).map(s => `<a target="_blank" href="${esc(s.url || '#')}">${esc(s.name || s.source || 'source')}</a>`).join(' | ') || 'source pending';
  }
  function scoreClass(value){
    if(value === null || value === undefined || value === 'NA') return 'grey';
    const v = Number(value);
    if(v >= 75) return 'green';
    if(v >= 55) return 'yellow';
    if(v >= 35) return 'orange';
    return 'red';
  }
  function scoreLabel(value){
    if(value === null || value === undefined || value === 'NA') return 'No data';
    const v = Number(value);
    if(v >= 75) return 'Good';
    if(v >= 55) return 'Mixed';
    if(v >= 35) return 'Weak';
    return 'Bad';
  }
  function indexTile(label, value, source){
    const v = value === null || value === undefined ? 'N/A' : Math.round(Number(value));
    return `<div class="index-tile ${scoreClass(value)}"><div class="label">${esc(label)}</div><div class="num">${esc(v)}</div><div class="tag">${scoreLabel(value)}</div>${source ? `<div class="mini-source">${esc(source)}</div>` : ''}</div>`;
  }
  function isForeignText(t){
    const s = String(t || '');
    if(!s) return false;
    const nonAscii = (s.match(/[^\x00-\x7F]/g) || []).length;
    return nonAscii / Math.max(s.length, 1) > 0.08;
  }
  function plainEventTitle(e){
    const kind = kindLabel[e.kind] || 'Event';
    const place = e.place ? ` near ${e.place}` : '';
    if(isForeignText(e.title)) return `${kind} report${place}`;
    return String(e.title || `${kind} report${place}`).slice(0, 130);
  }
  function plainSummary(e){
    if(isForeignText(e.summary || e.title)) return `English fallback: ${kindLabel[e.kind] || 'Event'} report. Location: ${e.place || 'mapped area'}.`;
    return String(e.summary || e.title || 'Source-backed event.').slice(0, 220);
  }
  function eventCard(e){
    const cls = e.kind === 'war' ? 'red' : e.kind === 'terror' ? 'orange' : e.kind === 'disaster' ? 'yellow' : 'blue';
    return `<div class="info-card"><h3>${esc(plainEventTitle(e))}</h3><div class="quick-list"><div class="quick-item ${cls}"><b>Type:</b> ${esc(kindLabel[e.kind] || e.kind || 'Event')} | <b>Place:</b> ${esc(e.place || 'mapped area')}</div><div class="quick-item"><b>What happened:</b> ${esc(plainSummary(e))}</div></div><p class="action-line"><b>Assets:</b> ${(e.watch || []).map(esc).join(', ') || 'N/A'}</p>${isForeignText(e.title) ? `<p class="original-title"><b>Original title:</b> ${esc(e.title)}</p>` : ''}<p class="source-box">${sourceList(e.sources || [{ name:e.source, url:e.url }])}</p></div>`;
  }
  function eventList(events){
    return (events || []).map(eventCard).join('') || '<div class="warn">No source-backed events loaded in this category.</div>';
  }
  function wbVal(n, key, fmt){
    const x = n?.[key];
    if(!x || !hasNum(x.value)) return 'N/A';
    return fmt ? fmt(Number(x.value), x.year) : `${num(x.value)} (${x.year})`;
  }
  function nationalBlock(n){
    if(!n) return '';
    return `<div class="info-card"><h3>National data</h3><div class="metric-row"><span>Homicide</span><b>${wbVal(n,'homicide',(v,y)=>`${v.toFixed(2)} / 100k | ${y}`)}</b></div><div class="metric-row"><span>GDP/person</span><b>${wbVal(n,'gdpPerCapita',(v,y)=>`${money(v)} | ${y}`)}</b></div><div class="metric-row"><span>GDP growth</span><b>${wbVal(n,'gdpGrowth',(v,y)=>`${v.toFixed(2)}% | ${y}`)}</b></div><div class="metric-row"><span>Inflation</span><b>${wbVal(n,'inflation',(v,y)=>`${v.toFixed(2)}% | ${y}`)}</b></div><div class="metric-row"><span>Unemployment</span><b>${wbVal(n,'unemployment',(v,y)=>`${v.toFixed(2)}% | ${y}`)}</b></div><div class="metric-row"><span>Trade/GDP</span><b>${wbVal(n,'tradePctGdp',(v,y)=>`${v.toFixed(1)}% | ${y}`)}</b></div><div class="metric-row"><span>Population</span><b>${wbVal(n,'population',(v,y)=>`${num(v)} | ${y}`)}</b></div><p class="source-box">Source: World Bank Indicators API. Missing values show N/A.</p></div>`;
  }
  function routeControls(){
    return `<p class="plain">Routes are off by default.</p><div class="toggle-row"><label><input type="checkbox" id="seaToggle" ${window.SHOW_SEA ? 'checked' : ''}> Sea routes</label><label><input type="checkbox" id="landToggle" ${window.SHOW_LAND ? 'checked' : ''}> Land routes</label></div>`;
  }
  function riskLegend(){
    return `<div class="safety-key"><span class="risk-pill red">CONFLICT</span><span class="risk-pill orange">HIGH</span><span class="risk-pill yellow">WATCH</span><span class="risk-pill green">LOWER</span><span class="risk-pill grey">N/A</span></div>`;
  }
  function openPanel(name){
    const state = window.APP_STATE || {};
    if(name === 'crypto'){
      Panels.setDrawer('Crypto', `<p class="plain">Live crypto markets. Charts use recent source candles.</p>${marketTable(groupMarkets('crypto'))}<div id="cryptoCharts"></div>`, 'crypto');
      const k = state.klines || {};
      Charts.grid('cryptoCharts', ['BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT','BNBUSDT','ADAUSDT','DOGEUSDT'].map(x => ({ title:x, data:k[x] || [], y:'price' })));
      return;
    }
    if(name === 'commodities'){
      Panels.setDrawer('Commodities', `<p class="plain">Live or delayed source charts for oil, metals and related assets.</p>${marketTable(groupMarkets('commodity'))}<div id="commodityCharts"></div>`, 'commodities');
      const k = state.klines || {};
      Charts.grid('commodityCharts', ['HG=F','BZ=F','GC=F','SI=F','URA','USO'].map(x => ({ title:x, data:k[x] || [], y:'price' })));
      return;
    }
    if(name === 'polymarket') return Panels.setInfo('Polymarket', `<p class="plain">Live Polymarket feed only.</p>${(state.polymarket || []).slice(0, 45).map(p => `<div class="info-card"><h3>${esc(p.question)}</h3><div class="metric-row"><span>Volume</span><b>${num(p.volume)}</b></div><div class="metric-row"><span>Liquidity</span><b>${num(p.liquidity)}</b></div><p class="source-box"><a target="_blank" href="${esc(p.url || '#')}">open market</a></p></div>`).join('') || '<div class="warn">No Polymarket feed result.</div>'}`, 'polymarket');
    if(name === 'routes') return Panels.setInfo('Routes', `${routeControls()}<div class="route-list">${(window.ROUTES || []).map(r => `<div class="info-card route-chip" data-route="${esc(r.id)}"><h3>${esc(r.name)}</h3><div class="quick-list"><div class="quick-item"><b>Goods:</b> ${esc(r.goods)}</div><div class="quick-item"><b>Direction:</b> ${esc(r.direction || 'two-way')}</div><div class="quick-item"><b>Watch:</b> ${(r.watch || []).map(esc).join(', ') || 'N/A'}</div></div></div>`).join('')}</div>`, 'routes');
    if(name === 'layers') return Panels.setInfo('Safety map', `${riskLegend()}<p class="plain">Safety/conflict layers colour country polygons. Missing data shows N/A.</p><div class="toggle-row"><label><input checked data-layer="risk" type="checkbox"> Conflict countries</label><label><input id="safetyToggle" type="checkbox"> Safety colours</label><label><input checked data-layer="events" type="checkbox"> Event dots</label></div>`, 'layers');
    if(name === 'rapid'){
      Panels.setDrawer('Rapid movers', `<p class="plain">Measured moves from recent price candles only.</p>${(state.rapid || []).map((r,i) => `<div class="rapid-card"><h3>${esc(r.asset)} - ${esc(r.label)}</h3><div class="metric-row"><span>Short move</span><b>${esc(r.moveShort)}%</b></div><div class="metric-row"><span>Window move</span><b>${esc(r.moveWindow)}%</b></div><div class="metric-row"><span>Volatility</span><b>${esc(r.volatilityPct)}%</b></div><div class="metric-row"><span>Trend held</span><b>${esc(r.trendHeldPct)}%</b></div><div class="quick-list"><div class="quick-item"><b>Direction:</b> ${esc(r.direction)}</div><div class="quick-item"><b>Measured facts:</b> ${(r.reasons || []).map(esc).join(' | ')}</div><div class="quick-item yellow"><b>Note:</b> ${esc(r.warning || 'Recent measurements only.')}</div></div><div class="chart-box"><canvas id="rapidChart${i}"></canvas><p class="chart-note">x-axis: time | y-axis: actual recent price</p></div></div>`).join('') || '<div class="warn">No rapid movers with enough real chart data yet.</div>'}`, 'rapid');
      setTimeout(() => (state.rapid || []).forEach((r,i) => Charts.line(`rapidChart${i}`, r.priceSeries || [], r.asset, 'price')), 80);
    }
  }
  function renderLocalPlace(p){
    Panels.setInfo(p.name, `<div class="info-card"><h3>${esc(p.name)}</h3><div class="quick-list"><div class="quick-item"><b>Type:</b> ${esc(p.tags?.place || p.tags?.amenity || p.kind || 'local place')}</div><div class="quick-item"><b>Source:</b> ${esc(p.source || 'OpenStreetMap')}</div>${p.tags?.population ? `<div class="quick-item"><b>Population:</b> ${esc(p.tags.population)}</div>` : ''}</div></div>`, 'context');
  }
  function renderNode(n){
    Panels.setInfo(n.name, `<div class="info-card"><h3>${esc(n.name)}</h3><div class="quick-list"><div class="quick-item"><b>Type:</b> ${esc(kindLabel[n.kind] || n.kind)}</div><div class="quick-item"><b>Watch:</b> ${(n.watch || []).map(esc).join(', ') || 'N/A'}</div><div class="quick-item"><b>Source:</b> ${esc(n.source || 'mapped reference point')}</div></div></div>`, 'context');
  }
  function renderEvent(e){ Panels.setInfo(plainEventTitle(e), eventCard(e), e.kind); }
  function renderRoute(r){
    Panels.setInfo(r.name, `<div class="info-card"><h3>${esc(r.name)}</h3><div class="quick-list"><div class="quick-item"><b>Goods:</b> ${esc(r.goods)}</div><div class="quick-item"><b>Direction:</b> ${esc(r.direction || 'two-way')}</div><div class="quick-item"><b>Watch:</b> ${(r.watch || []).map(esc).join(', ') || 'N/A'}</div></div></div>`, 'routes');
  }
  function renderRiskRegion(r){
    Panels.setInfo(r.name, `<div class="info-card"><h3>${esc(r.name)}</h3><div class="quick-list"><div class="quick-item red"><b>Type:</b> ${esc(r.kind || 'risk')}</div><div class="quick-item"><b>Status:</b> ${esc(r.level || 'tracked')}</div><div class="quick-item"><b>Source:</b> ${esc((r.sources || []).join(', ') || r.source || 'N/A')}</div></div></div>`, 'layers');
  }
  function renderCountryConflict(c){
    const english = c.englishName || c.name;
    const local = c.localName && c.localName !== english ? c.localName : '';
    Panels.setInfo(english, `<div class="info-card country-card"><h3>${esc(english)}${local ? ` <span class="subtle">/ ${esc(local)}</span>` : ''}</h3><div class="quick-list"><div class="quick-item red"><b>Status:</b> ${esc(c.status || c.level || 'tracked')}</div><div class="quick-item"><b>Source:</b> ${esc(c.source || 'country polygon layer')}</div><div class="quick-item"><b>Watch:</b> ${(c.watch || []).map(esc).join(', ') || 'N/A'}</div></div><p class="source-box">Country polygon colouring. No frontline estimate.</p></div>`, 'layers');
  }
  function renderSafetyCountry(c){
    const english = c.englishName || c.name;
    const local = c.localName && c.localName !== english ? c.localName : '';
    Panels.setInfo(english, `<div class="info-card country-card"><h3>${esc(english)}${local ? ` <span class="subtle">/ ${esc(local)}</span>` : ''}</h3><div class="quick-list"><div class="quick-item ${riskClass(c.level)}"><b>Map colour:</b> ${esc(String(c.level || 'N/A').toUpperCase())}</div><div class="quick-item"><b>Source:</b> ${esc(c.source || 'N/A')}</div><div class="quick-item"><b>Crime feed:</b> ${esc(c.crimeFeed || 'N/A')}</div></div><p class="source-box">Click the map for indexes from available feeds.</p></div>`, 'layers');
  }
  function renderSafetyRegion(r){ Panels.setInfo(r.name, `<div class="info-card"><h3>${esc(r.name)}</h3><p>${esc(r.note || 'N/A')}</p></div>`, 'layers'); }
  function riskClass(level){
    const x = String(level || '').toLowerCase();
    if(['green','low','safer'].includes(x)) return 'green';
    if(['yellow','monitor','medium'].includes(x)) return 'yellow';
    if(['orange','high-risk'].includes(x)) return 'orange';
    return 'red';
  }
  function factsList(items){
    return (items || []).filter(Boolean).slice(0, 8).map(x => `<li>${esc(x)}</li>`).join('') || '<li>N/A</li>';
  }
  function renderContext(d){
    const place = d?.reverse?.place || 'Selected area';
    const country = d?.country?.englishName || d?.country?.name || 'Unknown country';
    const localCountry = d?.country?.localName || (d?.reverse?.address?.country && d.reverse.address.country !== country ? d.reverse.address.country : '');
    const events = (d.nearEvents || []).slice(0, 10);
    const countryEvents = (d.inCountryEvents || []).slice(0, 20);
    const nodes = (d.nearNodes || []).slice(0, 8);
    const cities = (d.nearCities || []).slice(0, 10);
    const idx = d.indexes || {};
    const conflictLine = d.conflict ? `${d.conflict.status || d.conflict.level || 'tracked'}: ${d.conflict.source || 'country polygon layer'}` : 'N/A';
    Panels.setInfo(country, `
      <div class="info-card country-card">
        <h3>${esc(country)}${localCountry ? ` <span class="subtle">/ ${esc(localCountry)}</span>` : ''}</h3>
        <p class="source-line">Clicked area: ${esc(place)}</p>
        <div class="index-grid real-indexes">
          ${indexTile('Safety', idx.hasRealSafety ? idx.safetyIndex : null, idx.source?.safety || 'N/A')}
          ${indexTile('Crime', idx.hasRealCrime ? idx.crimeIndex : null, idx.source?.crime || 'N/A')}
          ${indexTile('Money', idx.hasMoneyBasis ? idx.moneyIndex : null, idx.source?.money || 'N/A')}
        </div>
        <div class="data-proof">
          <h4>Data Used</h4>
          <div class="proof-cols">
            <div><b>Safety</b><ul>${factsList(idx.facts?.safety)}</ul></div>
            <div><b>Crime</b><ul>${factsList(idx.facts?.crime)}</ul></div>
            <div><b>Money</b><ul>${factsList(idx.facts?.money)}</ul></div>
          </div>
        </div>
        <div class="quick-list">
          <div class="quick-item"><b>Conflict:</b> ${esc(conflictLine)}</div>
          <div class="quick-item"><b>Events:</b> ${esc(countryEvents.length)} inside country | ${esc(events.length)} nearest</div>
          <div class="quick-item"><b>Nearby places:</b> ${cities.map(c => esc(c.name)).join(', ') || 'N/A'}</div>
        </div>
      </div>
      ${nationalBlock(d.national)}
      <div class="info-card"><h3>Nearby Events</h3>${eventList([...countryEvents, ...events].slice(0, 12))}</div>
      ${nodes.map(n => `<div class="info-card"><h3>${esc(n.name)}</h3><div class="quick-list"><div class="quick-item"><b>Type:</b> ${esc(kindLabel[n.kind] || n.kind)}</div><div class="quick-item"><b>Assets:</b> ${(n.watch || []).map(esc).join(', ') || 'N/A'}</div></div></div>`).join('')}
    `, 'context');
  }
  return { renderMarkets, openPanel, renderNode, renderLocalPlace, renderEvent, renderRoute, renderContext, renderRiskRegion, renderSafetyRegion, renderCountryConflict, renderSafetyCountry };
})();
