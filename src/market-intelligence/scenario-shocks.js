import { clamp } from './numbers.js';
export function normalizeScenarioShock(value = {}) {
  const changePercent = clamp(Number(value.changePercent ?? value.shockPercent ?? 0), -100, 1000);
  return Object.freeze({
    id: String(value.id || `shock-${Math.random().toString(36).slice(2, 9)}`),
    targetType: String(value.targetType || (value.symbol ? 'SYMBOL' : value.assetClass ? 'ASSET_CLASS' : 'TAG')).toUpperCase(),
    target: String(value.target || value.symbol || value.assetClass || value.tag || '').trim(),
    changePercent,
    volatilityMultiplier: Math.max(0, Number(value.volatilityMultiplier) || 1),
    liquidityMultiplier: Math.max(0, Number(value.liquidityMultiplier) || 1),
    probability: clamp(Number(value.probability ?? 100), 0, 100),
    rationale: String(value.rationale || '').slice(0, 300)
  });
}
export function shockMatchesAsset(shock, asset = {}) {
  const target = shock.target.toLowerCase();
  if (!target) return true;
  if (shock.targetType === 'SYMBOL') return [asset.id, asset.symbol].some(value => String(value || '').toLowerCase() === target);
  if (shock.targetType === 'ASSET_CLASS') return String(asset.assetClass || '').toLowerCase() === target;
  if (shock.targetType === 'REGION') return String(asset.region || '').toLowerCase() === target;
  return (asset.tags || []).some(tag => String(tag).toLowerCase() === target);
}
