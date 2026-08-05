const finite = value => Number.isFinite(Number(value));
function coordinatesFrom(record) {
  if (Array.isArray(record?.geometry?.coordinates)) return record.geometry.coordinates;
  if (Array.isArray(record?.coordinates)) return record.coordinates;
  if (finite(record?.coordinates?.lon) && finite(record?.coordinates?.lat)) return [Number(record.coordinates.lon), Number(record.coordinates.lat)];
  if (finite(record?.lon) && finite(record?.lat)) return [Number(record.lon), Number(record.lat)];
  if (finite(record?.longitude) && finite(record?.latitude)) return [Number(record.longitude), Number(record.latitude)];
  if (finite(record?.mapPoint?.lon) && finite(record?.mapPoint?.lat)) return [Number(record.mapPoint.lon), Number(record.mapPoint.lat)];
  return null;
}
export function normalizeOverlayFeature(record, layer, index = 0) {
  if (record?.type === 'Feature' && record.geometry) return { ...record, id: String(record.id || record.properties?.id || `${layer.id}:${index}`), properties: { ...record.properties, overlayId: layer.id, sourceMode: layer.sourceMode }, __data: record.__data || record.properties };
  const coordinates = coordinatesFrom(record);
  if (!coordinates) return null;
  const geometry = record.geometry || { type: Array.isArray(coordinates[0]) ? 'LineString' : 'Point', coordinates };
  return { type: 'Feature', id: String(record.id || `${layer.id}:${index}`), geometry, properties: { ...record, overlayId: layer.id, sourceMode: layer.sourceMode, nameEnglish: record.nameEnglish || record.name || record.title || layer.title, nameLocal: record.nameLocal || record.nativeName || '' }, __data: record };
}
export function featureCollection(features = [], metadata = {}) { return Object.freeze({ type: 'FeatureCollection', features: Object.freeze(features.filter(Boolean)), metadata: Object.freeze({ ...metadata }) }); }
