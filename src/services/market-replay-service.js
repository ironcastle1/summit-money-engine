import { publicAsset } from '../domain/markets/asset-schema.js';
import { runReplay } from '../domain/replay/replay-engine.js';

export class MarketReplayService {
  constructor(options) { this.data = options.data; }

  async run(options) {
    const limit = Math.max(200, Math.min(1000, Number(options.limit) || 1000));
    const bundle = await this.data.bundle(options.assetId, options.timeframeId, limit);
    const result = runReplay({
      asset: publicAsset(bundle.asset),
      timeframeId: options.timeframeId,
      candles: bundle.candles,
      source: bundle.source,
      config: options.config || {}
    });
    if (result.available) {
      result.equity = result.equity.map(point => [point.timestamp, point.equity, point.drawdown]);
      result.trades = result.trades.slice(-500);
    }
    return result;
  }
}
