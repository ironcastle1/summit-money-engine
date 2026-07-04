const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const INITIAL = {
  version: 'SUMMIT-MONEY-ENGINE-PART1-MAP-FIRST',
  updatedAt: null,
  prices: [],
  predictionMarkets: [],
  news: [],
  signals: [],
  engine: {
    status: 'booting',
    lastRefreshMs: 0,
    notes: []
  }
};

cache.set('state', INITIAL, 0);

function getState() {
  return cache.get('state') || INITIAL;
}

function setState(patch) {
  const current = getState();
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  cache.set('state', next, 0);
  return next;
}

module.exports = { getState, setState };
