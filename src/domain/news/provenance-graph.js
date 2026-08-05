import { stableId } from '../../core/ids.js';
import { clamp, round } from '../../core/numbers.js';

function entropy(counts) {
  const total = counts.reduce((sum, value) => sum + value, 0);
  if (!total || counts.length <= 1) return 0;
  const value = -counts.reduce((sum, count) => {
    const p = count / total;
    return sum + (p > 0 ? p * Math.log(p) : 0);
  }, 0);
  return value / Math.log(counts.length);
}

function addNode(nodes, type, key, label, metadata = {}) {
  const id = stableId('news-node', type, key);
  if (!nodes.has(id)) nodes.set(id, { id, type, key, label, degree: 0, weightedDegree: 0, metadata });
  return nodes.get(id);
}

function addEdge(edges, nodes, from, to, type, weight = 1) {
  const id = stableId('news-edge', from.id, to.id, type);
  const existing = edges.get(id);
  if (existing) existing.weight += weight;
  else edges.set(id, { id, from: from.id, to: to.id, type, weight });
  from.degree += 1;
  to.degree += 1;
  from.weightedDegree += weight;
  to.weightedDegree += weight;
}

export function buildProvenanceGraph(stories, articles) {
  const nodes = new Map();
  const edges = new Map();
  const articleById = new Map(articles.map(article => [article.id, article]));
  for (const story of stories) {
    const storyNode = addNode(nodes, 'STORY', story.id, story.title, { category: story.category, verification: story.verification.score });
    for (const articleId of story.articleIds) {
      const article = articleById.get(articleId);
      if (!article) continue;
      const sourceNode = addNode(nodes, 'SOURCE', article.sourceDomain || article.sourceName, article.sourceName, { sourceType: article.sourceType });
      addEdge(edges, nodes, sourceNode, storyNode, 'REPORTS', 1);
    }
    for (const entity of story.entities.slice(0, 12)) {
      const entityNode = addNode(nodes, 'ENTITY', entity.toLowerCase(), entity);
      addEdge(edges, nodes, storyNode, entityNode, 'MENTIONS', 1);
    }
    for (const country of story.countries) {
      const countryNode = addNode(nodes, 'COUNTRY', country, country);
      addEdge(edges, nodes, storyNode, countryNode, 'LOCATED_IN', 1);
    }
    for (const ticker of story.tickers) {
      const assetNode = addNode(nodes, 'ASSET', ticker, ticker);
      addEdge(edges, nodes, storyNode, assetNode, 'AFFECTS', 1);
    }
  }
  const nodeList = [...nodes.values()].map(node => Object.freeze({ ...node, degree: node.degree, weightedDegree: round(node.weightedDegree, 2) }));
  const sourceNodes = nodeList.filter(node => node.type === 'SOURCE');
  const sourceWeights = sourceNodes.map(node => node.weightedDegree);
  const totalSourceWeight = sourceWeights.reduce((sum, value) => sum + value, 0);
  const largestSourceShare = totalSourceWeight ? Math.max(...sourceWeights) / totalSourceWeight : null;
  const sourceDiversity = sourceWeights.length ? entropy(sourceWeights) : null;
  const concentration = largestSourceShare === null ? null : round(largestSourceShare * 100);
  const diversityScore = sourceDiversity === null ? null : round(clamp(sourceDiversity * 100, 0, 100));
  return Object.freeze({
    nodes: Object.freeze(nodeList.sort((a, b) => b.weightedDegree - a.weightedDegree)),
    edges: Object.freeze([...edges.values()].map(edge => Object.freeze({ ...edge, weight: round(edge.weight, 2) }))),
    metrics: Object.freeze({
      nodeCount: nodeList.length,
      edgeCount: edges.size,
      sourceCount: sourceNodes.length,
      sourceDiversityScore: diversityScore,
      largestSourceSharePct: concentration,
      concentrationRisk: concentration === null ? 'N/A' : concentration >= 60 ? 'HIGH' : concentration >= 40 ? 'MEDIUM' : 'LOW'
    })
  });
}
