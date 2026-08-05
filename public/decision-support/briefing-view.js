import { age, bandClass, escapeHtml, number, shortText } from './format.js';
function signalCard(signal) {
  return `<article class="brief-signal ${bandClass(signal.attention?.band)}" data-signal-id="${escapeHtml(signal.id)}"><header><span>${escapeHtml(signal.domain)}</span><b>${escapeHtml(signal.attention?.band)} ${number(signal.attention?.score, 1)}</b></header><h3>${escapeHtml(signal.title)}</h3><p>${escapeHtml(shortText(signal.summary, 240))}</p><footer><span>${escapeHtml(signal.location?.label || 'GLOBAL')}</span><span>${age(signal.time)}</span><span>${number(signal.attention?.confidence?.score, 0)}% CONF</span></footer></article>`;
}
export function renderBriefing(root, snapshot, onSelect) {
  const brief = snapshot.brief || {};
  root.innerHTML = `<section class="brief-executive"><span>MORNING BRIEF</span><h2>${escapeHtml(brief.executive?.headline || 'No material headline')}</h2><div><b>${number(brief.executive?.criticalCount)} critical</b><b>${number(brief.executive?.urgentCount)} urgent</b><b>${number(brief.executive?.newCount)} new</b><b>${number(brief.coverage?.score)}% evidence</b></div></section>${(brief.sections || []).map(section => `<section class="brief-section"><header><h2>${escapeHtml(section.title)}</h2><span>${number(section.count)} SIGNALS · AVG ${number(section.averagePriority, 1)}</span></header><div class="brief-signal-grid">${(section.items || []).map(signalCard).join('')}</div></section>`).join('')}`;
  root.querySelectorAll('[data-signal-id]').forEach(element => element.addEventListener('click', () => onSelect?.(element.dataset.signalId)));
}
