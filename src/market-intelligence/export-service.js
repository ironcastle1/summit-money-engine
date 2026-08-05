function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
export class MarketIntelligenceExportService {
  toCsv(assets = []) {
    const columns = ['rank', 'symbol', 'name', 'assetClass', 'price', 'changePercent', 'trend', 'momentum', 'volatility', 'liquidity', 'opportunityScore', 'opportunityTier', 'direction', 'riskScore', 'evidenceGrade'];
    const rows = assets.map((item, index) => [index + 1, item.asset?.symbol, item.asset?.name, item.asset?.assetClass, item.quote?.price, item.quote?.changePercent, item.trend?.score, item.momentum?.score, item.volatility?.score, item.liquidity?.score, item.opportunity?.score, item.opportunity?.tier, item.opportunity?.direction, item.risk?.score, item.evidence?.grade]);
    return [columns, ...rows].map(row => row.map(escapeCsv).join(',')).join('\n');
  }
  toJson(snapshot = {}) {
    return JSON.stringify(snapshot, null, 2);
  }
  summary(snapshot = {}) {
    return Object.freeze({
      generatedAt: snapshot.generatedAt || new Date().toISOString(),
      assetCount: snapshot.assets?.length || 0,
      regime: snapshot.regime || null,
      breadth: snapshot.breadth || null,
      topOpportunities: Object.freeze((snapshot.opportunities || []).slice(0, 10)),
      sourceStatus: snapshot.sourceStatus || null,
      disclosure: 'Market intelligence is analytical information and is not investment advice.'
    });
  }
}
