import { clean, frozen } from './utilities.js';

export function mapSnapshotSpec(input = {}) {
  return frozen({
    title: clean(input.title || 'Map snapshot', 240),
    center: frozen({ lat: Number(input.center?.lat || 0), lon: Number(input.center?.lon || 0) }),
    zoom: Math.max(1, Math.min(18, Number(input.zoom) || 2)),
    bounds: input.bounds ? frozen({ ...input.bounds }) : null,
    layers: Object.freeze([...(input.layers || [])].map(String).slice(0, 80)),
    featureIds: Object.freeze([...(input.featureIds || [])].map(String).slice(0, 5000)),
    capturedAt: input.capturedAt || new Date().toISOString(),
    attribution: clean(input.attribution || 'Merlin map intelligence', 500)
  });
}
