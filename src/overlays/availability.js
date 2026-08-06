export function overlayAvailabilitySnapshot(catalog, sourcePolicy) {
  const layers = catalog.list().map(layer=>Object.freeze({ id:layer.id, title:layer.title, group:layer.group, source:layer.source, sourceMode:layer.sourceMode, ...sourcePolicy.inspect(layer) }));
  const summary = layers.reduce((result,layer)=>{ result[layer.available?'available':'unavailable']++; result.byMode[layer.sourceMode]=(result.byMode[layer.sourceMode]||0)+1; return result; },{available:0,unavailable:0,byMode:{}});
  return Object.freeze({generatedAt:new Date().toISOString(),summary:Object.freeze({...summary,byMode:Object.freeze(summary.byMode)}),layers:Object.freeze(layers)});
}
