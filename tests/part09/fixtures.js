export function candles(options = {}) {
  const count = options.count || 220;
  const start = options.start || 100;
  const drift = options.drift ?? 0.002;
  const volatility = options.volatility ?? 0.01;
  const output = [];
  let price = start;
  const origin = Date.parse('2026-01-01T00:00:00Z');
  for (let index = 0; index < count; index += 1) {
    const wave = Math.sin(index / 5) * volatility + Math.cos(index / 11) * volatility * 0.45;
    const open = price;
    price = Math.max(0.1, price * (1 + drift + wave));
    output.push({
      timestamp: origin + index * 86_400_000,
      open,
      high: Math.max(open, price) * 1.006,
      low: Math.min(open, price) * 0.994,
      close: price,
      volume: 1_000_000 + index * 15_000 + Math.sin(index) * 50_000
    });
  }
  return output;
}
export function asset(id = 'asset-a', options = {}) {
  return {
    id,
    symbol: options.symbol || id.toUpperCase().slice(0, 6),
    name: options.name || `Asset ${id}`,
    assetClass: options.assetClass || 'commodity',
    region: options.region || 'global',
    currency: 'USD',
    tags: options.tags || ['energy', 'oil']
  };
}
export function assetInput(id = 'asset-a', options = {}) {
  const series = candles(options);
  return {
    asset: asset(id, options),
    quote: { price: series.at(-1).close, previousClose: series.at(-2).close, volume: series.at(-1).volume, updatedAt: new Date().toISOString() },
    candles: series,
    source: { quote: { id: 'fixture', stale: false }, candles: { id: 'fixture', stale: false } },
    available: true,
    independentSources: 3,
    corroborationScore: 85
  };
}
export const majorEvent = {
  id: 'event-energy-1',
  type: 'conflict',
  category: 'conflict',
  title: 'Shipping route blocked after attack near oil export terminal',
  summary: 'A major energy export corridor is disrupted.',
  severity: 85,
  confidence: 80,
  country: 'global',
  tags: ['oil', 'shipping', 'energy'],
  entities: ['oil']
};
export const prediction = {
  id: 'prediction-1',
  question: 'Will oil prices rise after the shipping disruption?',
  category: 'energy',
  probability: 0.72,
  volume: 5_000_000,
  liquidity: 1_000_000
};
