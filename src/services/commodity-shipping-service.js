import { round, clamp, mean } from '../core/numbers.js';

export class CommodityShippingService {
  constructor(options) { this.catalog = options.catalog; this.shipping = options.shipping; this.markets = options.markets; this.energySource = options.sources.get('eia'); }

  async detail(id, options = {}) {
    const commodity = this.catalog.commodity(id);
    if (!commodity) throw Object.assign(new Error('Commodity not found'), { code: 'COMMODITY_NOT_FOUND' });
    const snapshot = await this.shipping.snapshot(options);
    const routes = snapshot.routes.filter(route => commodity.routeIds.includes(route.id));
    const chokepoints = snapshot.chokepoints.filter(item => commodity.chokepointIds.includes(item.id));
    const networkValues = [...routes, ...chokepoints].map(item => item.risk.score).filter(Number.isFinite);
    const marketAnalyses = [];
    for (const assetId of commodity.marketAssetIds.slice(0, 3)) {
      try {
        const analysis = await this.markets.analyse({ assetId, timeframeId: options.timeframeId || '1d', limit: 750 });
        marketAnalyses.push({ assetId, signalScore: analysis.signal?.score ?? analysis.score ?? null, riseProbability: analysis.probability?.riseProbability ?? null, confidence: analysis.probability?.confidence ?? analysis.confidence ?? null, regime: analysis.regime?.id || analysis.regime || null });
      } catch (error) { marketAnalyses.push({ assetId, error: { code: error.code || error.name, message: error.message } }); }
    }
    const supplyRisk = networkValues.length ? round(mean(networkValues), 1) : null;
    const marketPressure = mean(marketAnalyses.map(item => Number(item.signalScore)).filter(Number.isFinite));
    const combined = Number.isFinite(supplyRisk) && Number.isFinite(marketPressure) ? round(clamp(supplyRisk * 0.65 + Math.abs(marketPressure) * 0.35, 0, 100), 1) : null;
    return { commodity, supplyRisk, marketPressure: Number.isFinite(marketPressure) ? round(marketPressure, 1) : null, combinedPressure: combined, routes, chokepoints, markets: marketAnalyses, generatedAt: new Date().toISOString() };
  }
}
