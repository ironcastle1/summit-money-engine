import { round } from './numbers.js';
export function detectBottlenecks(graph, context = {}) {
  const snapshot = graph.snapshot(); const usage = new Map();
  for (const edge of snapshot.edges) { usage.set(edge.from, (usage.get(edge.from) || 0) + 1); usage.set(edge.to, (usage.get(edge.to) || 0) + 1); }
  const ranked = snapshot.nodes.map(node => {
    const degree = usage.get(node.id) || 0; const risk = Number(context.nodeRiskById?.get?.(node.id)?.score || 0);
    const importance = Number(node.importance || 0); const alternatives = Number(context.alternativesByNode?.get?.(node.id) || 0);
    const criticality = Math.min(100, degree * 8 + importance * 0.35 + risk * 0.35 - alternatives * 4);
    return Object.freeze({ id: node.id, name: node.name, kind: node.kind, degree, importance, riskScore: risk, alternativeCount: alternatives, criticality: round(criticality, 1) });
  }).sort((a, b) => b.criticality - a.criticality);
  return Object.freeze({ bottlenecks: Object.freeze(ranked.slice(0, context.limit || 50)), nodeCount: snapshot.nodeCount, edgeCount: snapshot.edgeCount, generatedAt: new Date().toISOString() });
}
