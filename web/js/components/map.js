import { getState, setState } from '../state/store.js';

const markerLayer = L.layerGroup();
const eventLayer = L.layerGroup();
const localLayer = L.layerGroup();
const routeLayer = L.layerGroup();
const arrowLayer = L.layerGroup();
let lastEventIds = new Set();
let mapData = { nodes: [], routes: [], eventDots: [] };
let routeMode = { shipping:true, land:true };
let alertEnabled = true;
let mapRef;

function colourType(type){
  if (['war','risk'].includes(type)) return 'war';
  if (['shipping','port'].includes(type)) return 'shipping';
  if (['energy'].includes(type)) return 'energy';
  if (['commodity'].includes(type)) return 'commodity';
  if (['tech'].includes(type)) return 'tech';
  if (['disaster'].includes(type)) return 'disaster';
  if (['politics','election'].includes(type)) return 'politics';
  if (['local','trade'].includes(type)) return 'local';
  return type || 'market';
}
function iconFor(type, extra=''){
  const cls = `marker ${colourType(type)} ${extra}`;
  return L.divIcon({ className:'', html:`<div class="${cls}"></div>`, iconSize:[24,24], iconAnchor:[12,12] });
}
function beep(){
  if (!alertEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = 940; g.gain.value = 0.045;
    o.connect(g); g.connect(ctx.destination); o.start();
    setTimeout(()=>{ o.frequency.value = 520; }, 100);
    setTimeout(()=>{ o.stop(); ctx.close(); }, 230);
  } catch {}
}
function popup(node){
  return `<div class="node-popup"><h3>${node.label || node.title}</h3><div class="plain">${node.thesis || node.summary || 'Market location.'}</div><div class="assets">Watch: ${(node.assets||[]).join(', ')}</div></div>`;
}
function eventPopup(e){
  const src = (e.sources||[]).map(s=>`<span>${s}</span>`).join(' · ');
  const link = e.url && e.url !== '#' ? `<div class="src"><a target="_blank" href="${e.url}">open source</a></div>` : '';
  return `<div class="node-popup"><h3>${e.title}</h3><div class="plain"><b>${e.place}</b> · ${e.type}</div><div>${e.summary || ''}</div><div class="prob">Impact ${e.severity || 0}/100 · likelihood ${e.probability || 0}%</div><div class="assets">Watch: ${(e.assets||[]).join(', ')}</div><div class="src">${src}</div>${link}</div>`;
}
function midpoint(coords){ return coords[Math.floor(coords.length/2)] || coords[0]; }
function updateContextPanel(data){
  const el = document.getElementById('countryContext');
  if (!el || !data?.country) return;
  const c = data.country;
  const events = (data.events || []).slice(0,6).map(e=>`<li><b>${e.place}</b>: ${e.title}</li>`).join('');
  const nodes = (data.nodes || []).slice(0,5).map(n=>`<li>${n.label}: ${(n.assets||[]).slice(0,4).join(', ')}</li>`).join('');
  el.innerHTML = `<h3>${c.name}</h3><div>${c.summary}</div><ul class="context-list"><li><b>Watch:</b> ${(c.watch||[]).join(', ')}</li><li><b>Risks:</b> ${(c.risks||[]).join(', ')}</li></ul>${events?`<h3>Nearby events</h3><ul class="context-list">${events}</ul>`:''}${nodes?`<h3>Nearby market nodes</h3><ul class="context-list">${nodes}</ul>`:''}`;
}
async function loadContext(lat,lng){
  try {
    const r = await fetch(`/api/map/context?lat=${lat}&lng=${lng}`);
    updateContextPanel(await r.json());
    const root = document.getElementById('app');
    root.classList.remove('left-closed'); root.classList.add('left-open');
  } catch {}
}
function renderArrows(routes){
  arrowLayer.clearLayers();
  for (const r of routes) {
    const type = r.type === 'land' ? 'land' : 'shipping';
    if (type === 'shipping' && !routeMode.shipping) continue;
    if (type === 'land' && !routeMode.land) continue;
    const coords = r.coords || [];
    for (let i=1;i<coords.length;i+=2) {
      const p = coords[i];
      L.marker(p, { icon:L.divIcon({ className:'', html:`<div class="route-arrow ${type}">➜</div>`, iconSize:[28,28], iconAnchor:[14,14] }) }).addTo(arrowLayer);
    }
  }
}
export async function initMap(){
  const bounds = [[-65,-178],[73,178]];
  const map = L.map('map', {
    zoomControl:true,
    worldCopyJump:false,
    minZoom:3,
    maxZoom:18,
    maxBounds:bounds,
    maxBoundsViscosity:1.0,
    preferCanvas:true
  }).setView([24, 18], 3);
  mapRef = map;
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19, noWrap:true, bounds
  }).addTo(map);
  markerLayer.addTo(map); eventLayer.addTo(map); localLayer.addTo(map); routeLayer.addTo(map); arrowLayer.addTo(map);
  map.on('click', e => loadContext(e.latlng.lat, e.latlng.lng));
  map.on('zoomend moveend', () => { renderLocalEvents(mapData.eventDots || []); setTimeout(()=>map.invalidateSize(), 80); });
  setState({ map });
  window.addEventListener('resize', () => setTimeout(()=>map.invalidateSize(), 80));
  await reloadMapData(false);
  setTimeout(()=>map.invalidateSize(), 250);
}
export async function reloadMapData(alert=true){
  const res = await fetch('/api/map/nodes');
  mapData = await res.json();
  renderRoutes(mapData.routes || []);
  renderNodes(mapData.nodes || []);
  renderEvents(mapData.eventDots || [], alert);
  renderLocalEvents(mapData.eventDots || []);
  mapRef?.invalidateSize();
}
export function renderNodes(nodes){
  const { activeFilter = 'all' } = getState();
  markerLayer.clearLayers();
  for (const node of nodes) {
    if (activeFilter !== 'all' && colourType(node.type) !== activeFilter && node.type !== activeFilter) continue;
    L.marker([node.lat,node.lng], { icon: iconFor(node.type) }).bindPopup(popup(node)).addTo(markerLayer);
  }
}
export function renderEvents(events, alert=true){
  const { activeFilter = 'all' } = getState();
  const nonLocal = events.filter(e => !e.local);
  const nextIds = new Set(nonLocal.map(e=>e.id));
  const newEvents = nonLocal.filter(e => !lastEventIds.has(e.id) && e.fresh);
  eventLayer.clearLayers();
  for (const e of nonLocal) {
    const t = colourType(e.type);
    if (activeFilter !== 'all' && t !== activeFilter) continue;
    const extra = `${e.severity >= 70 ? 'high pulse' : 'news'} ${e.probability >= 55 ? 'probable' : ''} ${newEvents.some(n=>n.id===e.id)?'alert':''}`;
    L.marker([e.lat,e.lng], { icon: iconFor(t, extra) }).bindPopup(eventPopup(e)).addTo(eventLayer);
  }
  if (alert && newEvents.length) {
    document.body.classList.add('screen-alert');
    beep();
    setTimeout(()=>document.body.classList.remove('screen-alert'), 1300);
  }
  lastEventIds = nextIds;
}
function renderLocalEvents(events){
  const { activeFilter = 'all' } = getState();
  localLayer.clearLayers();
  const z = mapRef?.getZoom() || 3;
  if (z < 5 && activeFilter !== 'local') return;
  const locals = events.filter(e => e.local).slice(0,200);
  for (const e of locals) {
    const t = colourType(e.type);
    if (activeFilter !== 'all' && activeFilter !== 'local' && t !== activeFilter) continue;
    L.marker([e.lat,e.lng], { icon: iconFor(e.type, 'local') }).bindPopup(eventPopup(e)).addTo(localLayer);
  }
}
export function renderRoutes(routes){
  routeLayer.clearLayers();
  for (const r of routes) {
    const type = r.type === 'land' ? 'land' : 'shipping';
    if (type === 'shipping' && !routeMode.shipping) continue;
    if (type === 'land' && !routeMode.land) continue;
    L.polyline(r.coords, { color:r.color || (type==='land'?'#f4d35e':'#00d9ff'), weight:4, opacity:.88, className:`trade-route ${type}-route` }).bindPopup(`<b>${r.label}</b><br>${type === 'land' ? 'Land corridor' : 'Sea route'}`).addTo(routeLayer);
  }
  renderArrows(routes);
}
export async function setFilter(filter){
  setState({ activeFilter: filter });
  document.querySelectorAll('.filter[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
  renderNodes(mapData.nodes || []);
  renderEvents(mapData.eventDots || [], false);
  renderLocalEvents(mapData.eventDots || []);
}
export function setRouteMode(kind, enabled){
  routeMode[kind] = enabled;
  renderRoutes(mapData.routes || []);
}
