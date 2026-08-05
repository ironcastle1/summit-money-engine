export function compareTheatres(theatres = []) {
  const ranked = [...(theatres || [])].sort((a,
  b) => b.risk.score - a.risk.score);
  return Object.freeze({
    theatres: ranked,
    highestRisk: ranked[0] || null,
    highestEscalation: [...ranked].sort((a,
    b) => b.escalation.score - a.escalation.score)[0] || null,
    lowestConfidence: [...ranked].sort((a,
    b) => a.confidence.score - b.confidence.score)[0] || null,
    matrix: ranked.map(item => Object.freeze({
      id: item.id,
      name: item.name,
      risk: item.risk.score,
      escalation: item.escalation.score,
      intensity: item.intensity.score,
      civilian: item.exposure.civilian.score,
      logistics: item.exposure.logistics.score,
      confidence: item.confidence.score
    }))
  });
}
