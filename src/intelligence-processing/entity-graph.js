export class EntityGraph {
    constructor() { this.nodes = new Map(); this.edges = new Map(); }
    addNode(entity) {
        if (entity?.id)
            this.nodes.set(entity.id, entity);
        return this;
    }
    connect(from, to, type = 'RELATED_TO', attributes = {}) {
        if (!from || !to || from === to)
            return this;
        const key = [from, to, type].join('|');
        this.edges.set(key, { id: key, from, to, type, weight: Number(attributes.weight ?? 1), evidence: [...(attributes.evidence || [])], attributes: { ...attributes } });
        return this;
    }
    disconnect(from, to, type = null) {
        for (const [key, edge] of this.edges)
            if (edge.from === from && edge.to === to && (!type || edge.type === type))
                this.edges.delete(key);
    }
    neighbors(id, options = {}) {
        const direction = options.direction || 'both';
        const type = options.type || null;
        const values = [];
        for (const edge of this.edges.values()) {
            if (type && edge.type !== type)
                continue;
            if ((direction === 'out' || direction === 'both') && edge.from === id)
                values.push({ entity: this.nodes.get(edge.to) || null, edge, direction: 'out' });
            if ((direction === 'in' || direction === 'both') && edge.to === id)
                values.push({ entity: this.nodes.get(edge.from) || null, edge, direction: 'in' });
        }
        return values;
    }
    shortestPath(start, target, maxDepth = 6) {
        if (start === target)
            return [start];
        const queue = [[start]];
        const visited = new Set([start]);
        while (queue.length) {
            const path = queue.shift();
            if (path.length > maxDepth + 1)
                continue;
            const last = path.at(-1);
            for (const { entity } of this.neighbors(last)) {
                if (!entity || visited.has(entity.id))
                    continue;
                const next = [...path, entity.id];
                if (entity.id === target)
                    return next;
                visited.add(entity.id);
                queue.push(next);
            }
        }
        return null;
    }
    connectedComponents() {
        const remaining = new Set(this.nodes.keys());
        const groups = [];
        while (remaining.size) {
            const first = remaining.values().next().value;
            const stack = [first];
            const group = [];
            remaining.delete(first);
            while (stack.length) {
                const id = stack.pop();
                group.push(id);
                for (const { entity } of this.neighbors(id)) {
                    if (entity && remaining.delete(entity.id))
                        stack.push(entity.id);
                }
            }
            groups.push(group);
        }
        return groups.sort((a, b) => b.length - a.length);
    }
    snapshot() { return { nodes: this.nodes.size, edges: this.edges.size, components: this.connectedComponents().length }; }
}
