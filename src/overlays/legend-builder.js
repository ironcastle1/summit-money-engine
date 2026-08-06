export function buildOverlayLegend(layer, features = []) {
  if (layer.legend?.length) return Object.freeze(layer.legend.map(item=>Object.freeze({...item})));
  const categories = new Map();
  for (const feature of features) { const category = String(feature.properties?.category || feature.properties?.kind || 'Other'); categories.set(category,(categories.get(category)||0)+1); }
  return Object.freeze([...categories.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([label,count])=>Object.freeze({label,count,colour:layer.style?.colour||'#7aa8bd'})));
}
