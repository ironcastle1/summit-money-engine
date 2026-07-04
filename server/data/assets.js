const cryptoAssets = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', venue: 'Binance', pair: 'BTCUSDT', theme: ['liquidity','risk','dollar'] },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', venue: 'Binance', pair: 'ETHUSDT', theme: ['liquidity','risk','tech'] },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', venue: 'Binance', pair: 'SOLUSDT', theme: ['risk','tech'] },
  { symbol: 'XRP', name: 'XRP', type: 'crypto', venue: 'Binance', pair: 'XRPUSDT', theme: ['risk','payments'] }
];

const marketAssets = [
  { symbol: 'GOLD', name: 'Gold', type: 'commodity', yahoo: 'GC=F', theme: ['safe-haven','rates','war'] },
  { symbol: 'SILVER', name: 'Silver', type: 'commodity', yahoo: 'SI=F', theme: ['metals','solar','risk'] },
  { symbol: 'COPPER', name: 'Copper', type: 'commodity', yahoo: 'HG=F', theme: ['grid','ai-power','construction'] },
  { symbol: 'BRENT', name: 'Brent Crude', type: 'commodity', yahoo: 'BZ=F', theme: ['energy','shipping','war'] },
  { symbol: 'WTI', name: 'WTI Crude', type: 'commodity', yahoo: 'CL=F', theme: ['energy','shipping','war'] },
  { symbol: 'LMT', name: 'Lockheed Martin', type: 'stock', yahoo: 'LMT', theme: ['defence','war','government-capex'] },
  { symbol: 'RTX', name: 'RTX', type: 'stock', yahoo: 'RTX', theme: ['defence','missiles','government-capex'] },
  { symbol: 'VRT', name: 'Vertiv', type: 'stock', yahoo: 'VRT', theme: ['ai-power','data-centres','cooling'] },
  { symbol: 'PWR', name: 'Quanta Services', type: 'stock', yahoo: 'PWR', theme: ['grid','infrastructure','ai-power'] },
  { symbol: 'ETN', name: 'Eaton', type: 'stock', yahoo: 'ETN', theme: ['grid','electrification','ai-power'] },
  { symbol: 'URA', name: 'Global X Uranium ETF', type: 'etf', yahoo: 'URA', theme: ['uranium','power','energy-security'] },
  { symbol: 'XLE', name: 'Energy Select ETF', type: 'etf', yahoo: 'XLE', theme: ['oil','energy','inflation'] },
  { symbol: 'ITA', name: 'US Aerospace & Defense ETF', type: 'etf', yahoo: 'ITA', theme: ['defence','war','security'] },
  { symbol: 'IYT', name: 'Transportation ETF', type: 'etf', yahoo: 'IYT', theme: ['shipping','logistics','freight'] }
];

const fallbackPrices = {
  BTC: 62200, ETH: 1740, SOL: 82, XRP: 1.13,
  GOLD: 4187, SILVER: 34.2, COPPER: 6.22, BRENT: 72.13, WTI: 68.4,
  LMT: 546, RTX: 147, VRT: 128, PWR: 390, ETN: 372, URA: 43.2, XLE: 88.4, ITA: 148.5, IYT: 68.9
};

module.exports = { cryptoAssets, marketAssets, fallbackPrices };
