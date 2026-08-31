import { collectMarketEvidence } from './collector.js';
import { id } from '../util/id.js';
import { businessSnapshot } from '../services/snapshot.js';

function domainOf(url){try{return new URL(url).hostname.replace(/^www\./,'');}catch{return null;}}
function parseJson(v,fb=[]){try{return JSON.parse(v||JSON.stringify(fb));}catch{return fb;}}
function storeSourceRefs(db,items){
  const map=new Map();const insert=db.prepare('INSERT INTO research_sources (id,url,title,publisher,source_type,raw_excerpt) VALUES (?,?,?,?,?,?)');
  for(const i of items){
    if(!/^https?:/i.test(i.url||''))continue;
    let r=db.prepare('SELECT id FROM research_sources WHERE url=? ORDER BY observed_at DESC LIMIT 1').get(i.url);
    if(!r){const sid=id('SRC');insert.run(sid,i.url,i.title||null,i.publisher||null,i.evidence_type||'web',i.snippet||null);r={id:sid};}
    map.set(i.id,r.id);
  }
  return map;
}
function insertObservation(db,obs,sourceIds){
  const oid=id('OBS');db.prepare(`INSERT INTO market_observations (id,topic,observation,why_valuable,direct_evidence_json,supporting_evidence_json,unknowns_json,suggested_test,applicable_now,source_ids_json)
    VALUES (?,?,?,?,?,?,?,?,1,?)`).run(oid,obs.topic,obs.observation,obs.why_valuable||null,JSON.stringify(obs.direct_evidence||[]),JSON.stringify(obs.supporting_evidence||[]),JSON.stringify(obs.unknowns||[]),obs.suggested_test||null,JSON.stringify(sourceIds||[]));return oid;
}
function group(items){
  const m=new Map();for(const i of items){const k=i.source_config_id||i.query||'market';if(!m.has(k))m.set(k,[]);m.get(k).push(i);}return [...m.values()];
}
function reasonForQuery(query,snapshot){
  const q=String(query||'').toLowerCase();
  const wallArtBias=(snapshot.facts||[]).some(f=>f.fact_key==='current_file_bias');
  if(/house number|monogram|personalised metal sign|garden sign|functional|bracket|wedding/.test(q)){
    return wallArtBias
      ? 'This is a non-wall-art product family, so current evidence is useful for testing whether the catalogue should broaden beyond its present wall-art-heavy file library.'
      : 'This monitored category can be compared against the current flat-sheet CNC plasma capability without assuming new machinery.';
  }
  if(/steel supplier|2mm mild steel|paint|primer/.test(q)) return 'This evidence may change current input costs, supplier choices or unit economics for products made on the present table.';
  if(/arabic|french|italian|spanish|phrase|language/.test(q)) return 'This is directly relevant to the planned multilingual catalogue and can be tested using the current table once wording and geometry are verified.';
  if(/wall art|historical/.test(q)) return 'This is relevant to an existing product family, but MERLIN should compare it against non-wall-art opportunities rather than assuming more wall art is automatically the best use of time.';
  return 'The evidence is relevant to products, costs or demand signals that can be inspected against the current CNC operation without assuming future equipment or expansion.';
}
function summariseGroup(rows,snapshot,sourceMap){
  const real=rows.filter(r=>/^https?:/i.test(r.url||''));if(!real.length)return null;
  const domains=[...new Set(real.map(r=>domainOf(r.url)).filter(Boolean))];
  const prices=real.map(r=>Number(r.observed_price)).filter(Number.isFinite).sort((a,b)=>a-b);
  const query=rows[0]?.query||'Market evidence';
  const sourceIds=[...new Set(real.map(r=>sourceMap.get(r.id)).filter(Boolean))];
  const facts=[];
  facts.push(`${real.length} current public result${real.length===1?'':'s'} collected across ${domains.length} distinct domain${domains.length===1?'':'s'}.`);
  if(prices.length) facts.push(`${prices.length} result${prices.length===1?'':'s'} exposed a machine-readable/parseable page price; observed range £${prices[0].toFixed(2)}–£${prices[prices.length-1].toFixed(2)}.`);
  const recent=real.filter(r=>r.published_at&&Date.now()-new Date(r.published_at).getTime()<=90*86400000).length;
  if(recent)facts.push(`${recent} collected result${recent===1?'':'s'} carried a publication date within the last 90 days.`);
  const sample=real.slice(0,5).map(r=>`${r.title}${r.observed_price!=null?` — observed £${Number(r.observed_price).toFixed(2)}`:''}${r.publisher?` (${r.publisher})`:''}`);
  const unknowns=['Search visibility does not establish units sold, conversion rate, profit or unmet demand unless a cited source directly states those facts.','A listed product still requires a geometry/manufacturability check against the current CrossFire setup before it is treated as makeable.'];
  return {
    topic:query,
    observation:facts.join(' '),
    why_valuable:reasonForQuery(query,snapshot),
    direct_evidence:sample,
    supporting_evidence:domains.length>1?[`Evidence was collected from multiple domains: ${domains.slice(0,8).join(', ')}.`]:[],
    unknowns,
    suggested_test:/supplier|paint|primer/i.test(query)?'Compare the cited delivered prices with the current recorded supplier cost before changing procurement.':'Inspect the cited products, reject anything outside current manufacturing constraints, then test a small number of the strongest directly comparable product concepts rather than assuming demand.',
    sourceIds,
    evidence_meta:{result_count:real.length,domain_count:domains.length,price_count:prices.length,recent_count:recent,price_min:prices[0]??null,price_max:prices[prices.length-1]??null}
  };
}

export async function runMarketResearch(db,focus=null){
  const runId=id('SCAN');db.prepare("INSERT INTO market_scan_runs (id,focus,status) VALUES (?,?, 'running')").run(runId,focus||'scheduled current-stage market scan');
  try{
    const items=await collectMarketEvidence(db,runId,focus);const sourceMap=storeSourceRefs(db,items);const snapshot=businessSnapshot(db);const inserted=[];
    for(const rows of group(items)){
      const obs=summariseGroup(rows,snapshot,sourceMap);if(!obs)continue;inserted.push(insertObservation(db,obs,obs.sourceIds));
    }
    db.prepare("UPDATE market_scan_runs SET status='success',source_count=?,observation_count=?,completed_at=CURRENT_TIMESTAMP WHERE id=?").run(items.length,inserted.length,runId);
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(new Date().toISOString());
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_status','success') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run();
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_error','') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run();
    return {run_id:runId,evidence_count:items.length,observation_ids:inserted,analysis_mode:'deterministic-evidence-summary'};
  }catch(error){
    db.prepare("UPDATE market_scan_runs SET status='failed',error=?,completed_at=CURRENT_TIMESTAMP WHERE id=?").run(error.message,runId);
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_status','failed') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run();
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_error',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(error.message);
    throw error;
  }
}
export function rawMarketEvidence(db,limit=80){return db.prepare('SELECT id,query,title,url,publisher,observed_price,currency,snippet,published_at,evidence_type,collected_at FROM collected_market_items ORDER BY collected_at DESC LIMIT ?').all(Math.min(250,Math.max(1,Number(limit||80))));}

export function opportunityWatch(db,limit=20){
  const obs=db.prepare('SELECT * FROM market_observations WHERE applicable_now=1 ORDER BY created_at DESC LIMIT 200').all();
  const rows=obs.map(o=>{
    const direct=parseJson(o.direct_evidence_json,[]),support=parseJson(o.supporting_evidence_json,[]),unknowns=parseJson(o.unknowns_json,[]),sourceIds=parseJson(o.source_ids_json,[]);
    const sources=sourceIds.map(sid=>db.prepare('SELECT id,url,title,publisher,observed_at FROM research_sources WHERE id=?').get(sid)).filter(Boolean);
    const domains=[...new Set(sources.map(s=>domainOf(s.url)).filter(Boolean))];
    const priceMatches=direct.map(x=>String(x).match(/observed £(\d+(?:\.\d+)?)/i)).filter(Boolean).map(m=>Number(m[1]));
    return {...o,direct_evidence:direct,supporting_evidence:support,unknowns,sources,domain_count:domains.length,price_evidence_count:priceMatches.length,latest_source_at:sources.map(s=>s.observed_at).sort().at(-1)||o.created_at};
  });
  // Ordering is transparent and factual: first observations with direct price evidence, then multi-domain evidence, then newest.
  rows.sort((a,b)=>Number(b.price_evidence_count>0)-Number(a.price_evidence_count>0)||b.domain_count-a.domain_count||new Date(b.created_at)-new Date(a.created_at));
  return rows.slice(0,Math.min(100,Math.max(1,Number(limit||20))));
}
