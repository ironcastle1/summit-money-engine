export function dependencyGraph(components = []) { const nodes = new Map(components.map(item => [item.id, item])); const edges = []; const missing = []; for (const component of components)
    for (const dependency of component.dependencies || []) {
        edges.push({ from: component.id, to: dependency });
        if (!nodes.has(dependency))
            missing.push({ componentId: component.id, dependency });
    } return Object.freeze({ nodes: [...nodes.keys()], edges, missing }); }
export function topologicalOrder(graph) { const incoming = new Map(graph.nodes.map(node => [node, 0])); for (const edge of graph.edges)
    if (incoming.has(edge.to) && incoming.has(edge.from))
        incoming.set(edge.from, (incoming.get(edge.from) || 0) + 1); const ready = [...incoming].filter(([, count]) => count === 0).map(([node]) => node); const order = []; while (ready.length) {
    const node = ready.shift();
    order.push(node);
    for (const edge of graph.edges.filter(item => item.to === node)) {
        incoming.set(edge.from, incoming.get(edge.from) - 1);
        if (incoming.get(edge.from) === 0)
            ready.push(edge.from);
    }
} return Object.freeze({ order, cyclic: order.length !== graph.nodes.length, remaining: graph.nodes.filter(node => !order.includes(node)) }); }
