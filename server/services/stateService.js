const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const EventEmitter = require('events');
const bus = new EventEmitter();
bus.setMaxListeners(200);

const VERSION = 'SUMMIT-MONEY-ENGINE-PART3-MAP-EVENTS-RAPID-RISE';

const INITIAL = {
  version: VERSION,
  updatedAt: null,
  refreshCount: 0,
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
  const next = {
    ...current,
    ...patch,
    refreshCount: (current.refreshCount || 0) + 1,
    updatedAt: new Date().toISOString()
  };
  cache.set('state', next, 0);
  bus.emit('state', next);
  return next;
}

function onState(handler) {
  bus.on('state', handler);
  return () => bus.off('state', handler);
}

module.exports = { getState, setState, onState, VERSION };
