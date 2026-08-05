function feature(entity, metrics, kind) {
  return {
    type: 'Feature',
    id: `${kind}:${entity.id}`,
    geometry: { type: 'Point', coordinates: [entity.lon, entity.lat] },
    properties: {
      id: entity.id, kind, name: entity.name, country: entity.country || entity.name,
      countryCode: entity.countryCode || entity.iso2,
      composite: metrics?.composite?.score ?? null, safety: metrics?.composite?.score ?? null,
      conflict: metrics?.conflict?.score ?? null, disaster: metrics?.disaster?.score ?? null,
      crime: metrics?.crime?.score ?? null, election: metrics?.elections?.proximityScore ?? null,
      economic: metrics?.economic?.stressScore ?? null, confidence: metrics?.composite?.confidence ?? 0
    }
  };
}
export function intelligenceGeoJson(countries, cities, countryMetrics = new Map(), cityMetrics = new Map()) {
  return Object.freeze({
    countries: { type: 'FeatureCollection', features: countries.map(item => feature(item, countryMetrics.get(item.iso2), 'country')) },
    cities: { type: 'FeatureCollection', features: cities.map(item => feature(item, cityMetrics.get(item.id), 'city')) }
  });
}
