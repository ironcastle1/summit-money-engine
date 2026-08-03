import { escapeHtml } from '../ui/dom.js';
import { metric, riskBand } from './format.js';

export function renderCountryRows(root, records, selectedId) {
  if (!root) return;
  root.innerHTML = records.length ? records.map(item => {
    const score = item.metrics?.composite?.score;
    const confidence = item.metrics?.composite?.confidence;
    const selected = item.country.iso2 === selectedId ? ' selected' : '';
    return `<button class="intelligence-row${selected}" data-country-id="${escapeHtml(item.country.iso2)}" type="button"><span class="intelligence-risk band-${riskBand(score)}">${metric(score, 0)}</span><span class="intelligence-name"><strong>${escapeHtml(item.country.name)}</strong><small>${escapeHtml(item.country.capital || 'N/A')} / ${escapeHtml(item.country.iso2)}</small></span><span>${metric(item.metrics?.conflict?.score, 0)}</span><span>${metric(item.metrics?.disaster?.score, 0)}</span><span>${metric(confidence, 0)}</span></button>`;
  }).join('') : '<div class="intelligence-empty">0 RECORDS</div>';
}

export function renderCityRows(root, records, selectedId) {
  if (!root) return;
  root.innerHTML = records.length ? records.map(item => `<button class="intelligence-row${item.id === selectedId ? ' selected' : ''}" data-city-id="${escapeHtml(item.id)}" type="button"><span class="intelligence-risk band-na">N/A</span><span class="intelligence-name"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.country)} / ${escapeHtml(item.countryCode)}</small></span><span>${item.kind === 'capital' ? '1' : '0'}</span><span>${metric(item.lat, 1)}</span><span>${metric(item.lon, 1)}</span></button>`).join('') : '<div class="intelligence-empty">0 RECORDS</div>';
}
