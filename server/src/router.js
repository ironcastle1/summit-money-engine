const { collectNews } = require('./newsCollectors');
const { collectMarkets } = require('./marketCollectors');
const { buildMorningBrief, buildTrendStreams, opportunityFromNews, OPPORTUNITY_CATEGORIES } = require('./opportunityEngine');
const { areaScan, routeCheck } = require('./areaService');
const { geocode, infrastructure, wikiSummary } = require('./placeCollectors');
const cache = require('./cache');
const { CITY_SEEDS } = require('./citySeeds');
const { searchPlaybooks } = require('./opportunityLibrary');
const { distanceMiles } = require('./util');

async function json(req, res, data, status = 200) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 2_000_000) req.destroy(); });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function urlParts(req) {
  return new URL(req.url, `http://${req.headers.host || 'localhost'}`);
}

async function handleApi(req, res) {
  const url = urlParts(req);
  const path = url.pathname;
  try {
    if (path === '/api/status') return json(req, res, { ok: true, at: new Date().toISOString(), product: 'Summit Info Compiler V10' });
    if (path === '/api/sources') return json(req, res, { sources: cache.getHealth() });
    if (path === '/api/markets') return json(req, res, { markets: await collectMarkets() });
    if (path === '/api/brief') {
      const [news, markets] = await Promise.all([collectNews(), collectMarkets()]);
      return json(req, res, buildMorningBrief(news, markets));
    }
    if (path === '/api/opportunities') {
      const news = await collectNews();
      const category = url.searchParams.get('category') || '';
      const q = String(url.searchParams.get('q') || '').toLowerCase();
      let rows = news.map(opportunityFromNews);
      if (category) rows = rows.filter(x => x.category === category || x.category === category.replace('_','-'));
      if (q) rows = rows.filter(x => `${x.title} ${x.whyItMatters} ${x.actions.join(' ')}`.toLowerCase().includes(q));
      rows.sort((a, b) => b.score - a.score);
      return json(req, res, { categories: OPPORTUNITY_CATEGORIES, opportunities: rows.slice(0, 80) });
    }
    if (path === '/api/trends') {
      const news = await collectNews();
      return json(req, res, { streams: buildTrendStreams(news) });
    }
    if (path === '/api/events') {
      const news = await collectNews();
      return json(req, res, { events: news.filter(n => n.lat && n.lng).slice(0, 150) });
    }
    if (path === '/api/search-place') {
      const q = url.searchParams.get('q') || '';
      return json(req, res, { place: await geocode(q) });
    }
    if (path === '/api/area-scan' && req.method === 'POST') {
      return json(req, res, await areaScan(await readBody(req)));
    }
    if (path === '/api/route-check' && req.method === 'POST') {
      return json(req, res, await routeCheck(await readBody(req)));
    }
    if (path === '/api/infrastructure') {
      const lat = Number(url.searchParams.get('lat'));
      const lng = Number(url.searchParams.get('lng'));
      const r = Number(url.searchParams.get('radius') || 5);
      return json(req, res, { infrastructure: await infrastructure(lat, lng, r) });
    }
    if (path === '/api/wiki') {
      return json(req, res, await wikiSummary(url.searchParams.get('q') || ''));
    }
    if (path === '/api/playbooks') {
      const q = url.searchParams.get('q') || '';
      const limit = Number(url.searchParams.get('limit') || 120);
      return json(req, res, { playbooks: searchPlaybooks(q, limit) });
    }
    if (path === '/api/daily-use') {
      return json(req, res, dailyUseModel());
    }
    return json(req, res, { error: 'API route not found' }, 404);
  } catch (err) {
    return json(req, res, { error: err.message }, 500);
  }
}

function dailyUseModel() {
  return {
    title: 'Daily use model',
    morning: [
      'Open Daily Brief.',
      'Save one useful opportunity lead.',
      'Check market movers only where a real source loaded data.',
      'Run Area Scan or Route Check for any place you care about.'
    ],
    duringDay: [
      'Refresh opportunities after major news cycles.',
      'Use Trend Streams to find niches before they become mainstream.',
      'Turn one signal into a short brief, checklist, lead list or content post.'
    ],
    subscriptionRecovery: [
      'One £20 sale of a short brief or checklist covers the month.',
      'Two to three small lead/research jobs create meaningful upside.',
      'The system does not guarantee income; it supplies leads, angles and source-backed information faster.'
    ]
  };
}

module.exports = { handleApi };
