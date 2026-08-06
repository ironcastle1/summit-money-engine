export class OverlayExportService {
  toGeoJson(results, metadata = {}) {
    const features = [];
    for (const result of results || []) {
      for (const feature of result.collection?.features || []) {
        features.push({ ...feature, properties: { ...feature.properties, overlayId: result.layerId } });
      }
    }
    return { type: 'FeatureCollection', features, metadata: { ...metadata, generatedAt: new Date().toISOString(), overlayCount: (results || []).length } };
  }
  toCsv(results) {
    const rows = [['overlayId', 'featureId', 'title', 'category', 'latitude', 'longitude', 'timestamp', 'source']];
    for (const result of results || []) {
      for (const feature of result.collection?.features || []) {
        const coordinates = feature.geometry?.type === 'Point' ? feature.geometry.coordinates : ['', ''];
        const properties = feature.properties || {};
        rows.push([result.layerId, feature.id || '', properties.title || properties.name || '', properties.category || properties.kind || '', coordinates[1] ?? '', coordinates[0] ?? '', properties.timestamp || properties.updatedAt || '', properties.source || properties.sourceName || '']);
      }
    }
    return rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('\"', '\"\"')}"`).join(',')).join('\n');
  }
}
