import { dependencyGraph, topologicalOrder } from './dependency-graph.js';
export function validateDependencies(components = []) { const graph = dependencyGraph(components), order = topologicalOrder(graph), issues = []; for (const item of graph.missing)
    issues.push({ code: 'MISSING_DEPENDENCY', severity: 'FAIL', ...item }); if (order.cyclic)
    issues.push({ code: 'DEPENDENCY_CYCLE', severity: 'FAIL', components: order.remaining }); return Object.freeze({ valid: issues.length === 0, issues, graph, order: order.order }); }
