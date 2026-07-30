import { clamp } from '../../core/numbers.js';

function logGamma(value) {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  if (value < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  let x = 0.99999999999980993;
  const z = value - 1;
  for (let index = 0; index < coefficients.length; index += 1) x += coefficients[index] / (z + index + 1);
  const t = z + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaContinuedFraction(a, b, x) {
  const maxIterations = 200;
  const epsilon = 3e-12;
  const minimum = 1e-30;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < minimum) d = minimum;
  d = 1 / d;
  let h = d;
  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const m2 = 2 * iteration;
    let aa = iteration * (b - iteration) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < minimum) d = minimum;
    c = 1 + aa / c;
    if (Math.abs(c) < minimum) c = minimum;
    d = 1 / d;
    h *= d * c;
    aa = -(a + iteration) * (qab + iteration) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < minimum) d = minimum;
    c = 1 + aa / c;
    if (Math.abs(c) < minimum) c = minimum;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  return h;
}

export function regularizedIncompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return front * betaContinuedFraction(a, b, x) / a;
  return 1 - front * betaContinuedFraction(b, a, 1 - x) / b;
}

export function betaQuantile(probability, alpha, beta) {
  const target = clamp(probability, 0, 1);
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const middle = (low + high) / 2;
    const cumulative = regularizedIncompleteBeta(middle, alpha, beta);
    if (cumulative < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function betaPosterior(successes, trials, priorAlpha = 1, priorBeta = 1) {
  const safeTrials = Math.max(0, Math.floor(trials));
  const safeSuccesses = Math.min(safeTrials, Math.max(0, Math.floor(successes)));
  const alpha = priorAlpha + safeSuccesses;
  const beta = priorBeta + safeTrials - safeSuccesses;
  return {
    alpha,
    beta,
    mean: alpha / (alpha + beta),
    interval90: [betaQuantile(0.05, alpha, beta), betaQuantile(0.95, alpha, beta)]
  };
}
