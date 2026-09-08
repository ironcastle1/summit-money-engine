import { searchWeb } from './connectors/duckduckgo.js';
import { searchNews } from './connectors/google-news.js';
import { enrichPublicPage } from './connectors/page.js';
import { currentUkTrends } from './connectors/google-trends.js';
import { id } from '../util/id.js';

const TREND_RELEVANCE=/\b(home|decor|interior|garden|wedding|gift|metal|steel|sign|house|address|gothic|medieval|arabic|wall|art|plant|shelf|garage|workshop|barber|cafe|restaurant|pet|memorial|traditional|industrial|monogram|furniture|kitchen|hotel|business|logo|number)\b/i;
function relevantTrend(item){const related=(item.raw_trend?.news||[]).map(n=>n.title).join(' ');return TREND_RELEVANCE.test(`${item.title||''} ${item.snippet||''} ${related}`);}
function rotate(db,rows,count){if(rows.length<=count)return rows;const row=db.prepare("SELECT value FROM meta WHERE key='market_rotation_index'").get();let start=Number(row?.value||0)%rows.length;const selected=[];for(let i=0;i<count;i++)selected.push(rows[(start+i)%rows.length]);start=(start+count)%rows.length;db.prepare("INSERT INTO meta (key,value) VALUES ('market_rotation_index',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(start));return selected;}

export async function collectMarketEvidence(db,scanRunId,options={}){
  const focus=typeof options==='string'?options:options.focus||null;const region=typeof options==='object'?options.region||null:null;const category=typeof options==='object'?options.category||null:null;const deep=Boolean(typeof options==='object'&&options.deep);
  let configs=db.prepare('SELECT * FROM market_source_config WHERE enabled=1 ORDER BY CASE WHEN region IS NULL THEN 0 ELSE 1 END,id').all();
  if(region&&region!=='Worldwide')configs=configs.filter(c=>String(c.region||'').toLowerCase()===String(region).toLowerCase()||String(c.country_code||'').toLowerCase()===String(region).toLowerCase());
  if(category&&category!=='all')configs=configs.filter(c=>String(c.category||'').toLowerCase()===String(category).toLowerCase()||String(c.name||'').toLowerCase().includes(String(category).toLowerCase()));
  if(focus)configs=[{id:null,name:'Owner requested scan',source_type:'search',query:[focus,region&&region!=='Worldwide'?region:null].filter(Boolean).join(' '),region:region||'Owner focus',country_code:null,category:category||'owner-focus'}];
  else configs=rotate(db,configs,deep?Math.min(120,configs.length):Math.min(Number(process.env.MERLIN_RESEARCH_QUERIES_PER_SCAN||30),configs.length));
  const maxResults=Math.min(20,Math.max(2,Number(process.env.MERLIN_RESEARCH_MAX_RESULTS||8)));const enrich=process.env.MERLIN_RESEARCH_FETCH_PAGES!=='false';const enrichPerQuery=Math.max(0,Math.min(5,Number(process.env.MERLIN_RESEARCH_ENRICH_PER_QUERY||2)));const seen=new Set(),stored=[];
  const insert=db.prepare(`INSERT INTO collected_market_items (id,scan_run_id,source_config_id,query,title,url,publisher,observed_price,currency,snippet,published_at,evidence_type,raw_json,region,category) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for(const cfg of configs){const q=cfg.query||focus;if(!q)continue;let items=[];try{items=cfg.source_type==='trends'?await currentUkTrends(Math.max(maxResults,20)):cfg.source_type==='news'?await searchNews(q,maxResults):await searchWeb(q,maxResults);}catch(error){items=[{title:`Collection failed for ${q}`,url:`merlin://collector-error/${encodeURIComponent(q)}`,snippet:error.message,publisher:'MERLIN collector',evidence_type:'collector_error'}];}
    let enrichedCount=0;for(let item of items){if(cfg.source_type==='trends'&&!relevantTrend(item))continue;const key=`${cfg.region||''}|${String(item.url||'').replace(/\/$/,'')}`;if(seen.has(key))continue;seen.add(key);if(enrich&&enrichedCount<enrichPerQuery&&/^https?:/i.test(item.url)&&!['news_rss','trend_feed'].includes(item.evidence_type)){item=await enrichPublicPage(item);enrichedCount++;}const iid=id('MKT');insert.run(iid,scanRunId,cfg.id,q,item.title||null,item.url,item.publisher||null,item.observed_price??null,item.currency||null,item.snippet||null,item.published_at||null,item.evidence_type||'search_result',JSON.stringify(item),cfg.region||null,cfg.category||null);stored.push({id:iid,source_config_id:cfg.id,query:q,region:cfg.region||null,category:cfg.category||null,...item});}
  }
  return stored;
}
