import { clamp } from '../../../core/numbers.js';

export function wilsonInterval(successes, trials, z = 1.6448536269514722) {
  if (!Number.isFinite(successes) || !Number.isFinite(trials) || trials <= 0) return { lower: null, upper: null };
  const p = clamp(successes / trials, 0, 1);
  const denominator = 1 + z ** 2 / trials;
  const centre = (p + z ** 2 / (2 * trials)) / denominator;
  const margin = z / denominator * Math.sqrt(p * (1 - p) / trials + z ** 2 / (4 * trials ** 2));
  return { lower: clamp(centre - margin, 0, 1), upper: clamp(centre + margin, 0, 1) };
}

export function betaPosteriorMean(successes, failures, alpha = 2, beta = 2) {
  const numerator = successes + alpha;
  const denominator = successes + failures + alpha + beta;
  return denominator > 0 ? numerator / denominator : null;
}

export function effectiveSampleSize(weights) {
  const finite = weights.filter(value => Number.isFinite(value) && value > 0);
  if (!finite.length) return 0;
  const sum = finite.reduce((a, b) => a + b, 0);
  const squared = finite.reduce((a, b) => a + b ** 2, 0);
  return squared > 0 ? sum ** 2 / squared : 0;
}
