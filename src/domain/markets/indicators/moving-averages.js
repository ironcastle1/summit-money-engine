export function sma(values, period) {
  const output = new Array(values.length).fill(null);
  let sum = 0;
  let valid = 0;
  const queue = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    queue.push(value);
    if (Number.isFinite(value)) { sum += value; valid += 1; }
    if (queue.length > period) {
      const removed = queue.shift();
      if (Number.isFinite(removed)) { sum -= removed; valid -= 1; }
    }
    if (queue.length === period && valid === period) output[index] = sum / period;
  }
  return output;
}

export function ema(values, period) {
  const output = new Array(values.length).fill(null);
  const multiplier = 2 / (period + 1);
  let previous = null;
  let seed = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!Number.isFinite(value)) continue;
    if (previous === null) {
      seed.push(value);
      if (seed.length === period) {
        previous = seed.reduce((total, item) => total + item, 0) / period;
        output[index] = previous;
      }
      continue;
    }
    previous = value * multiplier + previous * (1 - multiplier);
    output[index] = previous;
  }
  return output;
}

export function wilder(values, period) {
  const output = new Array(values.length).fill(null);
  let previous = null;
  let seed = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!Number.isFinite(value)) continue;
    if (previous === null) {
      seed.push(value);
      if (seed.length === period) {
        previous = seed.reduce((total, item) => total + item, 0) / period;
        output[index] = previous;
      }
      continue;
    }
    previous = (previous * (period - 1) + value) / period;
    output[index] = previous;
  }
  return output;
}
