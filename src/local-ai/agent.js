import { chatLocal, localAiStatus } from './client.js';
import { systemPrompt } from './system-prompt.js';
import { buildBusinessContext } from './context.js';
import { toolDefinitions, executeTool } from './tools.js';
import { parseDeterministicCommand } from './intent-parser.js';
import { id } from '../util/id.js';

function logMessage(db, threadId, role, content, toolName = null, payload = null) {
  const mid = id('MSG');
  db.prepare(`INSERT INTO chat_messages (id,thread_id,role,content,tool_name,tool_payload_json) VALUES (?,?,?,?,?,?)`).run(mid, threadId, role, String(content || ''), toolName, payload ? JSON.stringify(payload) : null);
  return mid;
}
function ensureThread(db, threadId) {
  if (threadId && db.prepare('SELECT id FROM chat_threads WHERE id=?').get(threadId)) return threadId;
  const tid = id('CHAT'); db.prepare("INSERT INTO chat_threads (id,title) VALUES (?,'MERLIN')").run(tid); return tid;
}
function fallbackToolCall(content) {
  const text = String(content || '').trim();
  const tagged = text.match(/<MERLIN_TOOL>\s*([\s\S]*?)\s*<\/MERLIN_TOOL>/i);
  const candidate = tagged?.[1] || (text.startsWith('{') && text.endsWith('}') ? text : null);
  if (!candidate) return null;
  try {
    const p = JSON.parse(candidate);
    if (p?.name && p?.arguments && typeof p.arguments === 'object') return { function: { name: p.name, arguments: p.arguments } };
    if (p?.tool && p?.arguments && typeof p.arguments === 'object') return { function: { name: p.tool, arguments: p.arguments } };
  } catch {}
  return null;
}

function recentMessages(db, threadId, limit = 24) {
  return db.prepare('SELECT role,content FROM chat_messages WHERE thread_id=? AND role IN (\'user\',\'assistant\') ORDER BY created_at DESC LIMIT ?').all(threadId, limit).reverse();
}
async function deterministicMutation(db, parsed) {
  if (!parsed) return null;
  if (parsed.kind === 'inventory_query') {
    let rows = await executeTool(db,'read_inventory',{kind:parsed.data.kind||null});
    if (!rows.length) return parsed.data.kind ? 'No matching raw material is recorded.' : 'No inventory is recorded.';
    return rows.map(i => `${i.name}: ${Number(i.available_quantity ?? i.quantity_on_hand ?? 0)} ${i.unit}${i.thickness_mm!=null?`; ${i.thickness_mm} mm`:''}${i.width_mm!=null&&i.height_mm!=null?`; ${i.width_mm} × ${i.height_mm} mm`:''}${i.unit_cost!=null?`; £${Number(i.unit_cost).toFixed(2)} per ${i.unit}`:''}`).join('\n');
  }
  if (parsed.kind === 'low_stock_query') {
    const rows=db.prepare(`SELECT name,unit,(quantity_on_hand-quantity_reserved) available_quantity,reorder_point FROM inventory_items WHERE active=1 AND reorder_point IS NOT NULL AND (quantity_on_hand-quantity_reserved)<=reorder_point ORDER BY available_quantity`).all();
    return rows.length ? rows.map(i=>`${i.name}: ${i.available_quantity} ${i.unit} available; reorder point ${i.reorder_point}`).join('\n') : 'No recorded inventory item is currently at or below its reorder point.';
  }
  if (parsed.kind === 'orders_query') {
    const rows=await executeTool(db,'read_open_orders',{}); if(!rows.length)return 'There are no open orders recorded.';
    return rows.map(o=>`${o.external_order_id||o.id}: ${o.status}${o.customer_reference?`; ${o.customer_reference}`:''}${o.due_at?`; due ${o.due_at}`:''}${o.gross_total!=null?`; £${Number(o.gross_total).toFixed(2)}`:''}`).join('\n');
  }
  if (parsed.kind === 'products_query') {
    const rows=await executeTool(db,'read_products',{}); if(!rows.length)return 'There are no products recorded.';
    return rows.map(p=>`${p.product_code}: ${p.name}${p.category?` — ${p.category}`:''}; ${p.status}`).join('\n');
  }
  if (parsed.kind === 'finance_query') {
    const revenue=db.prepare("SELECT COALESCE(SUM(gross_revenue-refunds),0) v FROM sales_events WHERE date(sold_at)>=date('now','start of month')").get().v;
    const expenses=db.prepare("SELECT COALESCE(SUM(amount),0) v FROM expenses WHERE date(occurred_at)>=date('now','start of month')").get().v;
    return `Recorded revenue this month: £${Number(revenue||0).toFixed(2)}. Recorded expenses this month: £${Number(expenses||0).toFixed(2)}.`;
  }
  if (parsed.kind === 'inventory_material') {
    const d = { ...parsed.data };
    if (d.cost_is_total && d.unit_cost != null && d.quantity_on_hand) d.unit_cost = d.unit_cost / d.quantity_on_hand;
    delete d.cost_is_total; delete d.source_text;
    const item = await executeTool(db,'create_inventory_item',d);
    return `Recorded ${item.quantity_on_hand} ${item.unit}${item.quantity_on_hand===1?'':'s'} of ${item.name}${item.thickness_mm!=null?` (${item.thickness_mm} mm)`:''}${item.width_mm!=null&&item.height_mm!=null?` ${item.width_mm} × ${item.height_mm} mm`:''}${item.unit_cost!=null?` at £${Number(item.unit_cost).toFixed(2)} per ${item.unit}`:''}.`;
  }
  if (parsed.kind === 'expense') { const r = await executeTool(db,'record_expense',parsed.data); return `Recorded expense: ${r.description} — £${Number(r.amount).toFixed(2)}.`; }
  return null;
}

export async function chatWithMerlin(db, { message, thread_id = null }) {
  const threadId = ensureThread(db, thread_id);
  const priorMessages = recentMessages(db, threadId, 18);
  logMessage(db,threadId,'user',message);

  const parsed = parseDeterministicCommand(message);
  const direct = await deterministicMutation(db, parsed);
  if (direct) { logMessage(db,threadId,'assistant',direct); return { thread_id: threadId, text: direct, mode: 'deterministic-business-command', tools_used: [], sources: [] }; }

  const status = await localAiStatus(db);
  if (!status.online || !status.model_installed) {
    const text = !status.online
      ? `Local MERLIN AI is not running. Start the local AI runtime, then refresh. Database, DXF, orders, inventory and market collectors still work without it. (${status.error || 'runtime unavailable'})`
      : `Local MERLIN AI is running, but model ${status.model} is not installed. Run the included local-AI setup script or pull that model in the local runtime.`;
    logMessage(db,threadId,'assistant',text); return { thread_id: threadId, text, mode: 'offline', status };
  }

  const context = buildBusinessContext(db, message);
  const messages = [
    { role: 'system', content: systemPrompt() },
    { role: 'system', content: `CURRENT MERLIN BUSINESS CONTEXT (database truth; unknown fields are intentionally unknown):\n${JSON.stringify(context)}` },
    ...priorMessages,
    { role: 'user', content: message }
  ];

  const toolsUsed = [];
  let response = await chatLocal({ db, messages, tools: toolDefinitions, temperature: 0.1 });
  for (let step = 0; step < 6; step++) {
    const m = response?.message || {};
    let calls = m.tool_calls || [];
    if (!calls.length) {
      const fallback = fallbackToolCall(m.content);
      if (fallback) calls = [fallback];
    }
    if (!calls.length) {
      const text = String(m.content || '').trim() || 'I do not have enough grounded information to answer that yet.';
      logMessage(db,threadId,'assistant',text);
      return { thread_id: threadId, text, mode: 'local-ai', model: status.model, tools_used: toolsUsed };
    }
    messages.push(m);
    for (const call of calls) {
      const name = call.function?.name;
      let args = call.function?.arguments || {};
      if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = {}; } }
      let result;
      try { result = await executeTool(db,name,args); }
      catch (error) { result = { error: error.message }; }
      toolsUsed.push({ name, args });
      logMessage(db,threadId,'tool',JSON.stringify(result),name,args);
      messages.push({ role: 'tool', content: JSON.stringify(result), tool_name: name });
    }
    response = await chatLocal({ db, messages, tools: toolDefinitions, temperature: 0.1 });
  }
  const text = 'MERLIN reached its tool-step limit. The underlying records were preserved; ask a narrower follow-up question.';
  logMessage(db,threadId,'assistant',text); return { thread_id: threadId, text, mode: 'local-ai', tools_used: toolsUsed };
}

export function listChatMessages(db, threadId = null, limit = 100) {
  const tid = threadId || db.prepare('SELECT id FROM chat_threads ORDER BY updated_at DESC LIMIT 1').get()?.id;
  if (!tid) return { thread_id: null, messages: [] };
  return { thread_id: tid, messages: db.prepare('SELECT id,role,content,tool_name,created_at FROM chat_messages WHERE thread_id=? ORDER BY created_at ASC LIMIT ?').all(tid,Math.min(500,Math.max(1,Number(limit||100)))) };
}
