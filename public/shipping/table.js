import { escapeHtml } from '../ui/dom.js';
import { number } from '../ui/format.js';

function risk(value) { return Number.isFinite(value) ? number(value, 1) : 'N/A'; }
function row(type, item, selectedId) {
  const selected = item.id === selectedId ? ' selected' : '';
  const score = item.risk?.score ?? item.supplyRisk;
  const band = item.risk?.band || (Number.isFinite(score) ? (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'ELEVATED' : score >= 20 ? 'GUARDED' : 'LOW') : 'N/A');
  const secondary = type === 'ports' ? `${item.countryCode} / ${item.type}` : type === 'chokepoints' ? `${item.routeIds?.length || 0} ROUTES` : type === 'routes' ? `${item.lengthKm || 0} KM` : `${item.routeCount || 0}R / ${item.chokepointCount || 0}C`;
  const evidence = item.risk?.evidenceCount ?? item.evidenceCount ?? 0;
  return `<button class="shipping-row${selected}" type="button" data-shipping-type="${type}" data-shipping-id="${escapeHtml(item.id)}"><span class="risk-chip band-${band.toLowerCase()}">${risk(score)}</span><span class="shipping-row-name"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(secondary.toUpperCase())}</small></span><span>${evidence}</span><span>${escapeHtml(band)}</span></button>`;
}

export function renderShippingTable(root, type, snapshot, selectedId) {
  const collection = snapshot?.[type] || [];
  root.innerHTML = collection.length ? collection.map(item => row(type, item, selectedId)).join('') : '<div class="shipping-empty">0 RECORDS</div>';
}
