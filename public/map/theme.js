export const CATEGORY_COLOURS = Object.freeze({
  earthquake: '#ff5e68',
  volcano: '#ff7a45',
  wildfire: '#ff9f43',
  storm: '#a78bfa',
  flood: '#37b9ff',
  drought: '#d7a84a',
  landslide: '#c08457',
  ice: '#8ee8ff',
  conflict: '#ef4444',
  protest: '#f4b942',
  terror: '#ff2f4b',
  crime: '#a3e635',
  infrastructure: '#f97316',
  transport: '#38bdf8',
  energy: '#facc15',
  economic: '#42d392',
  health: '#ec4899',
  other: '#94a3b8'
});

export function applyMapTheme(map) {
  const style = map.getStyle();
  for (const layer of style.layers || []) {
    const id = String(layer.id || '').toLowerCase();
    try {
      if (layer.type === 'background') map.setPaintProperty(layer.id, 'background-color', '#030a12');
      if (layer.type === 'fill') {
        map.setPaintProperty(layer.id, 'fill-color', id.includes('water') ? '#06121f' : id.includes('park') || id.includes('wood') ? '#0a2630' : '#0b1c2b');
        if (map.getPaintProperty(layer.id, 'fill-opacity') !== undefined) map.setPaintProperty(layer.id, 'fill-opacity', id.includes('building') ? 0.45 : 0.88);
      }
      if (layer.type === 'line') {
        map.setPaintProperty(layer.id, 'line-color', id.includes('boundary') ? '#31516c' : id.includes('water') ? '#124463' : '#15334b');
        if (map.getPaintProperty(layer.id, 'line-opacity') !== undefined) map.setPaintProperty(layer.id, 'line-opacity', 0.72);
      }
      if (layer.type === 'symbol') {
        if (map.getPaintProperty(layer.id, 'text-color') !== undefined) map.setPaintProperty(layer.id, 'text-color', '#7891a6');
        if (map.getPaintProperty(layer.id, 'text-halo-color') !== undefined) map.setPaintProperty(layer.id, 'text-halo-color', '#03101b');
        if (map.getPaintProperty(layer.id, 'text-halo-width') !== undefined) map.setPaintProperty(layer.id, 'text-halo-width', 1.1);
      }
    } catch {}
  }
}
