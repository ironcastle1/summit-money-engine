export function linearRegression(values, period) {
  const slope = new Array(values.length).fill(null);
  const rSquared = new Array(values.length).fill(null);
  const fitted = new Array(values.length).fill(null);
  const xMean = (period - 1) / 2;
  const xVariance = Array.from({ length: period }, (_, index) => (index - xMean) ** 2).reduce((a, b) => a + b, 0);
  for (let end = period - 1; end < values.length; end += 1) {
    const window = values.slice(end - period + 1, end + 1);
    if (window.some(value => !Number.isFinite(value))) continue;
    const yMean = window.reduce((total, value) => total + value, 0) / period;
    let covariance = 0;
    let yVariance = 0;
    for (let index = 0; index < period; index += 1) {
      covariance += (index - xMean) * (window[index] - yMean);
      yVariance += (window[index] - yMean) ** 2;
    }
    const beta = covariance / xVariance;
    const correlationSquared = yVariance > 0 ? (covariance ** 2) / (xVariance * yVariance) : 0;
    slope[end] = beta;
    rSquared[end] = Math.max(0, Math.min(1, correlationSquared));
    fitted[end] = yMean + beta * (period - 1 - xMean);
  }
  return { slope, rSquared, fitted };
}

export function efficiencyRatio(values, period = 10) {
  const output = new Array(values.length).fill(null);
  for (let index = period; index < values.length; index += 1) {
    const direction = Math.abs(values[index] - values[index - period]);
    let volatility = 0;
    for (let cursor = index - period + 1; cursor <= index; cursor += 1) volatility += Math.abs(values[cursor] - values[cursor - 1]);
    output[index] = volatility > 0 ? direction / volatility : 0;
  }
  return output;
}

export function movingAverageAlignment(price, fast, medium, slow) {
  return price.map((value, index) => {
    if (![value, fast[index], medium[index], slow[index]].every(Number.isFinite)) return null;
    if (value > fast[index] && fast[index] > medium[index] && medium[index] > slow[index]) return 1;
    if (value < fast[index] && fast[index] < medium[index] && medium[index] < slow[index]) return -1;
    const scale = Math.max(Math.abs(value), 1e-9);
    return Math.max(-1, Math.min(1, ((value - fast[index]) + (fast[index] - medium[index]) + (medium[index] - slow[index])) / scale * 20));
  });
}
