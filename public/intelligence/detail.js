import { escapeHtml } from '../ui/dom.js';
import { metric, riskBand, dateValue } from './format.js';

function sourceRows(sources = {}) {
  return Object.values(sources).map(source => `<div><span>${escapeHtml(source.name || source.id)}</span><b>${escapeHtml(source.state)}</b><small>${source.recordCount ?? 0}</small></div>`).join('');
}
function indicatorRows(indicators = {}) {
  return Object.entries(indicators).filter(([, item]) => item).map(([key, item]) => `<div><span>${escapeHtml(key.replace(/[A-Z]/g, value => ` ${value}`).toUpperCase())}</span><b>${metric(item.value, 2)}</b><small>${item.year || 'N/A'}</small></div>`).join('');
}
function eventRows(events = []) { return events.slice(0, 12).map(event => `<div class="intelligence-evidence"><span class="band-${riskBand(Number(event.severity || 0) * 20)}">${metric(Number(event.severity || 0) * 20, 0)}</span><p><b>${escapeHtml(event.title)}</b><small>${escapeHtml(event.category.toUpperCase())} / ${dateValue(event.time)}</small></p></div>`).join(''); }
function storyRows(stories = []) { return stories.slice(0, 10).map(story => `<div class="intelligence-evidence"><span>${metric(story.verification?.score, 0)}</span><p><b>${escapeHtml(story.title)}</b><small>${story.sourceCount || story.articleIds?.length || 0} SRC / ${metric(story.velocity?.score, 0)}</small></p></div>`).join(''); }
function crimeRows(crime) { return (crime?.categories || []).slice(0, 10).map(item => `<div><span>${escapeHtml(item.id.toUpperCase())}</span><b>${item.count}</b><small>${metric(item.sharePct, 1, '%')}</small></div>`).join(''); }

export function renderIntelligenceDetail(root, payload) {
  if (!root) return;
  if (!payload) { root.innerHTML = '<div class="intelligence-detail-empty"><strong>N/A</strong><small>COUNTRY / CITY</small></div>'; return; }
  const entity = payload.country && payload.city ? payload.city : payload.city || payload.country || payload.nearestCity || {};
  const country = payload.country || {};
  const metrics = payload.metrics || {};
  const score = metrics.composite?.score;
  const indicators = payload.indicators?.indicators || metrics.economic?.indicators || {};
  const nextElection = metrics.elections?.next;
  root.innerHTML = `<header class="intelligence-detail-header"><div><small>${escapeHtml(entity.countryCode || country.iso2 || '')}</small><h1>${escapeHtml(entity.name || country.name || 'N/A')}</h1><p>${escapeHtml(country.capital || entity.country || '')}</p></div><span class="intelligence-score band-${riskBand(score)}">${metric(score, 0)}</span></header>
  <section class="intelligence-detail-metrics">
    <article><span>CONFLICT</span><strong>${metric(metrics.conflict?.score, 0)}</strong><small>${metrics.conflict?.count ?? 0} N</small></article>
    <article><span>DISASTER</span><strong>${metric(metrics.disaster?.score, 0)}</strong><small>${metrics.disaster?.count ?? 0} N</small></article>
    <article><span>CRIME</span><strong>${metric(metrics.crime?.score, 0)}</strong><small>${metrics.crime?.count ?? 'N/A'} N</small></article>
    <article><span>ELECTION</span><strong>${metric(metrics.elections?.proximityScore, 0)}</strong><small>${nextElection?.daysUntil ?? 'N/A'} D</small></article>
    <article><span>ECON STRESS</span><strong>${metric(metrics.economic?.stressScore, 0)}</strong><small>0–100</small></article>
    <article><span>CONFIDENCE</span><strong>${metric(metrics.composite?.confidence, 0)}</strong><small>${metric(metrics.composite?.coveragePct, 0, '%')}</small></article>
  </section>
  <section class="intelligence-detail-section"><header><span>INDICATORS</span><b>VALUE / YEAR</b></header><div class="intelligence-key-values">${indicatorRows(indicators) || '<div><span>N/A</span><b>N/A</b><small>N/A</small></div>'}</div></section>
  <section class="intelligence-detail-section"><header><span>CRIME</span><b>COUNT / SHARE</b></header><div class="intelligence-key-values">${crimeRows(metrics.crime) || '<div><span>N/A</span><b>N/A</b><small>N/A</small></div>'}</div></section>
  <section class="intelligence-detail-section"><header><span>EVENT EVIDENCE</span><b>SCORE / DATE</b></header><div class="intelligence-evidence-list">${eventRows(payload.events) || '<div class="intelligence-empty">0 RECORDS</div>'}</div></section>
  <section class="intelligence-detail-section"><header><span>NEWS EVIDENCE</span><b>VERIFY / VELOCITY</b></header><div class="intelligence-evidence-list">${storyRows(payload.stories) || '<div class="intelligence-empty">0 RECORDS</div>'}</div></section>
  <section class="intelligence-detail-section"><header><span>SOURCE STATE</span><b>STATE / N</b></header><div class="intelligence-key-values">${sourceRows(payload.sources?.intelligence) || '<div><span>N/A</span><b>N/A</b><small>0</small></div>'}</div></section>`;
}
