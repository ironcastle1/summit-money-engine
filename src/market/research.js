import { collectMarketEvidence } from './collector.js';
import { generateLocal, localAiStatus } from '../local-ai/client.js';
import { businessSnapshot } from '../services/snapshot.js';
import { id } from '../util/id.js';

function parseJson(text) {
  const raw = String(text || '').trim();
  try { return JSON.parse(raw); } catch {}
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(raw.slice(a,b+1)); } catch {} }
  throw new Error('Local AI did not return parseable JSON. Raw evidence was still stored.');
}
function groupEvidence(items) {
  const map = new Map();
  for (const i of items) { const key = i.query || 'Market evidence'; if (!map.has(key)) map.set(key,[]); map.get(key).push(i); }
  return [...map.entries()].map(([query,rows]) => ({ query, rows: rows.slice(0,8).map(r => ({ id:r.id,title:r.title,url:r.url,publisher:r.publisher,price:r.observed_price,currency:r.currency,snippet:r.snippet,published_at:r.published_at,evidence_type:r.evidence_type })) }));
}
function insertObservation(db, obs, sourceIds = []) {
  const oid = id('OBS');
  db.prepare(`INSERT INTO market_observations (id,topic,observation,why_valuable,direct_evidence_json,supporting_evidence_json,unknowns_json,suggested_test,applicable_now,source_ids_json)
    VALUES (?,?,?,?,?,?,?,?,1,?)`).run(oid,obs.topic,obs.observation,obs.why_valuable||null,JSON.stringify(obs.direct_evidence||[]),JSON.stringify(obs.supporting_evidence||[]),JSON.stringify(obs.unknowns||[]),obs.suggested_test||null,JSON.stringify(sourceIds));
  return oid;
}
function storeSourceRefs(db, items) {
  const ids = new Map();
  const insert = db.prepare('INSERT INTO research_sources (id,url,title,publisher,source_type,raw_excerpt) VALUES (?,?,?,?,?,?)');
  for (const i of items) {
    if (!/^https?:/i.test(i.url)) continue;
    let r = db.prepare('SELECT id FROM research_sources WHERE url=? ORDER BY observed_at DESC LIMIT 1').get(i.url);
    if (!r) { const sid=id('SRC'); insert.run(sid,i.url,i.title||null,i.publisher||null,i.evidence_type||'web',i.snippet||null); r={id:sid}; }
    ids.set(i.id,r.id);
  }
  return ids;
}


function insertDeterministicEvidenceSummaries(db, items, sourceMap) {
  const groups = groupEvidence(items);
  const inserted = [];
  for (const g of groups) {
    const real = g.rows.filter(r => /^https?:/i.test(r.url || ''));
    if (!real.length) continue;
    const examples = real.slice(0,5).map(r => {
      const price = r.price != null ? ` at an observed page price of £${Number(r.price).toFixed(2)}` : '';
      return `${r.title}${price}${r.publisher ? ` (${r.publisher})` : ''}`;
    });
    const sourceIds = [...new Set(real.map(r => sourceMap.get(r.id)).filter(Boolean))];
    inserted.push(insertObservation(db, {
      topic: g.query,
      observation: `MERLIN collected ${real.length} current public result${real.length===1?'':'s'} for this query. This establishes current web presence only; it does not by itself establish sales or demand.`,
      why_valuable: 'The sources provide current products, prices, suppliers or reporting that can be inspected against the present CNC setup without inventing a market score.',
      direct_evidence: examples,
      supporting_evidence: [],
      unknowns: ['Search-result presence does not establish units sold, conversion rate, profitability or unmet demand unless a cited source directly provides those facts.'],
      suggested_test: 'Inspect the cited results and, if the product is compatible with the current machine, validate with a small prototype/listing rather than assuming demand.'
    }, sourceIds));
  }
  return inserted;
}

export async function runMarketResearch(db, focus = null) {
  const runId = id('SCAN');
  db.prepare('INSERT INTO market_scan_runs (id,focus,status) VALUES (?,?,\'running\')').run(runId,focus||'scheduled current-stage market scan');
  try {
    const items = await collectMarketEvidence(db,runId,focus);
    const sourceMap = storeSourceRefs(db,items);
    const ai = await localAiStatus(db);
    const inserted=[];
    if (ai.online && ai.model_installed && items.length) {
      const snapshot = businessSnapshot(db);
      const grouped = groupEvidence(items);
      const businessForResearch = {
        machines: snapshot.machines,
        capabilities: snapshot.capabilities,
        inventory: snapshot.inventory.slice(0,100),
        products: snapshot.products.slice(0,80),
        openOrders: snapshot.openOrders.slice(0,50)
      };
      const batchSize = 4;
      const analysisErrors = [];
      for (let offset=0; offset<grouped.length; offset+=batchSize) {
        const batch=grouped.slice(offset,offset+batchSize);
        const prompt = `Analyse ONLY the supplied collected public evidence for this CURRENT CNC plasma business. Do not score or rank with invented numbers. Do not claim sales/demand unless a source directly establishes it. Distinguish observed facts from inference. Ignore hypothetical future expansion and equipment not in the business state.

CURRENT BUSINESS STATE:\n${JSON.stringify(businessForResearch,null,2)}

COLLECTED EVIDENCE BATCH:\n${JSON.stringify(batch,null,2)}

Return ONLY JSON:
{"observations":[{"topic":"...","observation":"facts actually observed across the supplied sources","why_valuable":"why those facts may matter to the current operation","direct_evidence":["specific factual statements"],"supporting_evidence":[],"unknowns":["things not established"],"suggested_test":"small validation action or null","evidence_item_ids":["MKT-..."]}]}
Keep every observation tied to evidence item ids. Reject irrelevant broad trends instead of forcing them into a CNC recommendation. No percentages unless directly present in evidence. No fake estimates.`;
        try {
          const result = await generateLocal({db,prompt,system:'You are MERLIN market analyst. Evidence discipline is mandatory. Output JSON only.',temperature:0.05,format:'json'});
          const payload = parseJson(result?.message?.content || '');
          for (const obs of payload.observations || []) {
            const sourceIds = [...new Set((obs.evidence_item_ids||[]).map(mid=>sourceMap.get(mid)).filter(Boolean))];
            if (!obs.topic || !obs.observation || !sourceIds.length) continue;
            inserted.push(insertObservation(db,obs,sourceIds));
          }
        } catch (error) { analysisErrors.push(error.message); }
      }
      db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_analysis_error',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(analysisErrors.join(' | '));
    }
    if (!inserted.length && items.length) inserted.push(...insertDeterministicEvidenceSummaries(db,items,sourceMap));
    db.prepare("UPDATE market_scan_runs SET status='success',source_count=?,observation_count=?,completed_at=CURRENT_TIMESTAMP WHERE id=?").run(items.length,inserted.length,runId);
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(new Date().toISOString());
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_status','success') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run();
    return {run_id:runId,evidence_count:items.length,observation_ids:inserted,local_ai_used:ai.online&&ai.model_installed};
  } catch (error) {
    db.prepare("UPDATE market_scan_runs SET status='failed',error=?,completed_at=CURRENT_TIMESTAMP WHERE id=?").run(error.message,runId);
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_status','failed') ON CONFLICT(key) DO UPDATE SET value=excluded.value").run();
    db.prepare("INSERT INTO meta (key,value) VALUES ('last_market_research_error',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(error.message);
    throw error;
  }
}

export function rawMarketEvidence(db, limit=60) {
  return db.prepare(`SELECT id,query,title,url,publisher,observed_price,currency,snippet,published_at,evidence_type,collected_at FROM collected_market_items ORDER BY collected_at DESC LIMIT ?`).all(Math.min(250,Math.max(1,Number(limit||60))));
}
