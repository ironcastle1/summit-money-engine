export function conflictMapFeatures(theatres = []) {
  const features = [];
  for (const theatre of theatres) {
    features.push({
      type: 'Feature',
      id: `theatre-${theatre.id}`,
      geometry: {
        type: 'Point',
        coordinates: [theatre.center.lon,
        theatre.center.lat]
      },
      properties: {
        kind: 'CONFLICT_THEATRE',
        id: theatre.id,
        name: theatre.name,
        nameLocal: theatre.nameLocal || '',
        risk: theatre.risk.score,
        band: theatre.risk.band,
        phase: theatre.phase,
        escalation: theatre.escalation.score,
        confidence: theatre.confidence.score,
        eventCount: theatre.eventCount
      }
    });
    for (const front of theatre.fronts || [])
    features.push({
      type: 'Feature',
      id: `${theatre.id}-${front.id}`,
      geometry: front.geometry,
      properties: {
        kind: 'FRONTLINE',
        id: front.id,
        theatreId: theatre.id,
        name: `${theatre.name} front`,
        risk: front.intensity,
        confidence: theatre.confidence.score
      }
    });
  }
  return Object.freeze({
    type: 'FeatureCollection',
    features
  });
}
