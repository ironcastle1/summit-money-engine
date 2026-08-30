function number(v) { const n = Number(String(v).replace(/,/g, '')); return Number.isFinite(n) ? n : null; }
function mm(v) { return number(v); }

export function parseDeterministicCommand(text) {
  const raw = String(text || '').trim();
  const lower = raw.toLowerCase();

  // Explicit material inventory statements, e.g. "add 5 sheets 2.0mm steel 500 x 500 cost 24.95 each"
  if (/\b(add|bought|purchase|inventory|stock)\b/.test(lower) && /\b(steel|metal|sheet|plate)\b/.test(lower)) {
    const thickness = raw.match(/(\d+(?:\.\d+)?)\s*mm\b/i);
    const dims = raw.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm\b/i) || raw.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
    const qty = raw.match(/\b(\d+(?:\.\d+)?)\s*(?:x\s*)?(?:sheets?|plates?)\b/i);
    const cost = raw.match(/(?:£|cost(?:s|ing)?\s*£?)[ ]*(\d+(?:\.\d+)?)/i);
    const each = /\beach\b|\bper\s+sheet\b/i.test(raw);
    const materialName = /cold\s*reduced/i.test(raw) ? 'Cold-reduced steel' : /mild\s*steel/i.test(raw) ? 'Mild steel' : 'Steel sheet';
    if (thickness || dims || qty || cost) {
      return { kind: 'inventory_material', data: {
        name: materialName,
        kind: 'raw_material', unit: 'sheet', quantity_on_hand: qty ? number(qty[1]) : 1,
        unit_cost: cost ? number(cost[1]) : null, cost_is_total: Boolean(cost && !each && qty && number(qty[1]) > 1),
        thickness_mm: thickness ? mm(thickness[1]) : null,
        width_mm: dims ? mm(dims[1]) : null, height_mm: dims ? mm(dims[2]) : null,
        material_family: 'Steel', form: 'sheet', currency: 'GBP', source_text: raw
      }};
    }
  }

  if (/\b(record|add)\b.*\bexpense\b/.test(lower)) {
    const amount = raw.match(/£\s*(\d+(?:\.\d+)?)/);
    if (amount) return { kind: 'expense', data: { amount: number(amount[1]), description: raw, category: 'Uncategorised', currency: 'GBP' } };
  }


  if (/\b(what|show|list|how much|how many)\b/.test(lower) && /\b(inventory|stock|steel|material|supplies|consumables)\b/.test(lower)) {
    if (/\b(low|running out|reorder)\b/.test(lower)) return { kind: 'low_stock_query', data: {} };
    return { kind: 'inventory_query', data: { kind: /\bsteel|metal|material\b/.test(lower) ? 'raw_material' : null } };
  }
  if (/\b(what|show|list|how many|outstanding|open)\b/.test(lower) && /\borders?\b/.test(lower)) return { kind: 'orders_query', data: {} };
  if (/\b(what|show|list|how many)\b/.test(lower) && /\b(products?|dxfs?|designs?)\b/.test(lower)) return { kind: 'products_query', data: {} };
  if (/\b(revenue|expenses?|money|finance|sales this month)\b/.test(lower) && /\b(what|show|how much|month|current)\b/.test(lower)) return { kind: 'finance_query', data: {} };

  return null;
}
