import { clamp, round } from './numbers.js';
export function calculateCommodityBalance(input = {}) {
  const production = Math.max(0, Number(input.production) || 0);
  const consumption = Math.max(0, Number(input.consumption) || 0);
  const imports = Math.max(0, Number(input.imports) || 0);
  const exports = Math.max(0, Number(input.exports) || 0);
  const stocks = Math.max(0, Number(input.stocks) || 0);
  const capacity = Math.max(0, Number(input.spareCapacity) || 0);
  const available = production + imports + stocks + capacity;
  const required = consumption + exports;
  const balance = available - required;
  const balancePercent = required ? balance / required * 100 : 0;
  const tightness = clamp(50 - balancePercent * 2.5, 0, 100);
  return Object.freeze({
    production, consumption, imports, exports, stocks, spareCapacity: capacity,
    available: round(available, 4), required: round(required, 4), balance: round(balance, 4),
    balancePercent: round(balancePercent, 3), tightness: round(tightness, 2),
    state: tightness >= 75 ? 'CRITICAL_DEFICIT' : tightness >= 60 ? 'TIGHT' : tightness <= 30 ? 'SURPLUS' : 'BALANCED'
  });
}
