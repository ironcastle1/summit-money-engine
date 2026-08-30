import { searchWeb } from './connectors/duckduckgo.js';
import { searchNews } from './connectors/google-news.js';
import { enrichPublicPage } from './connectors/page.js';
import { currentUkTrends } from './connectors/google-trends.js';
import { id } from '../util/id.js';

export async function collectMarketEvidence(db, scanRunId, focus = null) {
  let configs = db.prepare('SELECT * FROM market_source_config WHERE enabled=1 ORDER BY id').all();
  if (focus) configs = [{ id: null, name: 'Owner requested scan', source_type: 'search', query: focus }];
  const maxResults = Math.min(15, Math.max(2, Number(process.env.MERLIN_RESEARCH_MAX_RESULTS || 8)));
  const enrich = process.env.MERLIN_RESEARCH_FETCH_PAGES !== 'false';
  const seen = new Set(); const stored = [];
  const insert = db.prepare(`INSERT INTO collected_market_items (id,scan_run_id,source_config_id,query,title,url,publisher,observed_price,currency,snippet,published_at,evidence_type,raw_json)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const cfg of configs) {
    const q = cfg.query || focus;
    if (!q) continue;
    let items = [];
    try { items = cfg.source_type === 'trends' ? await currentUkTrends(Math.max(maxResults,20)) : cfg.source_type === 'news' ? await searchNews(q,maxResults) : await searchWeb(q,maxResults); }
    catch (error) { items = [{ title: `Collection failed for ${q}`, url: `merlin://collector-error/${encodeURIComponent(q)}`, snippet: error.message, publisher: 'MERLIN collector', evidence_type: 'collector_error' }]; }
    for (let item of items) {
      const key = String(item.url || '').replace(/\/$/,''); if (seen.has(key)) continue; seen.add(key);
      if (enrich && /^https?:/i.test(item.url) && !['news_rss','trend_feed'].includes(item.evidence_type)) item = await enrichPublicPage(item);
      const iid = id('MKT');
      insert.run(iid,scanRunId,cfg.id,q,item.title||null,item.url,item.publisher||null,item.observed_price??null,item.currency||null,item.snippet||null,item.published_at||null,item.evidence_type||'search_result',JSON.stringify(item));
      stored.push({ id:iid, source_config_id:cfg.id, query:q, ...item });
    }
  }
  return stored;
}
