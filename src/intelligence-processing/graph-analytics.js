export function degreeCentrality(graph) {
    const scores = new Map();
    const nodeCount = Math.max(1, graph.nodes.size - 1);
    for (const id of graph.nodes.keys())
        scores.set(id, graph.neighbors(id).length / nodeCount);
    return [...scores.entries()].map(([id, score]) => ({ id, score })).sort((left, right) => right.score - left.score);
}
export function betweennessCentrality(graph) {
    const scores = new Map([...graph.nodes.keys()].map(id => [id, 0]));
    const ids = [...graph.nodes.keys()];
    for (let left = 0; left < ids.length; left += 1) {
        for (let right = left + 1; right < ids.length; right += 1) {
            const path = graph.shortestPath(ids[left], ids[right], 12);
            if (!path || path.length <= 2)
                continue;
            for (const id of path.slice(1, -1))
                scores.set(id, (scores.get(id) || 0) + 1);
        }
    }
    const maximum = Math.max(...scores.values(), 1);
    return [...scores.entries()].map(([id, value]) => ({ id, score: value / maximum })).sort((left, right) => right.score - left.score);
}
export function communityLabels(graph, iterations = 8) {
    const labels = new Map([...graph.nodes.keys()].map(id => [id, id]));
    for (let iteration = 0; iteration < iterations; iteration += 1) {
        let changed = false;
        for (const id of graph.nodes.keys()) {
            const counts = new Map();
            for (const neighbor of graph.neighbors(id)) {
                if (!neighbor.entity)
                    continue;
                const label = labels.get(neighbor.entity.id);
                counts.set(label, (counts.get(label) || 0) + Number(neighbor.edge.weight || 1));
            }
            const winner = [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
            if (winner && winner !== labels.get(id)) {
                labels.set(id, winner);
                changed = true;
            }
        }
        if (!changed)
            break;
    }
    const communities = new Map();
    for (const [id, label] of labels) {
        if (!communities.has(label))
            communities.set(label, []);
        communities.get(label).push(id);
    }
    return [...communities.entries()].map(([id, members]) => ({ id, members, size: members.length })).sort((left, right) => right.size - left.size);
}
export function graphSummary(graph) {
    const degrees = degreeCentrality(graph);
    return {
        nodes: graph.nodes.size,
        edges: graph.edges.size,
        density: graph.nodes.size > 1 ? graph.edges.size / (graph.nodes.size * (graph.nodes.size - 1)) : 0,
        components: graph.connectedComponents().length,
        hubs: degrees.slice(0, 10)
    };
}
