import { rollingMean } from '../rolling.js';

export function volumeRatio(volumes, period = 20) {
  const average = rollingMean(volumes, period);
  return volumes.map((value, index) => Number.isFinite(value) && Number.isFinite(average[index]) && average[index] > 0 ? value / average[index] : null);
}

export function onBalanceVolume(closes, volumes) {
  const output = new Array(closes.length).fill(null);
  let value = 0;
  output[0] = 0;
  for (let index = 1; index < closes.length; index += 1) {
    if (![closes[index], closes[index - 1], volumes[index]].every(Number.isFinite)) continue;
    if (closes[index] > closes[index - 1]) value += volumes[index];
    else if (closes[index] < closes[index - 1]) value -= volumes[index];
    output[index] = value;
  }
  return output;
}

export function moneyFlow(candles, period = 14) {
  const typical = candles.map(candle => (candle.high + candle.low + candle.close) / 3);
  const raw = candles.map((candle, index) => typical[index] * candle.volume);
  const output = new Array(candles.length).fill(null);
  for (let index = period; index < candles.length; index += 1) {
    let positive = 0;
    let negative = 0;
    for (let cursor = index - period + 1; cursor <= index; cursor += 1) {
      if (typical[cursor] > typical[cursor - 1]) positive += raw[cursor];
      else if (typical[cursor] < typical[cursor - 1]) negative += raw[cursor];
    }
    output[index] = negative === 0 ? (positive > 0 ? 100 : 50) : 100 - 100 / (1 + positive / negative);
  }
  return output;
}
