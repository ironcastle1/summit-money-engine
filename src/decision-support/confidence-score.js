import { clamp, round, weightedMean } from './numbers.js';
import { sourceWeight } from './source-state.js';
export function confidenceScore(signal) {
  const sourceCount = signal.sources?.length || 0;
  const score = weightedMean([
    { value: signal.confidence, weight: 0.55 },
    { value: sourceWeight(signal.sourceState) * 100, weight: 0.3 },
    { value: Math.min(100, sourceCount * 30), weight: 0.15 }
  ]);
  const value = round(clamp(score), 1);
  return Object.freeze({ score: value, band: value >= 80 ? 'HIGH' : value >= 60 ? 'MEDIUM' : value >= 40 ? 'LOW' : 'VERY_LOW', sourceCount });
}
