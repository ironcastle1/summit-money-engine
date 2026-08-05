export function mapFocusFeatures(signals = [], limit = 100) {
  return Object.freeze(signals.filter(signal => Number.isFinite(signal.location?.lat) && Number.isFinite(signal.location?.lon)).slice(0, limit).map(signal => Object.freeze({
    type: 'Feature',
    id: signal.id,
    geometry: Object.freeze({ type: 'Point', coordinates: Object.freeze([signal.location.lon, signal.location.lat]) }),
    properties: Object.freeze({ title: signal.title, domain: signal.domain, priority: signal.attention.band, score: signal.attention.score, label: signal.location.label })
  })));
}
