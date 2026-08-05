import { clamp, round } from './numbers.js';
export function estimateRiskPremium(input = {}) {
  const volatility = clamp(Number(input.volatility || 0), 0, 200);
  const drawdown = Math.abs(Math.min(0, Number(input.drawdown || 0)));
  const liquidityRisk = clamp(100 - Number(input.liquidity || 50), 0, 100);
  const eventRisk = clamp(Number(input.eventRisk || 0), 0, 100);
  const regimeRisk = clamp(Number(input.regimeRisk || 50), 0, 100);
  const annualPercent = clamp(volatility * 0.035 + drawdown * 0.08 + liquidityRisk * 0.025 + eventRisk * 0.03 + regimeRisk * 0.02, 0, 25);
  return Object.freeze({ annualPercent: round(annualPercent, 3), dailyBasisPoints: round(annualPercent * 100 / 252, 3), components: Object.freeze({ volatility: round(volatility * 0.035, 3), drawdown: round(drawdown * 0.08, 3), liquidity: round(liquidityRisk * 0.025, 3), event: round(eventRisk * 0.03, 3), regime: round(regimeRisk * 0.02, 3) }), state: annualPercent >= 12 ? 'DISTRESSED' : annualPercent >= 7 ? 'ELEVATED' : annualPercent <= 3 ? 'COMPRESSED' : 'NORMAL' });
}
