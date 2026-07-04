import { getState, setState } from '../state/store.js';

const markerLayer = L.layerGroup();
const routeLayer = L.layerGroup();

function iconFor(type){
  return L.divIcon({ className:'', html:`<div class="marker ${type}"></div>`, iconSize:[20,20], iconAnchor:[10,10] });
}

function popup(node){
  return `<div class="node-popup">
    <h3>${node.label}</h3>
    <div class="thesis">${node.thesis}</div>
    <div class="assets">Watch: ${(node.assets||[]).join(', ')}</div>
    <div style="margin-top:8px;color:#7aa6b6">Themes: ${(node.themes||[]).join(' · ')}</div>
  </div>`;
}

export async function initMap(){
  const map = L.map('map', { zoomControl:true, worldCopyJump:true }).setView([24, 18], 3);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19
  }).addTo(map);
  markerLayer.addTo(map); routeLayer.addTo(map);
  setState({ map });
  const res = await fetch('/api/map/nodes');
  const data = await res.json();
  renderRoutes(data.routes);
  renderNodes(data.nodes);
}

export function renderNodes(nodes){
  const { activeFilter } = getState();
  markerLayer.clearLayers();
  for (const node of nodes) {
    if (activeFilter !== 'all' && node.type !== activeFilter) continue;
    L.marker([node.lat,node.lng], { icon: iconFor(node.type) }).bindPopup(popup(node)).addTo(markerLayer);
  }
}

export function renderRoutes(routes){
  routeLayer.clearLayers();
  for (const r of routes) {
    L.polyline(r.coords, { color:r.color || '#00d9ff', weight:2, opacity:.78, dashArray:r.type==='risk'?'8 8':'12 10' }).bindPopup(`<b>${r.label}</b><br>${r.type}`).addTo(routeLayer);
  }
}

export async function setFilter(filter){
  setState({ activeFilter: filter });
  document.querySelectorAll('.filter[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
  const data = await (await fetch('/api/map/nodes')).json();
  renderNodes(data.nodes);
}
