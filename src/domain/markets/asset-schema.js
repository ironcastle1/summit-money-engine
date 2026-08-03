import { ValidationError } from '../../core/errors.js';

export const ASSET_CLASSES = Object.freeze(['crypto', 'equity', 'etf', 'index', 'forex', 'commodity']);

function cleanText(value, name, max = 120) {
  const text = String(value ?? '').trim();
  if (!text || text.length > max) throw new ValidationError(`Invalid ${name}`, { name, value });
  return text;
}

function sourceMapping(value = {}) {
  const output = {};
  for (const [source, mapping] of Object.entries(value)) {
    if (!mapping || typeof mapping !== 'object') continue;
    const symbol = String(mapping.symbol || mapping.id || '').trim();
    if (!symbol) continue;
    output[source] = Object.freeze({
      symbol,
      quoteCurrency: String(mapping.quoteCurrency || '').trim() || null,
      exchange: String(mapping.exchange || '').trim() || null
    });
  }
  return Object.freeze(output);
}

export function normalizeAsset(input) {
  if (!input || typeof input !== 'object') throw new ValidationError('Asset must be an object');
  const assetClass = String(input.assetClass || '').toLowerCase();
  if (!ASSET_CLASSES.includes(assetClass)) throw new ValidationError('Unsupported asset class', { assetClass });
  const sources = sourceMapping(input.sources);
  if (!Object.keys(sources).length) throw new ValidationError('Asset requires at least one source mapping');
  return Object.freeze({
    id: cleanText(input.id, 'asset.id', 64).toLowerCase(),
    symbol: cleanText(input.symbol, 'asset.symbol', 24).toUpperCase(),
    name: cleanText(input.name, 'asset.name'),
    assetClass,
    baseCurrency: cleanText(input.baseCurrency || input.symbol, 'asset.baseCurrency', 24).toUpperCase(),
    quoteCurrency: cleanText(input.quoteCurrency || 'USD', 'asset.quoteCurrency', 12).toUpperCase(),
    exchange: String(input.exchange || '').trim() || null,
    region: String(input.region || 'global').trim().toLowerCase(),
    tags: Object.freeze((Array.isArray(input.tags) ? input.tags : []).map(value => String(value).trim().toLowerCase()).filter(Boolean)),
    priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 100,
    enabled: input.enabled !== false,
    sources
  });
}

export function publicAsset(asset) {
  return {
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    assetClass: asset.assetClass,
    baseCurrency: asset.baseCurrency,
    quoteCurrency: asset.quoteCurrency,
    exchange: asset.exchange,
    region: asset.region,
    tags: asset.tags,
    priority: asset.priority,
    enabled: asset.enabled,
    sourceIds: Object.keys(asset.sources)
  };
}
