import { collectMarketEvidence } from './collector.js';
import { id } from '../util/id.js';
import { businessSnapshot } from '../services/snapshot.js';

function domainOf(url){try{return new URL(url).hostname.replace(/^www\./,'');}catch{return null;}}
function parseJson(v,fb=[]){try{return JSON.parse(v||JSON.stringify(fb));}catch{return fb;}}
function storeSourceRefs(db,items){
  const map=new Map();
  const insert=db.prepare('INSERT INTO research_sources (id,url,title,publisher,source_type,raw_excerpt) VALUES (?,?,?,?,?,?)');
  for(const i of items){
    if(!/^https?:/i.test(i.url||''))continue;
    let r=db.prepare('SELECT id FROM research_sources WHERE url=? ORDER BY observed_at DESC LIMIT 1').get(i.url);
    if(!r){const sid=id('SRC');insert.run(sid,i.url,i.title||null,i.publisher||null,i.evidence_type||'web',i.snippet||null);r={id:sid};}
    map.set(i.id,r.id);
  }
  return map;
}
function group(items){
  const m=new Map();
  for(const i of items){const k=i.source_config_id||`${i.region||''}|${i.category||''}|${i.query||'market'}`;if(!m.has(k))m.set(k,[]);m.get(k).push(i);}return [...m.values()];
}
function isMarketplace(url=''){return /etsy\.|amazon\.|ebay\.|notonthehighstreet/i.test(url||'');}
function reasonForQuery(query,snapshot){
  const q=String(query||'').toLowerCase();
  const wallHeavy=(snapshot.facts||[]).some(f=>f.fact_key==='current_file_bias');
  if(/supplier|steel|paint|primer/.test(q)) return 'Useful because it affects what your current jobs cost to make.';
  if(/business sign|logo|restaurant|cafe|hotel|shopfront/.test(q)) return 'Useful because it points toward signs you can sell to real local businesses, not just wall art buyers.';
  if(/bracket|bookend|functional|workshop/.test(q)) return 'Useful because it checks non-wall-art products your present flat-sheet setup may handle.';
  if(/garden|stake|trellis/.test(q)) return 'Useful because garden products widen the catalogue without needing a whole new machine.';
  if(/house number|address plaque/.test(q)) return 'Useful because house numbers and address plaques are repeatable products.';
  if(wallHeavy) return 'Useful only if it adds something different from the wall-art-heavy designs already in the file library.';
  return 'Useful if it shows a product family, price level or style worth testing on your current setup.';
}
function diverseExamples(rows,max=5){
  const direct=[];const usedDomains=new Set();
  const ordered=[...rows].sort((a,b)=>Number(isMarketplace(a.url))-Number(isMarketplace(b.url))||String(a.title||'').localeCompare(String(b.title||'')));
  for(const r of ordered){
    const d=domainOf(r.url)||'unknown';
    if(usedDomains.has(d)&&direct.length>=Math.ceil(max/2)) continue;
    usedDomains.add(d);
    const price=r.observed_price!=null?` — ${r.currency||''} ${Number(r.observed_price).toFixed(2)}`:'';
    direct.push(`${r.title||r.query}${price}${r.publisher?` (${r.publisher})`:''}`.trim());
    if(direct.length>=max) break;
  }
  return direct;
}
function summariseGroup(rows,snapshot,sourceMap){
  const real=rows.filter(r=>/^https?:/i.test(r.url||''));
  if(!real.length) return null;
  const domains=[...new Set(real.map(r=>domainOf(r.url)).filter(Boolean))];
  const priceRows=real.filter(r=>Number.isFinite(Number(r.observed_price)));
  const sourceIds=[...new Set(real.map(r=>sourceMap.get(r.id)).filter(Boolean))];
  const prices=priceRows.map(r=>Number(r.observed_price)).sort((a,b)=>a-b);
  const priceText=prices.length?`Price evidence found on ${priceRows.length} result${priceRows.length===1?'':'s'}: ${(priceRows[0].currency||'GBP')} ${prices[0].toFixed(2)} to ${prices.at(-1).toFixed(2)}.`:'No clean price was parsed from the current result sample.';
  const nonMarket=real.filter(r=>!isMarketplace(r.url));
  const observation=`Seen ${real.length} public result${real.length===1?'':'s'} across ${domains.length} site${domains.length===1?'':'s'}. ${priceText}`;
  return {
    topic:rows[0]?.query||'Market evidence',
    region:rows[0]?.region||'Unspecified',
    category:rows[0]?.category||null,
    observation,
    why_valuable:reasonForQuery(rows[0]?.query||'',snapshot),
    direct_evidence:diverseExamples(real,5),
    supporting_evidence:[
      `Source mix: ${domains.slice(0,10).join(', ')}${domains.length>10?'…':''}.`,
      `${nonMarket.length} non-marketplace source${nonMarket.length===1?'':'s'} in this sample.`
    ],
    unknowns:[
      'Search results do not prove sales volume or profit.',
      'A product idea still needs a geometry and manufacturability check before you treat it as makeable.'
    ],
    suggested_test:'If it still looks useful, make one measured draft product and compare material cost, cut time and likely selling price.',
    sourceIds,
    evidence_meta:{result_count:real.length,domain_count:domains.length,price_count:priceRows.length,non_marketplace_count:nonMarket.length}
  };
}
function insertObservation(db,obs){
  const oid=id('OBS');
  db.prepare(`INSERT INTO market_observations (id,topic,observation,why_valuable,direct_evidence_json,supporting_evidence_json,unknowns_json,suggested_test,applicable_now,source_ids_json,region,category,watch_status) VALUES (?,?,?,?,?,?,?,?,1,?,?,?,'new')`).run(oid,obs.topic,obs.observation,obs.why_valuable||null,JSON.stringify(obs.direct_evidence||[]),JSON.stringify(obs.supporting_evidence||[]),JSON.stringify(obs.unknowns||[]),obs.suggested_test||null,JSON.stringify(obs.sourceIds||[]),obs.region||null,obs.category||null);
  return oid;
}
export async function runMarketResearch(db,options={}){
  options=options||{};
  const focus=typeof options==='string'?options:options.focus||null;
  const label=focus||[options.region,options.category].filter(Boolean).join(' / ')||'scheduled global market scan';
  const runId=id('SCAN');
  db.prepare("INSERT INTO market_scan_runs (id,focus,status) VALUES (?,?,'running')").run(runId,label);
  try{
    const items=await collectMarketEvidence(db,runId,options);
    const sourceMap=storeSourceRefs(db,items),snapshot=businessSnapshot(db),inserted=[];
    for(const rows of group(items)){const obs=summariseGroup(rows,snapshot,sourceMap);if(obs)inserted.push(insertObservation(db,obs));}
    db.prepare("UPDATE market_scan_runs SET status='success',source_count=?,observation_count=?,completed_at=CURRENT_TIMESTAMP WHERE id=?").run(items.length,inserted.length,runId);
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(new Date().toISOString());
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_status','success') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run();
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_error','') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run();
    return {run_id:runId,evidence_count:items.length,observation_ids:inserted,analysis_mode:'plain-english-evidence'};
  }catch(error){
    db.prepare("UPDATE market_scan_runs SET status='failed',error=?,completed_at=CURRENT_TIMESTAMP WHERE id=?").run(error.message,runId);
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_status','failed') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run();
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_error',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(error.message);
    throw error;
  }
}
export function rawMarketEvidence(db,limit=120){return db.prepare('SELECT id,query,title,url,publisher,observed_price,currency,snippet,published_at,evidence_type,collected_at,region,category FROM collected_market_items ORDER BY collected_at DESC LIMIT ?').all(Math.min(500,Math.max(1,Number(limit||120))));}
export function opportunityWatch(db,{limit=40,region=null,category=null,status=null}={}){
  const where=['applicable_now=1'],args=[];
  if(region&&region!=='Worldwide'){where.push('region=?');args.push(region);}
  if(category&&category!=='all'){where.push('category=?');args.push(category);}
  if(status){where.push('watch_status=?');args.push(status);}
  args.push(500);
  const obs=db.prepare(`SELECT * FROM market_observations WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ?`).all(...args);
  const rows=obs.map(o=>{
    const direct=parseJson(o.direct_evidence_json,[]),support=parseJson(o.supporting_evidence_json,[]),unknowns=parseJson(o.unknowns_json,[]),sourceIds=parseJson(o.source_ids_json,[]),sources=sourceIds.map(sid=>db.prepare('SELECT id,url,title,publisher,observed_at FROM research_sources WHERE id=?').get(sid)).filter(Boolean),domains=[...new Set(sources.map(s=>domainOf(s.url)).filter(Boolean))],nonMarket=sources.filter(s=>!isMarketplace(s.url));
    return {...o,direct_evidence:direct,supporting_evidence:support,unknowns,sources,domain_count:domains.length,non_marketplace_count:nonMarket.length};
  });
  rows.sort((a,b)=>b.non_marketplace_count-a.non_marketplace_count||b.domain_count-a.domain_count||new Date(b.created_at)-new Date(a.created_at));
  return rows.slice(0,Math.min(200,Math.max(1,Number(limit||40))));
}
export function marketCoverage(db){return {regions:db.prepare(`SELECT COALESCE(region,'Unspecified') region,COUNT(*) sources,SUM(CASE WHEN enabled=1 THEN 1 ELSE 0 END) enabled FROM market_source_config GROUP BY region ORDER BY region`).all(),categories:db.prepare(`SELECT COALESCE(category,'general') category,COUNT(*) sources FROM market_source_config WHERE enabled=1 GROUP BY category ORDER BY category`).all(),latest:db.prepare(`SELECT region,category,COUNT(*) evidence,MAX(collected_at) last_collected FROM collected_market_items GROUP BY region,category ORDER BY last_collected DESC LIMIT 100`).all()};}
