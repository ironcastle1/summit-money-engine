import { getState, setState } from '../state/store.js';

const markerLayer = L.layerGroup();
const eventLayer = L.layerGroup();
const routeLayer = L.layerGroup();
const arrowLayer = L.layerGroup();
let lastEventIds = new Set();
let mapData = { nodes: [], routes: [], eventDots: [] };
let routeMode = { shipping:true, land:true };
let alertEnabled = true;

function colourType(type){
  if (['war','risk'].includes(type)) return 'war';
  if (['shipping','port'].includes(type)) return 'shipping';
  if (['energy'].includes(type)) return 'energy';
  if (['commodity'].includes(type)) return 'commodity';
  if (['tech'].includes(type)) return 'tech';
  if (['disaster'].includes(type)) return 'disaster';
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
    o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.035;
    o.connect(g); g.connect(ctx.destination); o.start();
    setTimeout(()=>{ o.stop(); ctx.close(); }, 180);
  } catch {}
}
function popup(node){
  return `<div class="node-popup"><h3>${node.label}</h3><div>${node.thesis || 'Market node.'}</div><div class="assets">Watch: ${(node.assets||[]).join(', ')}</div></div>`;
}
function eventPopup(e){
  const src = (e.sources||[]).map(s=>`<span>${s}</span>`).join(' · ');
  const link = e.url && e.url !== '#' ? `<div class="src"><a target="_blank" href="${e.url}">source</a></div>` : '';
  return `<div class="node-popup"><h3>${e.title}</h3><div><b>${e.place}</b> · ${e.type}</div><div class="prob">Impact ${e.severity || 0}/100 · likelihood ${e.probability || 0}%</div><div class="assets">Watch: ${(e.assets||[]).join(', ')}</div><div class="src">${src}</div>${link}</div>`;
}
function midpoint(coords){
  const mid = coords[Math.floor(coords.length/2)] || coords[0];
  return mid;
}
function renderArrows(routes){
  arrowLayer.clearLayers();
  for (const r of routes) {
    const type = r.type === 'land' ? 'land' : 'shipping';
    if (type === 'shipping' && !routeMode.shipping) continue;
    if (type === 'land' && !routeMode.land) continue;
    const p = midpoint(r.coords);
    L.marker(p, { icon:L.divIcon({ className:'', html:`<div class="route-arrow ${type}">➜</div>`, iconSize:[28,28], iconAnchor:[14,14] }) }).addTo(arrowLayer);
  }
}
export async function initMap(){
  const bounds = [[-85,-180],[85,180]];
  const map = L.map('map', { zoomControl:true, worldCopyJump:false, minZoom:2, maxBounds:bounds, maxBoundsViscosity:1.0 }).setView([24, 18], 3);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19, noWrap:true, bounds
  }).addTo(map);
  markerLayer.addTo(map); eventLayer.addTo(map); routeLayer.addTo(map); arrowLayer.addTo(map);
  setState({ map });
  await reloadMapData(false);
}
export async function reloadMapData(alert=true){
  const res = await fetch('/api/map/nodes');
  mapData = await res.json();
  renderRoutes(mapData.routes || []);
  renderNodes(mapData.nodes || []);
  renderEvents(mapData.eventDots || [], alert);
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
  const nextIds = new Set(events.map(e=>e.id));
  const newEvents = events.filter(e => !lastEventIds.has(e.id) && e.fresh);
  eventLayer.clearLayers();
  for (const e of events) {
    const t = colourType(e.type);
    if (activeFilter !== 'all' && t !== activeFilter) continue;
    const extra = `${e.severity >= 70 ? 'high pulse' : 'news'} ${e.probability >= 55 ? 'probable' : ''} ${newEvents.some(n=>n.id===e.id)?'alert':''}`;
    L.marker([e.lat,e.lng], { icon: iconFor(t, extra) }).bindPopup(eventPopup(e)).addTo(eventLayer);
  }
  if (alert && newEvents.length) {
    document.body.classList.add('screen-alert');
    beep();
    setTimeout(()=>document.body.classList.remove('screen-alert'), 1200);
  }
  lastEventIds = nextIds;
}
export function renderRoutes(routes){
  routeLayer.clearLayers();
  for (const r of routes) {
    const type = r.type === 'land' ? 'land' : 'shipping';
    if (type === 'shipping' && !routeMode.shipping) continue;
    if (type === 'land' && !routeMode.land) continue;
    L.polyline(r.coords, { color:r.color || (type==='land'?'#f4d35e':'#00d9ff'), weight:3, opacity:.86, className:`trade-route ${type}-route` }).bindPopup(`<b>${r.label}</b><br>${type} route`).addTo(routeLayer);
  }
  renderArrows(routes);
}
export async function setFilter(filter){
  setState({ activeFilter: filter });
  document.querySelectorAll('.filter[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
  renderNodes(mapData.nodes || []);
  renderEvents(mapData.eventDots || [], false);
}
export function setRouteMode(kind, enabled){
  routeMode[kind] = enabled;
  renderRoutes(mapData.routes || []);
}
