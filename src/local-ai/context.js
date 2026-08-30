import { businessSnapshot } from '../services/snapshot.js';

function trimRows(rows, n) { return Array.isArray(rows) ? rows.slice(0, n) : rows; }

export function buildBusinessContext(db, message = '') {
  const s = businessSnapshot(db);
  const facts = db.prepare("SELECT category,fact_key,fact_value,source,confidence,updated_at FROM memory_facts WHERE active=1 ORDER BY updated_at DESC LIMIT 200").all();
  const activity = db.prepare("SELECT event_type,title,detail,created_at FROM business_events ORDER BY created_at DESC LIMIT 80").all();
  const docs = searchKnowledge(db, message, 20);
  return {
    profile: s.profile,
    machines: s.machines,
    capabilities: s.capabilities,
    inventory: trimRows(s.inventory, 150),
    products: trimRows(s.products, 150),
    openOrders: trimRows(s.openOrders, 100),
    recentRuns: trimRows(s.recentRuns, 40),
    recentSales: trimRows(s.recentSales, 40),
    recentMarket: trimRows(s.recentMarket, 30),
    recentRawMarketEvidence: db.prepare('SELECT query,title,url,publisher,observed_price,currency,snippet,collected_at FROM collected_market_items ORDER BY collected_at DESC LIMIT 40').all(),
    facts,
    activity,
    relevantKnowledge: docs
  };
}

export function searchKnowledge(db, query, limit = 20) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const tokens = [...new Set(q.match(/[a-z0-9£.-]{3,}/g) || [])].slice(0, 10);
  const needle = `%${tokens[0] || q}%`;
  const out = [];
  const push = (kind, rows, titleKey, bodyFn, refKey='id') => {
    for (const r of rows) out.push({ id: `${kind}:${r[refKey]}`, kind, title: r[titleKey] || kind, body: bodyFn(r), source_ref: r[refKey], updated_at: r.updated_at || r.created_at || null });
  };
  push('memory_fact', db.prepare("SELECT id,category,fact_key,fact_value,updated_at FROM memory_facts WHERE active=1 AND lower(category||' '||fact_key||' '||fact_value) LIKE ? ORDER BY updated_at DESC LIMIT ?").all(needle,limit), 'fact_key', r => `${r.category}: ${r.fact_value}`);
  push('product', db.prepare("SELECT id,product_code,name,category,notes,updated_at FROM products WHERE lower(product_code||' '||name||' '||COALESCE(category,'')||' '||COALESCE(notes,'')) LIKE ? ORDER BY updated_at DESC LIMIT ?").all(needle,limit), 'name', r => `${r.product_code} ${r.category||''} ${r.notes||''}`);
  push('inventory', db.prepare("SELECT id,name,kind,unit,quantity_on_hand,unit_cost,location,updated_at FROM inventory_items WHERE active=1 AND lower(name||' '||kind||' '||COALESCE(location,'')) LIKE ? ORDER BY updated_at DESC LIMIT ?").all(needle,limit), 'name', r => `${r.kind}; ${r.quantity_on_hand} ${r.unit}; unit cost ${r.unit_cost??'unknown'}; location ${r.location||'unknown'}`);
  push('order', db.prepare("SELECT id,external_order_id,customer_reference,status,gross_total,currency,due_at,notes,ordered_at created_at FROM orders WHERE lower(COALESCE(external_order_id,'')||' '||COALESCE(customer_reference,'')||' '||status||' '||COALESCE(notes,'')) LIKE ? ORDER BY ordered_at DESC LIMIT ?").all(needle,limit), 'external_order_id', r => `${r.status}; customer ${r.customer_reference||'unknown'}; total ${r.gross_total??'unknown'} ${r.currency||''}; due ${r.due_at||'unknown'}; ${r.notes||''}`);
  push('production', db.prepare("SELECT pr.id,pr.quantity,pr.cut_seconds,pr.cleanup_seconds,pr.finishing_seconds,pr.packaging_seconds,pr.success,pr.notes,pr.created_at,p.product_code,p.name product_name FROM production_runs pr LEFT JOIN products p ON p.id=pr.product_id WHERE lower(COALESCE(p.product_code,'')||' '||COALESCE(p.name,'')||' '||COALESCE(pr.notes,'')) LIKE ? ORDER BY pr.created_at DESC LIMIT ?").all(needle,limit), 'product_name', r => `${r.product_code||''}; qty ${r.quantity}; cut ${r.cut_seconds??'unknown'}s; cleanup ${r.cleanup_seconds??'unknown'}s; finishing ${r.finishing_seconds??'unknown'}s; success ${r.success}`);
  push('market', db.prepare("SELECT id,topic,observation,why_valuable,created_at FROM market_observations WHERE lower(topic||' '||observation||' '||COALESCE(why_valuable,'')) LIKE ? ORDER BY created_at DESC LIMIT ?").all(needle,limit), 'topic', r => `${r.observation} ${r.why_valuable||''}`);
  push('event', db.prepare("SELECT id,title,detail,event_type,created_at FROM business_events WHERE lower(title||' '||COALESCE(detail,'')||' '||event_type) LIKE ? ORDER BY created_at DESC LIMIT ?").all(needle,limit), 'title', r => `${r.event_type}: ${r.detail||''}`);
  const docs = db.prepare("SELECT id,kind,title,body,source_ref,updated_at FROM knowledge_documents WHERE lower(title||' '||body) LIKE ? ORDER BY updated_at DESC LIMIT ?").all(needle,limit);
  out.push(...docs);
  return out.slice(0, Math.min(50, Math.max(1, limit)));
}

export function upsertKnowledge(db, { id, kind, title, body, source_ref = null }) {
  db.prepare(`INSERT INTO knowledge_documents (id,kind,title,body,source_ref) VALUES (?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,title=excluded.title,body=excluded.body,source_ref=excluded.source_ref,updated_at=CURRENT_TIMESTAMP`)
    .run(id, kind, title, body, source_ref);
}
