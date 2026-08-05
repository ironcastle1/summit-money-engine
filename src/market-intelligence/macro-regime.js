import { clamp, round } from './numbers.js';
export function classifyMacroRegime(input = {}) {
  const growth = clamp(Number(input.growth ?? input.growthScore ?? 50), 0, 100);
  const inflation = clamp(Number(input.inflation ?? input.inflationScore ?? 50), 0, 100);
  const policy = clamp(Number(input.policyTightness ?? 50), 0, 100);
  const liquidity = clamp(Number(input.liquidity ?? 50), 0, 100);
  let quadrant = 'BALANCED';
  if (growth >= 55 && inflation < 55) quadrant = 'GOLDILOCKS';
  else if (growth >= 55 && inflation >= 55) quadrant = 'REFLATION';
  else if (growth < 45 && inflation >= 55) quadrant = 'STAGFLATION';
  else if (growth < 45 && inflation < 45) quadrant = 'DEFLATION';
  const financialConditions = clamp(100 - policy * 0.55 + liquidity * 0.45, 0, 100);
  return Object.freeze({ quadrant, growth: round(growth, 2), inflation: round(inflation, 2), policyTightness: round(policy, 2), liquidity: round(liquidity, 2), financialConditions: round(financialConditions, 2), riskBias: financialConditions >= 60 && growth >= 50 ? 'RISK_ON' : financialConditions <= 40 || growth <= 35 ? 'RISK_OFF' : 'MIXED' });
}
