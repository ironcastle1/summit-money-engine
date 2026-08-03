const cache = new Map();

async function load(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path, { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error(`Preload HTTP ${response.status}`);
      return response.json();
    }));
  }
  return cache.get(path);
}

export const preloadNews = () => load('/data/preload-news.json');
export const preloadShippingCatalog = () => load('/data/preload-shipping-catalog.json');
export const preloadShipping = () => load('/data/preload-shipping.json');
export const preloadIntelligenceCatalog = () => load('/data/preload-intelligence-catalog.json');
export const preloadIntelligence = () => load('/data/preload-intelligence.json');
export const preloadMarketsCatalog = () => load('/data/preload-markets-catalog.json');
export const preloadMarkets = () => load('/data/preload-markets.json');
export const preloadOpportunities = () => load('/data/preload-opportunities.json');
