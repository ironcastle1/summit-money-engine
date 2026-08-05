import { clamp, round } from './numbers.js';
export function calculateRiskScore(analysis = {}) {
  const volatility = clamp(Number(analysis.volatility?.score || 50), 0, 100);
  const drawdown = clamp(Math.abs(Number(analysis.drawdown?.currentPercent || 0)) * 3, 0, 100);
  const liquidity = clamp(100 - Number(analysis.liquidity?.score || 50), 0, 100);
  const eventRisk = clamp(Number(analysis.eventRisk || analysis.eventExposure || 0), 0, 100);
  const predictionDivergence = clamp(Number(analysis.predictionDivergence?.score || 0), 0, 100);
  const evidencePenalty = clamp(100 - Number(analysis.evidence?.score || 50), 0, 100);
  const score = clamp(volatility * 0.3 + drawdown * 0.18 + liquidity * 0.2 + eventRisk * 0.18 + predictionDivergence * 0.08 + evidencePenalty * 0.06, 0, 100);
  return Object.freeze({ score: round(score, 2), state: score >= 80 ? 'EXTREME' : score >= 65 ? 'HIGH' : score >= 45 ? 'ELEVATED' : score <= 20 ? 'LOW' : 'MODERATE', components: Object.freeze({ volatility: round(volatility, 2), drawdown: round(drawdown, 2), liquidity: round(liquidity, 2), eventRisk: round(eventRisk, 2), predictionDivergence: round(predictionDivergence, 2), evidencePenalty: round(evidencePenalty, 2) }) });
}
