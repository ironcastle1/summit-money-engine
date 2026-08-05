export function inferAllianceNetwork(actorGraph,
events = []) {
  const support = new Map();
  for (const event of events) {
    const allies = event.raw?.attributes?.allies || [];
    for (const pair of allies) {
      const values = Array.isArray(pair) ? pair : [pair.source,
      pair.target];
      if (values.length < 2)
      continue;
      const key = [String(values[0]),
      String(values[1])].sort().join(':');
      support.set(key,
      (support.get(key) || 0) + 1);
    }
  }
  return Object.freeze({
    nodes: actorGraph.nodes,
    hostileEdges: actorGraph.edges.filter(edge => edge.hostility > 0),
    cooperationEdges: [...support].map(([id,
    evidence]) => {
      const [source,
      target] = id.split(':');
      return Object.freeze({
        id,
        source,
        target,
        evidence
      });
    })
  });
}
