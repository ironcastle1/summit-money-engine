const { getJson } = require('../utils/http');

const FEEDS = [
  { source: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
  { source: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { source: 'Reuters Top', url: 'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best' }
];

const FALLBACK_NEWS = [
  { source:'engine', title:'Red Sea freight pressure keeps shipping, fuel and insurance on watch', url:'#', publishedAt:new Date().toISOString(), themes:['shipping','oil','insurance'] },
  { source:'engine', title:'AI data-centre power demand keeps grid equipment and copper on watch', url:'#', publishedAt:new Date().toISOString(), themes:['ai-power','copper','grid'] },
  { source:'engine', title:'Defence procurement cycle supports aerospace and missile supply chains', url:'#', publishedAt:new Date().toISOString(), themes:['defence','security'] }
];

function extractItems(xml, source) {
  const items = [];
  const parts = String(xml).split(/<item>/i).slice(1, 16);
  for (const p of parts) {
    const title = (p.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s) || p.match(/<title>(.*?)<\/title>/s) || [])[1];
    const link = (p.match(/<link>(.*?)<\/link>/s) || [])[1];
    const pubDate = (p.match(/<pubDate>(.*?)<\/pubDate>/s) || [])[1];
    if (title) items.push({ source, title: title.replace(/<[^>]+>/g,''), url: link || '#', publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(), themes: inferThemes(title) });
  }
  return items;
}

function inferThemes(text) {
  const t = String(text).toLowerCase();
  const map = [
    ['oil',['oil','brent','energy']], ['ship',['shipping','freight','ports']], ['war',['defence','safe-haven']], ['tariff',['tariff','trade']], ['ai',['ai-power','semiconductors']], ['hurricane',['disaster','insurance']], ['rate',['rates','dollar']], ['inflation',['rates','gold']], ['china',['china','trade']], ['copper',['copper','grid']]
  ];
  const out = [];
  for (const [k, arr] of map) if (t.includes(k)) out.push(...arr);
  return [...new Set(out)];
}

async function fetchNews() {
  const out = [];
  for (const f of FEEDS) {
    try {
      const xml = await getJson(f.url, { headers: { Accept: 'text/xml,application/rss+xml,*/*' } });
      out.push(...extractItems(xml, f.source));
    } catch (_) {}
  }
  return out.length ? out.slice(0, 40) : FALLBACK_NEWS;
}

module.exports = { fetchNews };
