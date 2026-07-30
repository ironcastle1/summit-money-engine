import { escapeHtml } from '../ui/dom.js';
import { number, age } from '../ui/format.js';

function metric(label, value, suffix = '') { return `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(suffix)}</small></article>`; }
function value(input, digits = 1) { return Number.isFinite(input) ? number(input, digits) : 'N/A'; }
function evidenceList(items = []) { return items.slice(0, 8).map(item => `<li><b>${escapeHtml(item.title || item.id)}</b><span>${value(item.contribution, 1)}</span><small>${Number.isFinite(item.distanceKm) ? `${value(item.distanceKm, 0)} KM` : age(item.latestAt || item.timestamp)}</small></li>`).join(''); }

export function renderShippingDetail(root, selection) {
  if (!selection) { root.innerHTML = '<div class="shipping-detail-empty"><strong>NO SELECTION</strong><small>SELECT PORT / CHOKEPOINT / ROUTE / COMMODITY</small></div>'; return; }
  const risk = selection.risk || {};
  const coordinates = selection.coordinates ? `${selection.coordinates.lat.toFixed(3)}, ${selection.coordinates.lon.toFixed(3)}` : selection.lengthKm ? `${number(selection.lengthKm)} KM` : '';
  const operational = selection.signals?.operational || {};
  const congestion = selection.congestion || {};
  root.innerHTML = `
    <header class="shipping-detail-header"><small>${escapeHtml((selection.kind || selection.type || 'NETWORK').toUpperCase())}</small><h2>${escapeHtml(selection.name || selection.commodity?.name || selection.id)}</h2><span>${escapeHtml(coordinates)}</span></header>
    <section class="shipping-detail-metrics">
      ${metric('RISK', value(risk.score ?? selection.supplyRisk), risk.band || '0–100')}
      ${metric('CONFIDENCE', value(risk.confidence), `N=${risk.evidenceCount ?? selection.evidenceCount ?? 0}`)}
      ${metric('EVENT', value(selection.signals?.event?.score), `${selection.signals?.event?.count || selection.eventCount || 0} RECORDS`)}
      ${metric('NEWS', value(selection.signals?.news?.score), `${selection.signals?.news?.count || 0} STORIES`)}
      ${metric('OPERATIONS', value(operational.score), `N=${operational.sampleSize || 0}`)}
      ${metric('CONGESTION', value(congestion.index), Number.isFinite(congestion.confidence) ? `${value(congestion.confidence)} CONF` : 'N/A')}
      ${metric('IMPORTANCE', value(selection.importance, 0), '0–100')}
      ${metric('ROUTES', String(selection.routeIds?.length ?? selection.routeCount ?? selection.connectedRoutes?.length ?? 0), '')}
    </section>
    <section class="shipping-detail-block"><div><span>COMMODITIES</span><b>${escapeHtml((selection.commodities || selection.commodity?.keywords || []).join(' / ').toUpperCase() || 'N/A')}</b></div><div><span>REGION</span><b>${escapeHtml((selection.region || selection.country || selection.class || 'N/A').toUpperCase())}</b></div></section>
    <section class="shipping-evidence"><header><span>EVENT EVIDENCE</span><b>${selection.signals?.event?.evidence?.length || selection.evidence?.events?.length || 0}</b></header><ol>${evidenceList(selection.signals?.event?.evidence || selection.evidence?.events)}</ol></section>
    <section class="shipping-evidence"><header><span>NEWS EVIDENCE</span><b>${selection.signals?.news?.evidence?.length || selection.evidence?.news?.length || 0}</b></header><ol>${evidenceList(selection.signals?.news?.evidence || selection.evidence?.news)}</ol></section>`;
}
