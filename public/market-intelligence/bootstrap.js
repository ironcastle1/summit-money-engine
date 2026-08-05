import { MarketIntelligenceController } from './market-intelligence-controller.js';
export async function installMarketIntelligenceSystem(options = {}) {
  const controller = new MarketIntelligenceController({ map: options.map });
  try { await controller.start(); return controller; }
  catch (error) { console.error('Market intelligence system failed to initialise', error); return null; }
}
