import { $, esc, ago, money, pct } from './utils.js';

export function openEvent(item) {
  const analysis = item.intelligence || {};
  $('#detailKicker').textContent = `${item.urgency} · SCORE ${item.signalScore} · ${item.confidence}% CONFIDENCE`;
  $('#detailTitle').textContent = item.title;
  $('#detailBody').innerHTML = `
    <section class="detail-hero">
      <div class="detail-badges">
        <span>${esc(item.category)}</span>
        <span>${esc(item.location?.name || 'Regional')}</span>
        <span>${ago(item.publishedAt)} ago</span>
        <span>Evidence ${esc(item.evidenceGrade)}</span>
        <span>${esc(item.change?.state || 'NEW')}</span>
        ${analysis.escalation?.direction && analysis.escalation.direction !== 'NEUTRAL' ? `<span>${esc(analysis.escalation.direction)}</span>` : ''}
      </div>
      <p>${esc(item.summary || item.whyItMatters)}</p>
    </section>
    ${section('Why this matters', whyView(item))}
    ${analysis.playbooks?.length ? section('Relevant scenario', scenarioView(analysis.playbooks)) : ''}
    ${analysis.publicIndicators?.length ? section('Public indicators detected', publicIndicatorView(analysis.publicIndicators)) : ''}
    ${analysis.escalation?.indicators?.length ? section('What is changing', escalationView(analysis.escalation)) : ''}
    ${section('Market impact', financial(item.market || {}, analysis.exposures || []))}
    ${analysis.dependencies?.length ? section('Supply and market links', dependencyView(analysis.dependencies)) : ''}
    ${analysis.institutions?.length ? section('Organisations to follow', institutionView(analysis.institutions)) : ''}
    ${section('Practical checks', practicalView(item.security || {}))}
    ${item.predictions?.length ? section('Prediction-market context', predictionView(item.predictions)) : ''}
    ${section('What to verify next', verificationView(item.verification || []))}
    ${section('Sources', evidenceView(item.evidence || []))}
  `;
  $('#detailDrawer').classList.add('open');
  $('#detailDrawer').setAttribute('aria-hidden', 'false');
}

export function closeDetail() {
  $('#detailDrawer').classList.remove('open');
  $('#detailDrawer').setAttribute('aria-hidden', 'true');
}

function whyView(item) {
  const rationale = (item.market?.rationales || []).map(row => `<p class="rationale">${esc(row)}</p>`).join('');
  return `<p>${esc(item.whyItMatters)}</p>${rationale}`;
}

function section(title, body) {
  return `<section class="detail-section"><h3>${esc(title)}</h3>${body || '<p class="muted">No strong conclusion yet.</p>'}</section>`;
}

function chips(rows, cls = '') {
  return rows?.length ? `<div class="chips ${cls}">${rows.map(row => `<span>${esc(row)}</span>`).join('')}</div>` : '';
}

function financial(market, exposures) {
  if (!market?.rules?.length && !exposures.length) {
    return '<p class="muted">No market link cleared the threshold. Merlin does not create a market conclusion when the evidence is weak.</p>';
  }
  const base = market?.rules?.length ? `
    <div class="impact-grid">
      <div><small>AFFECTED ASSETS / MARKETS</small>${chips(market.assets)}</div>
      <div><small>POSSIBLE BENEFICIARIES</small>${chips(market.potentialBeneficiaries, 'positive')}</div>
      <div><small>POSSIBLE LOSERS / PRESSURE</small>${chips(market.potentialLosers, 'negative')}</div>
      <div><small>LIKELY TIME HORIZON</small>${chips(market.horizons)}</div>
    </div>
    <div class="rule-list">${market.rules.map(rule => `<div><b>${esc(rule.name)}</b><span>match ${rule.matchScore}/100</span><p>${esc(rule.rationale)}</p></div>`).join('')}</div>` : '';
  const mapped = exposures.length ? `<h4>Relevant exposures</h4><div class="rule-list">${exposures.slice(0, 6).map(row => `<div><b>${esc(row.name)}</b><span>${row.relevance}/100</span><p>${esc(row.notes || '')}</p>${chips(row.symbols || [])}</div>`).join('')}</div>` : '';
  return base + mapped;
}

function scenarioView(rows) {
  return `<div class="rule-list">${rows.slice(0, 3).map(row => `<div>
    <b>${esc(row.name)}</b><span>${esc(row.phase)} · ${row.matchScore}/100</span>
    <h4>What would support this scenario</h4>
    <ul>${row.confirmationSignals.slice(0, 4).map(value => `<li>${esc(value)}</li>`).join('')}</ul>
    <h4>What would weaken it</h4>
    <ul>${row.invalidationSignals.slice(0, 3).map(value => `<li>${esc(value)}</li>`).join('')}</ul>
  </div>`).join('')}</div>`;
}

function publicIndicatorView(rows) {
  return `<div class="rule-list">${rows.slice(0,8).map(row => `<div><b>${esc(row.label)}</b><span>${esc(row.lane)} · ${row.weight}/100</span><p>${esc(row.why)}</p><small>Confirm with: ${esc((row.verify || []).join(' · '))}</small></div>`).join('')}</div>`;
}

function escalationView(row) {
  return `<p><b>${esc(row.direction)}</b> · change score ${row.score > 0 ? '+' : ''}${row.score}</p>
    <div class="rule-list">${row.indicators.slice(0, 6).map(item => `<div><b>${esc(item.label)}</b><span>${item.weight > 0 ? '+' : ''}${item.weight}</span><p>${esc(item.whyItMatters)}</p></div>`).join('')}</div>`;
}

function dependencyView(rows) {
  return `<div class="rule-list">${rows.slice(0, 6).map(row => `<div><b>${esc(row.origin)} → ${esc(row.destination)}</b><span>${row.relevance}/100</span><p>${esc(row.flow)} · typical lag ${esc(row.typicalTransmissionLag)}</p><small>Check: ${esc((row.monitorIndicators || []).join(' · '))}</small></div>`).join('')}</div>`;
}

function institutionView(rows) {
  return `<div class="rule-list">${rows.slice(0, 6).map(row => `<div><b>${esc(row.name)}</b><span>${row.matchScore}/100</span><p>${esc(row.whyItMatters)}</p><small>Useful updates: ${esc((row.highValueSignals || []).join(' · '))}</small></div>`).join('')}</div>`;
}

function practicalView(row) {
  return `${row.scenarios?.length ? `<p><b>Relevant case:</b> ${row.scenarios.map(item => esc(item.name)).join(', ')}</p>` : ''}
    ${row.actions?.length ? `<h4>Checks to make</h4><ul>${row.actions.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
    ${row.decisionQuestions?.length ? `<h4>Questions to answer</h4><ul>${row.decisionQuestions.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
    ${row.confirmationSignals?.length ? `<h4>What would confirm further deterioration</h4><ul>${row.confirmationSignals.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}`;
}

function predictionView(rows) {
  return `<p class="muted">Prediction markets show prices and sentiment. They are not proof that an event has happened.</p>
    <div class="prediction-list">${rows.map(row => `<a href="${esc(row.url)}" target="_blank" rel="noopener"><b>${esc(row.title)}</b><strong>${pct(row.probability)}</strong><span>Volume ${money(row.volume)} · relevance ${row.relevance}</span></a>`).join('')}</div>`;
}

function verificationView(rows) {
  return rows.length ? `<ul>${rows.map(row => `<li>${esc(row)}</li>`).join('')}</ul>` : '<p class="muted">No additional verification step has been generated.</p>';
}

function evidenceView(rows) {
  if (!rows.length) return '<p class="muted">No source record is available.</p>';
  return `<div class="evidence-list">${rows.map(row => `<a href="${esc(row.url)}" target="_blank" rel="noopener"><b>${esc(row.sourceName || row.sourceDomain)}</b><span>${ago(row.publishedAt)} · source score ${Math.round(Number(row.sourceQuality || 0) * 100)}</span><p>${esc(row.title || 'Open source')}</p></a>`).join('')}</div>`;
}
