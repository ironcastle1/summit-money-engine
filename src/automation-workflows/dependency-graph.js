export function dependencyGraph(actions = []) {
    const ids = new Set(actions.map(item => item.id));
    const outgoing = new Map(actions.map(item => [item.id, []]));
    const incoming = new Map(actions.map(item => [item.id, 0]));
    for (const action of actions) {
        for (const dependency of action.dependsOn || []) {
            if (!ids.has(dependency))
                throw new TypeError(`Action ${action.id} depends on missing action ${dependency}`);
            outgoing.get(dependency).push(action.id);
            incoming.set(action.id, incoming.get(action.id) + 1);
        }
    }
    return Object.freeze({ ids, outgoing, incoming });
}
export function topologicalOrder(actions = []) {
    const graph = dependencyGraph(actions);
    const ready = [...graph.incoming.entries()].filter(([, count]) => count === 0).map(([id]) => id).sort();
    const result = [];
    while (ready.length) {
        const id = ready.shift();
        result.push(id);
        for (const next of graph.outgoing.get(id)) {
            graph.incoming.set(next, graph.incoming.get(next) - 1);
            if (graph.incoming.get(next) === 0)
                ready.push(next);
        }
        ready.sort();
    }
    if (result.length !== actions.length)
        throw new TypeError('Workflow action dependencies contain a cycle');
    return Object.freeze(result);
}
