export function buildSanctionsNetwork(countries = [], sanctions = []) {
  const nodes = countries.map(country => Object.freeze({
    id: country.iso2, name: country.name, type: 'COUNTRY'
  }));
  const edges = sanctions.filter(item => item.active !== false).map((item,index)=>Object.freeze({
    id: item.id || `sanction-${index}`, from: String(item.issuer || item.from || '').toUpperCase(), to: String(item.target || item.to || '').toUpperCase(), scope: item.scope || item.type || 'TARGETED', sectors: Object.freeze([...(item.sectors || [])]), weight: item.scope === 'COMPREHENSIVE' ? 1 : item.scope === 'SECTORAL' ? 0.65 : 0.35
  }));
  const exposure = new Map();
  for (const edge of edges) exposure.set(edge.to, (exposure.get(edge.to)||0)+edge.weight*100);
  return Object.freeze({
    nodes:Object.freeze(nodes),edges:Object.freeze(edges),exposure:Object.freeze([...exposure].map(([country,score])=>({
      country,score:Math.min(100,score)
    })))
  });
}
