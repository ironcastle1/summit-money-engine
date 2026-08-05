const MODE_MAX_AGE = Object.freeze({ live: 15*60, derived: 60*60, static: 30*24*60*60, connector: 60*60, tile: 7*24*60*60 });
export function freshnessState(layer, generatedAt, now = Date.now()) {
  const parsed = Date.parse(generatedAt || 0);
  if (!Number.isFinite(parsed)) return Object.freeze({ state: 'unknown', ageSeconds: null, maximumAgeSeconds: MODE_MAX_AGE[layer.sourceMode] || 3600 });
  const ageSeconds = Math.max(0, Math.round((now-parsed)/1000));
  const maximumAgeSeconds = Math.max(layer.refreshSeconds*3, MODE_MAX_AGE[layer.sourceMode] || 3600);
  return Object.freeze({ state: ageSeconds <= maximumAgeSeconds ? 'fresh' : ageSeconds <= maximumAgeSeconds*3 ? 'stale' : 'expired', ageSeconds, maximumAgeSeconds });
}
