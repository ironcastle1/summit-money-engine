import { dependencyGraph } from './dependency-graph.js';
export function dependencyCycles(actions = []) {
    const graph = dependencyGraph(actions);
    const visiting = new Set();
    const visited = new Set();
    const stack = [];
    const cycles = [];
    const visit = id => {
        if (visiting.has(id)) {
            const index = stack.indexOf(id);
            cycles.push([...stack.slice(index), id]);
            return;
        }
        if (visited.has(id))
            return;
        visiting.add(id);
        stack.push(id);
        for (const next of graph.outgoing.get(id) || [])
            visit(next);
        stack.pop();
        visiting.delete(id);
        visited.add(id);
    };
    for (const id of graph.ids)
        visit(id);
    return Object.freeze(cycles.map(item => Object.freeze(item)));
}
