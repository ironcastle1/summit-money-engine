import { assertLogistics } from './errors.js';
export class RouteGraph {
  constructor() { this.nodes = new Map(); this.outgoing = new Map(); this.incoming = new Map(); }
  addNode(node) {
    const id = String(node.id).toLowerCase();
    assertLogistics(id, 'INVALID_NODE', 'Node id is required');
    this.nodes.set(id, Object.freeze({ ...node, id }));
    if (!this.outgoing.has(id)) this.outgoing.set(id, []);
    if (!this.incoming.has(id)) this.incoming.set(id, []);
    return this;
  }
  addEdge(edge) {
    const from = String(edge.from).toLowerCase(); const to = String(edge.to).toLowerCase();
    assertLogistics(this.nodes.has(from) && this.nodes.has(to), 'INVALID_EDGE', 'Edge references an unknown node', { from, to });
    const normalized = Object.freeze({ ...edge, id: String(edge.id).toLowerCase(), from, to });
    this.outgoing.get(from).push(normalized); this.incoming.get(to).push(normalized); return this;
  }
  node(id) { return this.nodes.get(String(id).toLowerCase()) || null; }
  neighbors(id) { return [...(this.outgoing.get(String(id).toLowerCase()) || [])]; }
  predecessors(id) { return [...(this.incoming.get(String(id).toLowerCase()) || [])]; }
  edge(id) { const target = String(id).toLowerCase(); for (const edges of this.outgoing.values()) { const found = edges.find(edge => edge.id === target); if (found) return found; } return null; }
  snapshot() { return Object.freeze({ nodes: [...this.nodes.values()], edges: [...this.outgoing.values()].flat(), nodeCount: this.nodes.size, edgeCount: [...this.outgoing.values()].reduce((sum, edges) => sum + edges.length, 0) }); }
  clone() { const graph = new RouteGraph(); for (const node of this.nodes.values()) graph.addNode(node); for (const edges of this.outgoing.values()) for (const edge of edges) graph.addEdge(edge); return graph; }
}
