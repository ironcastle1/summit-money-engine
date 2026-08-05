import { clamp, round } from './numbers.js';
export function detectCatalysts(assetAnalysis = {}, eventLinks = [], predictionLinks = []) {
  const catalysts = [];
  for (const link of eventLinks.filter(item => item.assetId === (assetAnalysis.asset?.id || assetAnalysis.id))) {
    catalysts.push({
      id: `event:${link.eventId}`, type: 'EVENT', direction: link.direction, strength: link.relevance,
      confidence: link.exposure?.score || 50, explanation: link.explanation
    });
  }
  for (const prediction of predictionLinks.filter(item => item.assetId === (assetAnalysis.asset?.id || assetAnalysis.id))) {
    catalysts.push({
      id: `prediction:${prediction.marketId}`, type: 'PREDICTION', direction: prediction.direction || 'VOLATILE',
      strength: clamp(prediction.relevance || 0, 0, 100), confidence: clamp((prediction.liquidityScore || 50), 0, 100), explanation: prediction.explanation
    });
  }
  const momentum = Number(assetAnalysis.momentum?.score || 50);
  if (Math.abs(momentum - 50) >= 15) catalysts.push({ id: 'technical:momentum', type: 'TECHNICAL', direction: momentum > 50 ? 'BULLISH' : 'BEARISH', strength: Math.abs(momentum - 50) * 2, confidence: 60, explanation: 'Multi-horizon price momentum is materially directional.' });
  const expansion = Number(assetAnalysis.volatility?.expansion || 1);
  if (expansion >= 1.35) catalysts.push({ id: 'technical:volatility', type: 'VOLATILITY', direction: 'VOLATILE', strength: clamp((expansion - 1) * 70, 0, 100), confidence: 65, explanation: 'Realized volatility is expanding above its recent baseline.' });
  return Object.freeze(catalysts.map(item => Object.freeze({ ...item, strength: round(item.strength, 2), confidence: round(item.confidence, 2) })).sort((a, b) => b.strength * b.confidence - a.strength * a.confidence));
}
