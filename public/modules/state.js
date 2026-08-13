export const state = {
  view: 'map',
  region: 'world',
  hours: 24,
  minScore: 52,
  category: 'all',
  reference: null,
  snapshot: null,
  layers: { events: true, conflict: true, politics: true, sanctions: true, shipping: true, energy: true, cyber: true, market: true, supply: true, other: true, alerts: true, heatmap: true, nodes: true, ports: true, routes: true, labels: true },
  selectedSignal: null,
};
export function setState(patch) { Object.assign(state, patch); return state; }
