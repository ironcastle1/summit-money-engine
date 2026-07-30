import { readFile } from 'node:fs/promises';

export class RouteService {
  static async create(options) {
    const collection = JSON.parse(await readFile(options.routesPath, 'utf8'));
    const features = (collection.features || []).map((feature, index) => ({
      ...feature,
      properties: {
        id: feature.properties?.id || `route-${index + 1}`,
        name: feature.properties?.name || `Route ${index + 1}`,
        class: feature.properties?.class || 'shipping',
        importance: Number(feature.properties?.importance || Math.max(45, 90 - index * 5)),
        active: feature.properties?.active ?? true,
        ...feature.properties
      }
    }));
    return new RouteService({ collection: { type: 'FeatureCollection', features } });
  }

  constructor(options) {
    this.collection = options.collection;
  }

  list() {
    return this.collection;
  }
}
