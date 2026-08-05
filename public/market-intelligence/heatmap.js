import { escapeHtml, number } from './format.js';
export function renderHeatmap(root, heatmap, onSelect) {
  if (!root) return;
  const groups = heatmap?.groups || [];
  root.innerHTML = groups.map(group => `<section class="mi-heat-group"><h3>${escapeHtml(group.name)}</h3><div class="mi-heat-cells">${group.items.map(item => `<button type="button" class="mi-heat-cell ${item.direction.toLowerCase()}" data-asset-id="${escapeHtml(item.id)}" style="--intensity:${item.intensity}"><strong>${escapeHtml(item.symbol)}</strong><span>${number(item.value, 2)}</span></button>`).join('')}</div></section>`).join('') || '<p class="mi-empty">No heatmap data is available.</p>';
  root.querySelectorAll('[data-asset-id]').forEach(button => button.addEventListener('click', () => onSelect?.(button.dataset.assetId)));
}
