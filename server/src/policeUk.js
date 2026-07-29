const { cachedJson } = require('./http');
const cache = require('./cache');

function previousMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function streetCrime(lat, lng) {
  const date = previousMonth();
  const key = `police:${Number(lat).toFixed(3)}:${Number(lng).toFixed(3)}:${date}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&date=${date}`;
  try {
    const rows = await cachedJson(key + ':remote', url, 24 * 60 * 60 * 1000, 'Police.uk local crime', { timeout: 6500 });
    const categories = {};
    for (const r of rows || []) categories[r.category || 'unknown'] = (categories[r.category || 'unknown'] || 0) + 1;
    const out = { available: true, date, total: rows.length, categories, source: 'data.police.uk' };
    return cache.set(key, out, 24 * 60 * 60 * 1000);
  } catch (err) {
    return cache.set(key, { available: false, date, total: null, categories: {}, source: 'data.police.uk unavailable' }, 20 * 60 * 1000);
  }
}

module.exports = { streetCrime };
