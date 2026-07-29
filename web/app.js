(function(){
  const state = {
    map: null,
    layers: {},
    dotsOn: true,
    topo: false,
    markets: [],
    events: [],
    scanCircle: null,
    routeLine: null,
    saved: JSON.parse(localStorage.getItem('summit-saved-leads') || '[]')
  };

  const ICON = {
    'market-moving': '£',
    'online-opportunity': '+',
    movement: '↔',
    security: '!',
    conflict: '!',
    crisis: '●',
    policy: '§',
    general: '•',
    hospital: 'H',
    clinic: 'C',
    pharmacy: '+',
    police: 'P',
    fire: 'F',
    embassy: 'E',
    airport: '✈',
    fuel: '⛽',
    border: 'B',
    port: '⚓',
    rail: 'R',
    'main road': 'M',
    communications: '☊',
    power: '⚡',
    shelter: 'S',
    water: 'W',
    food: 'F',
    money: '£'
  };

  const COLOR = {
    'market-moving': '#ffd94a',
    'online-opportunity': '#00ff91',
    movement: '#00d8ff',
    security: '#ff215a',
    conflict: '#ff215a',
    crisis: '#ffffff',
    policy: '#b24cff',
    general: '#7aa7ff'
  };

  function $(id){ return document.getElementById(id); }
  function html(v){ return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  async function get(url){ const r = await fetch(url); if(!r.ok) throw new Error(await r.text()); return r.json(); }
  async function post(url, data){ const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); if(!r.ok) throw new Error(await r.text()); return r.json(); }

  function init(){
    initMap();
    bind();
    renderLegend();
    renderSaved();
    loadMarkets();
    loadEvents();
    openPanel('brief');
    setInterval(loadMarkets, 180000);
    setInterval(loadEvents, 240000);
  }

  function initMap(){
    state.map = L.map('map', { worldCopyJump:false, minZoom:2, maxZoom:18, zoomControl:true }).setView([26, 18], 3);
    state.layers.base = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains:'abcd', attribution:'© OpenStreetMap © CARTO', keepBuffer:4 }).addTo(state.map);
    state.layers.events = L.layerGroup().addTo(state.map);
    state.layers.infra = L.layerGroup().addTo(state.map);
    state.layers.scan = L.layerGroup().addTo(state.map);
    state.map.on('click', async e => {
      await runScan({ lat:e.latlng.lat, lng:e.latlng.lng, radiusMiles:Number($('radiusMiles').value || 5), query:'clicked point' });
    });
    setTimeout(() => state.map.invalidateSize(), 300);
  }

  function bind(){
    document.querySelectorAll('[data-panel]').forEach(btn => btn.addEventListener('click', () => openPanel(btn.dataset.panel)));
    $('closePanel').onclick = () => document.querySelector('.left-panel').style.display = 'none';
    $('scanBtn').onclick = () => runScanFromSearch();
    $('mainSearch').addEventListener('keydown', e => { if(e.key === 'Enter') { e.preventDefault(); runScanFromSearch(); } });
    $('radiusMiles').addEventListener('keydown', e => { if(e.key === 'Enter') { e.preventDefault(); runScanFromSearch(); } });
    $('signalFilter').onchange = renderEventDots;
    $('homeBtn').onclick = () => state.map.setView([26,18],3);
    $('dotsBtn').onclick = () => { state.dotsOn = !state.dotsOn; $('dotsBtn').textContent = state.dotsOn ? 'DOTS' : 'DOTS OFF'; renderEventDots(); };
    $('topoBtn').onclick = () => { state.topo = !state.topo; document.body.classList.toggle('topo', state.topo); };
    $('refreshBtn').onclick = () => { loadMarkets(true); loadEvents(true); openPanel('brief'); };
    document.addEventListener('click', e => { const btn = e.target.closest('.save-lead'); if(btn) saveLead(btn.dataset.id, btn.dataset.title); });
    $('language').onchange = () => showToast('Language selected. Core app labels remain stable while source content stays in source language unless translated by the source.');
  }

  async function loadMarkets(){
    try{
      const data = await get('/api/markets');
      state.markets = data.markets || [];
      renderTicker();
    }catch{ $('ticker').textContent = 'market feed not loaded'; }
  }

  async function loadEvents(){
    try{
      const data = await get('/api/events');
      state.events = data.events || [];
      renderEventDots();
      const first = state.events.find(e => ['market-moving','security','movement','policy','conflict'].includes(e.category));
      if(first) showLiveAlert(first);
    }catch{}
  }

  function renderTicker(){
    if(!state.markets.length){ $('ticker').textContent = 'No live market data'; return; }
    $('ticker').innerHTML = state.markets.slice(0,9).map(m => {
      const ch = Number(m.changePct || 0);
      const cls = ch >= 0 ? 'up' : 'down';
      const arrow = ch >= 0 ? '▲' : '▼';
      return `<span class="${cls}">${html(m.id)} ${arrow} ${Math.abs(ch).toFixed(2)}%</span>`;
    }).join(' &nbsp; ');
  }

  function markerIcon(kind){
    const cls = kind || 'general';
    return L.divIcon({ className:'', html:`<span class="symbol event ${html(cls)}" style="background:${COLOR[cls] || COLOR.general}">${html(ICON[cls] || '•')}</span>`, iconSize:[22,22], iconAnchor:[11,11] });
  }

  function infraIcon(kind){
    return L.divIcon({ className:'', html:`<span class="symbol ${html(kind)}">${html(ICON[kind] || '•')}</span>`, iconSize:[22,22], iconAnchor:[11,11] });
  }

  function renderEventDots(){
    state.layers.events.clearLayers();
    if(!state.dotsOn) return;
    const filter = $('signalFilter').value;
    for(const e of state.events){
      if(filter && e.category !== filter) continue;
      if(!Number.isFinite(Number(e.lat)) || !Number.isFinite(Number(e.lng))) continue;
      L.marker([e.lat,e.lng], { icon: markerIcon(e.category) }).on('click', () => renderEventCard(e)).addTo(state.layers.events);
    }
  }

  function renderLegend(){
    const items = [
      ['Market-moving', '£', COLOR['market-moving']], ['Online lead', '+', COLOR['online-opportunity']], ['Movement', '↔', COLOR.movement], ['Security', '!', COLOR.security], ['Policy', '§', COLOR.policy], ['Crisis', '●', '#fff'], ['Hospital', 'H', '#00ff91'], ['Pharmacy', '+', '#00ff91'], ['Police', 'P', '#15b8ff'], ['Airport', '✈', '#00d8ff'], ['Fuel', '⛽', '#ff4d6d'], ['Rail', 'R', '#00d8ff'], ['Main road', 'M', '#00d8ff']
    ];
    $('legend').innerHTML = '<button id="miniLegend">MINIMISE</button> ' + items.map(x => `<span><i style="background:${x[2]}"></i>${html(x[1])} ${html(x[0])}</span>`).join('');
    $('miniLegend').onclick = () => { $('legend').innerHTML = '<button onclick="location.reload()">KEY</button>'; };
  }

  function panel(title, body){
    document.querySelector('.left-panel').style.display = '';
    $('panelTitle').textContent = title;
    $('panelBody').innerHTML = body;
  }

  async function openPanel(name){
    if(name === 'brief') return renderBrief();
    if(name === 'opportunities') return renderOpportunities();
    if(name === 'trends') return renderTrends();
    if(name === 'markets') return renderMarketsPanel();
    if(name === 'playbooks') return renderPlaybooks();
    if(name === 'route') return renderRoutePanel();
    if(name === 'sources') return renderSources();
    if(name === 'map') return panel('Map', '<div class="card"><h2>Map use</h2><p>Search a place, press SCAN, then use the map symbols, nearby signals and information angles.</p></div>');
  }

  async function renderBrief(){
    panel('Daily Brief', '<div class="card"><h2>Loading...</h2><p>Compiling useful signals from public feeds.</p></div>');
    try{
      const b = await get('/api/brief');
      panel('Daily Brief', `
        <div class="card"><h2>Today’s information edge</h2>${b.summary.map(x=>`<p>${html(x)}</p>`).join('')}</div>
        <div class="card"><h2>Do first</h2>${b.whatToDoFirst.map(x=>`<div class="metric"><b>${html(x.title)}</b><span>${html(x.action)}</span></div>`).join('')}</div>
        <div class="card"><h2>Best opportunities</h2>${b.opportunities.slice(0,8).map(opportunityHtml).join('')}</div>
      `);
    }catch(e){ panel('Daily Brief', `<div class="card"><h2>Failed</h2><p>${html(e.message)}</p></div>`); }
  }

  async function renderOpportunities(){
    panel('Opportunities', '<div class="card"><h2>Loading...</h2></div>');
    const data = await get('/api/opportunities');
    panel('Opportunities', `
      <div class="card"><h2>Make the subscription back</h2><p>Find one useful signal, turn it into a brief, lead list, checklist, market note, content post or small paid research/service offer.</p></div>
      ${data.opportunities.slice(0,25).map(opportunityHtml).join('')}
    `);
  }

  function opportunityHtml(o){
    return `<div class="card">
      <div class="badge-row"><span class="badge green">${html(o.category)}</span><span class="badge">score ${html(o.score)}</span><span class="badge">${html(o.age)}</span></div>
      <h3>${html(o.title)}</h3>
      <p>${html(o.whyItMatters)}</p>
      <ol class="actions">${(o.actions||[]).map(a=>`<li>${html(a)}</li>`).join('')}</ol>
      <p class="meta">${html(o.source)} | ${html(o.confidence)}</p>
      <button class="lead-btn save-lead" data-id="${html(o.id)}" data-title="${html(o.title)}">SAVE LEAD</button>
      ${o.link ? `<a class="lead-btn" target="_blank" rel="noopener" href="${html(o.link)}">OPEN SOURCE</a>` : ''}
    </div>`;
  }

  async function renderTrends(){
    panel('Trend Streams', '<div class="card"><h2>Loading streams...</h2></div>');
    const data = await get('/api/trends');
    panel('Trend Streams', data.streams.map(s => `<div class="card"><h2>${html(s.category)} <span class="meta">${s.count} signals</span></h2>${s.items.slice(0,5).map(opportunityHtml).join('')}</div>`).join(''));
  }


  async function renderPlaybooks(){
    const q = $('mainSearch').value.trim();
    panel('Playbooks', '<div class="card"><h2>Loading playbooks...</h2></div>');
    const data = await get('/api/playbooks?q=' + encodeURIComponent(q) + '&limit=80');
    panel('Playbooks', `<div class="card"><h2>Information-to-money playbooks</h2><p>These are practical ways to turn source-backed information into briefs, lead lists, checklists, route notes, market watchlists or client research. Search box filters this library.</p></div>${(data.playbooks||[]).map(p => `<div class="card"><div class="badge-row"><span class="badge green">${html(p.region)}</span><span class="badge">${html(p.sector)}</span><span class="badge">${html(p.deliverable)}</span></div><h3>${html(p.name)}</h3><p><b>Trigger:</b> ${html(p.trigger)}</p><p><b>Buyer:</b> ${html(p.buyer)}</p><p><b>How to use:</b> ${html(p.howToUse)}</p><p><b>Money angle:</b> ${html(p.moneyAngle)}</p><p class="meta">${html(p.qualityRule)}</p></div>`).join('')}`);
  }

  function renderMarketsPanel(){
    panel('Market Impact', `<div class="card"><h2>Loaded markets</h2><p>Use this as a watch list, not a buy/sell signal.</p></div>${state.markets.map(m => `<div class="card"><h3>${html(m.name || m.id)}</h3><div class="badge-row"><span class="badge ${Number(m.changePct)>=0?'green':'red'}">${Number(m.changePct||0).toFixed(2)}%</span><span class="badge">${html(m.source)}</span></div><p>Price: ${html(Number(m.price).toLocaleString('en-GB'))}</p></div>`).join('')}`);
  }

  function renderRoutePanel(){
    panel('Route Check', `<div class="card"><h2>Route check</h2><div class="route-form"><input id="routeFrom" placeholder="From"><input id="routeTo" placeholder="To"><button id="routeRun" class="primary">CHECK ROUTE</button></div><div id="routeOut"></div></div>`);
    $('routeRun').onclick = async () => {
      $('routeOut').innerHTML = '<p>Checking route...</p>';
      const data = await post('/api/route-check', { from:$('routeFrom').value, to:$('routeTo').value, radiusMiles:Number($('radiusMiles').value || 5) });
      if(!data.ok){ $('routeOut').innerHTML = `<p>${html(data.error)}</p>`; return; }
      drawRoute(data.routeLine);
      $('routeOut').innerHTML = `<div class="metric"><span>Verdict</span><b>${html(data.verdict)}</b></div><div class="metric"><span>Risk</span><b>${html(data.riskPct)}%</b></div><div class="metric"><span>Distance</span><b>${html(data.distanceMiles)} miles direct</b></div><ol class="actions">${data.checks.map(c=>`<li>${html(c)}</li>`).join('')}</ol>`;
    };
  }

  async function renderSources(){
    const data = await get('/api/sources');
    panel('Sources', `<div class="card"><h2>Source health</h2><p>Shows what actually loaded. Failed source means no claim should rely on it.</p></div>${(data.sources||[]).map(s=>`<div class="metric"><span>${html(s.name)}</span><b>${html(s.status)}</b><span>${html(s.detail||'')}</span></div>`).join('')}`);
  }

  async function runScanFromSearch(){
    const query = $('mainSearch').value.trim();
    if(!query){ showToast('Type a place first.'); return; }
    await runScan({ query, radiusMiles:Number($('radiusMiles').value || 5) });
  }

  async function runScan(payload){
    panel('Area Scan', '<div class="card"><h2>Scanning...</h2><p>Loading place, events, infrastructure, local crime where available and information angles.</p></div>');
    try{
      const data = await post('/api/area-scan', payload);
      if(!data.ok){ panel('Area Scan', `<div class="card"><h2>No result</h2><p>${html(data.error)}</p></div>`); return; }
      drawScan(data);
      renderScan(data);
    }catch(e){ panel('Area Scan', `<div class="card"><h2>Scan failed</h2><p>${html(e.message)}</p></div>`); }
  }

  function drawScan(data){
    state.layers.scan.clearLayers();
    state.layers.infra.clearLayers();
    const p = data.place;
    if(!p) return;
    state.map.setView([p.lat,p.lng], Math.max(12, state.map.getZoom()));
    state.scanCircle = L.circle([p.lat,p.lng], { radius:data.radiusMiles * 1609.344, color:'#00eaff', fillColor:'#00eaff', fillOpacity:0.12, weight:2 }).addTo(state.layers.scan);
    for(const i of data.infrastructure || []){
      L.marker([i.lat,i.lng], { icon: infraIcon(i.kind) }).on('click', () => panel('Infrastructure', `<div class="card"><h2>${html(i.name)}</h2><p>${html(i.kind)} | ${html(i.distanceMiles)} miles</p><p class="meta">${html(i.source)}</p></div>`)).addTo(state.layers.infra);
    }
  }

  function renderScan(data){
    const s = data.score || {};
    panel('Area Scan', `
      <div class="card">${data.wiki && data.wiki.image ? `<img class="wiki-img" src="${html(data.wiki.image)}">` : ''}<h2>${html(data.place.displayName || data.place.name || 'Selected area')}</h2><p>${html(data.radiusMiles)} mile radius. Data is public-source based. Local crime appears only where an official local source exists.</p></div>
      <div class="card"><h2>${html(s.verdict || 'Review')}</h2><div class="grid2"><div class="metric"><span>Clear</span><b>${html(s.safePct)}%</b></div><div class="metric"><span>Risk</span><b>${html(s.riskPct)}%</b></div></div><p class="meta">Basis: ${html(s.basis)}</p></div>
      <div class="card"><h2>Checklist</h2>${(data.checklist||[]).map(c=>`<div class="metric"><span>${html(c.item)}</span><b>${html(c.status)}</b></div>`).join('')}</div>
      <div class="card"><h2>Information money angles</h2>${(data.ideas||[]).map(i=>`<div class="metric"><span>${html(i.name)}</span><b>${html(i.value)}</b><span>${html(i.action)}</span></div>`).join('')}</div>
      <div class="card"><h2>Live signals inside radius</h2>${(data.eventsInside||[]).length ? data.eventsInside.map(e=>`<div class="metric"><b>${html(e.title)}</b><span>${html(e.category)} | ${html(e.domain)} | ${html(e.distanceMiles && e.distanceMiles.toFixed ? e.distanceMiles.toFixed(1) : e.distanceMiles)} miles</span></div>`).join('') : '<p>No mapped event dots inside this radius from loaded feeds.</p>'}</div>
    `);
  }

  function drawRoute(line){
    if(state.routeLine) state.layers.scan.removeLayer(state.routeLine);
    state.routeLine = L.polyline(line, { color:'#00ff91', weight:4, dashArray:'8,8' }).addTo(state.layers.scan);
    state.map.fitBounds(state.routeLine.getBounds(), { padding:[40,40] });
  }

  function renderEventCard(e){
    panel('Signal', `<div class="card"><h2>${html(e.title)}</h2><div class="badge-row"><span class="badge green">${html(e.category)}</span><span class="badge">${html(e.domain)}</span></div><p>${html(e.description)}</p><p>${html(e.opportunity)}</p><p class="meta">${html(e.sourceSystem)} | ${html(e.pubDate || 'date unknown')}</p>${e.link?`<a target="_blank" rel="noopener" href="${html(e.link)}">Open source</a>`:''}</div>`);
  }

  function showLiveAlert(e){
    const t = $('toast');
    t.innerHTML = `<button class="x">×</button><b>Useful signal</b><p>${html(e.title)}</p><button id="openAlert">Open</button>`;
    t.classList.add('show');
    t.querySelector('.x').onclick = () => t.classList.remove('show');
    t.querySelector('#openAlert').onclick = () => { renderEventCard(e); t.classList.remove('show'); };
    setTimeout(() => t.classList.remove('show'), 14000);
  }

  function showToast(text){
    const t = $('toast');
    t.innerHTML = `<button class="x">×</button><p>${html(text)}</p>`;
    t.classList.add('show');
    t.querySelector('.x').onclick = () => t.classList.remove('show');
    setTimeout(() => t.classList.remove('show'), 9000);
  }

  function saveLead(id, title){
    if(!state.saved.some(x => x.id === id)) state.saved.push({ id, title, at:new Date().toISOString() });
    localStorage.setItem('summit-saved-leads', JSON.stringify(state.saved));
    renderSaved();
    showToast('Lead saved.');
  }

  function renderSaved(){
    $('savedBox').innerHTML = `<h2>Saved leads</h2>${state.saved.length ? state.saved.slice(-6).reverse().map(s=>`<div class="metric"><b>${html(s.title)}</b></div>`).join('') : '<p>No saved leads yet.</p>'}`;
  }

  window.Summit = { saveLead };
  document.addEventListener('DOMContentLoaded', init);
})();
