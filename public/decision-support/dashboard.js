import { escapeHtml, number } from './format.js';
export function renderDashboard(root, snapshot) {
  const cards = snapshot.cards || [];
  root.innerHTML = `<div class="decision-card-grid">${cards.map(card => `<article class="decision-metric"><span>${escapeHtml(card.label)}</span><strong>${escapeHtml(number(card.value, Number(card.value) % 1 ? 1 : 0))}</strong><small>${escapeHtml(card.note)}</small></article>`).join('')}</div>`;
}
