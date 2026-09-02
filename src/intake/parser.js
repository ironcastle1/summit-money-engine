const MONEY_RE = /£\s*(\d+(?:\.\d+)?)/i;
const NUMBER = '(\\d+(?:\\.\\d+)?)';

function n(v) {
  if (v == null || v === '') return null;
  const x = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(x) ? x : null;
}
function norm(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
function money(text) { const m = String(text).match(MONEY_RE); return m ? n(m[1]) : null; }
function first(re, text) { const m = String(text).match(re); return m ? m[1] : null; }
function compactText(s) { return String(s || '').trim().replace(/\s+/g, ' '); }

function extractQty(text, words = 'sheets?|plates?|items?|units?|pcs?|pieces?|boxes?|cans?|tins?|packs?|discs?|electrodes?|nozzles?|tips?|shields?|standoffs?|screws?') {
  const m = text.match(new RegExp(`\\b${NUMBER}\\s*(?:x\\s*)?(?:${words})\\b`, 'i'));
  if (m) return n(m[1]);
  const of = text.match(/\b(\d+(?:\.\d+)?)\s+of\s+(?:[A-Z0-9]{2,5}-\d{3}|MER-[A-Z0-9]+-\d{6}|the\s+product|this\s+product)/i);
  if (of) return n(of[1]);
  const x = text.match(/\bqty\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
  return x ? n(x[1]) : null;
}
function extractDims(text) {
  const mm = text.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm\b/i);
  if (mm) return { width_mm:n(mm[1]), height_mm:n(mm[2]), unit:'mm' };
  const bare = text.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  if (bare) return { width_mm:n(bare[1]), height_mm:n(bare[2]), unit:null };
  return null;
}
function extractThickness(text) {
  const masked = String(text).replace(/\d+(?:\.\d+)?\s*(?:mm)?\s*[x×]\s*\d+(?:\.\d+)?\s*mm\b/ig, ' ');
  const m = masked.match(/\b(\d+(?:\.\d+)?)\s*mm\b/i);
  return m ? n(m[1]) : null;
}
function extractCost(text) {
  const totalPatterns = [
    /\b(?:total|for|cost(?:s|ing)?|paid|spent)\s*£?\s*(\d+(?:\.\d+)?)/i,
    /£\s*(\d+(?:\.\d+)?)/i
  ];
  let amount = null;
  for (const p of totalPatterns) { const m = text.match(p); if (m) { amount=n(m[1]); break; } }
  const perUnit = /\b(?:each|per\s+(?:sheet|item|unit|can|tin|pack|piece|disc))\b/i.test(text);
  return { amount, per_unit: perUnit };
}
function categoryForSupply(lower) {
  if (/\b(box|boxes|bubble wrap|wrapping|packaging|mailers?|labels?|tape)\b/.test(lower)) return 'packaging';
  if (/\b(standoffs?|screws?|bolts?|nuts?|washers?|hooks?|fixings?)\b/.test(lower)) return 'hardware';
  return 'consumable';
}
function supplyUnit(lower) {
  if (/\bpaint|primer|clear coat|degreaser|solvent\b/.test(lower)) return 'container';
  if (/\b(discs?|electrodes?|nozzles?|tips?|shields?|standoffs?|screws?|bolts?|nuts?|washers?|boxes?|labels?)\b/.test(lower)) return 'each';
  return 'each';
}
function canonicalSupplyName(text) {
  const lower = norm(text);
  const map = [
    [/\bblack paint\b/,'Black paint'],[/\bprimer\b/,'Primer'],[/\bclear coat\b/,'Clear coat'],
    [/\belectrodes?\b/,'Plasma electrodes'],[/\bnozzles?\b/,'Plasma nozzles'],[/\b(?:plasma )?tips?\b/,'Plasma tips'],[/\bshields?\b/,'Plasma shields'],
    [/\bflap discs?\b/,'Flap discs'],[/\bgrinding discs?\b/,'Grinding discs'],[/\bsandpaper\b/,'Sandpaper'],
    [/\bstandoffs?\b/,'Wall standoffs'],[/\bscrews?\b/,'Screws'],[/\bbox(?:es)?\b/,'Packaging boxes'],[/\bbubble wrap\b/,'Bubble wrap'],[/\blabels?\b/,'Labels']
  ];
  for (const [re,name] of map) if (re.test(lower)) return name;
  return null;
}
function parseDueDate(text) {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})(?:[ T](\d{1,2}:\d{2}))?/);
  if (iso) return iso[2] ? `${iso[1]}T${iso[2]}` : `${iso[1]}T23:59`;
  const uk = text.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\b/);
  if (uk) return `${uk[3]}-${String(uk[2]).padStart(2,'0')}-${String(uk[1]).padStart(2,'0')}T23:59`;
  return null;
}
function productRef(text) {
  const code = text.match(/\b([A-Z0-9]{2,5}-\d{3}|MER-[A-Z0-9]+-\d{6})\b/i);
  if (code) return { product_code: code[1].toUpperCase(), product_name:null };
  const named = text.match(/(?:product|item|design)\s+["']?([^,"'£]+?)["']?(?=\s+(?:for|qty|quantity|on|at|due|took|used)\b|$)/i);
  return { product_code:null, product_name:named ? compactText(named[1]) : null };
}
function channel(text) {
  const m = text.match(/\b(etsy|ebay|vinted|facebook marketplace|facebook|website|direct|shopify)\b/i);
  return m ? m[1].replace(/\b\w/g,c=>c.toUpperCase()) : null;
}
function durationSeconds(text, labels) {
  for (const label of labels) {
    const re = new RegExp(`(?:${label})\\s*(?:time)?\\s*[:=]?\\s*(\\d+(?:\\.\\d+)?)\\s*(seconds?|secs?|s|minutes?|mins?|m)\\b`, 'i');
    const m = text.match(re);
    if (m) return /^(m|mins?|minutes?)$/i.test(m[2]) ? n(m[1])*60 : n(m[1]);
    const re2 = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(seconds?|secs?|s|minutes?|mins?|m)\\s+(?:for\\s+)?(?:${label})`, 'i');
    const m2 = text.match(re2);
    if (m2) return /^(m|mins?|minutes?)$/i.test(m2[2]) ? n(m2[1])*60 : n(m2[1]);
  }
  return null;
}

function result(action, title, fields, missing = [], notes = []) {
  return {
    action,
    title,
    fields,
    missing_fields:[...new Set(missing)],
    notes,
    can_commit: missing.length === 0,
    policy:'MERLIN only writes fields explicitly present in the text or resolved from an exact existing record. Unclear values remain missing.'
  };
}

export function parseIntakeText(text) {
  const raw = compactText(text);
  const lower = norm(raw);
  if (!raw) return result('unsupported','Nothing to record',{},['statement']);

  // Raw sheet/plate purchase or addition.
  if (/\b(steel|metal|sheet|plate)\b/.test(lower) && /\b(bought|purchased?|add(?:ed)?|received|stock(?:ed)?|inventory)\b/.test(lower)) {
    const dims = extractDims(raw);
    const qty = extractQty(raw,'sheets?|plates?') ?? 1;
    const thickness = extractThickness(raw);
    const c = extractCost(raw);
    const unitCost = c.amount == null ? null : (c.per_unit ? c.amount : (qty > 0 ? c.amount/qty : null));
    const mat = /cold[-\s]?reduced/.test(lower) ? 'Cold-reduced steel' : /mild steel/.test(lower) ? 'Mild steel' : /stainless/.test(lower) ? 'Stainless steel' : /alumini?um/.test(lower) ? 'Aluminium' : 'Steel';
    const name = `${thickness != null ? `${thickness}mm ` : ''}${mat}${dims?.width_mm != null ? ` ${dims.width_mm}×${dims.height_mm}mm` : ''}`.trim();
    const missing=[];
    if (thickness == null) missing.push('thickness_mm');
    if (!dims?.width_mm || !dims?.height_mm) missing.push('sheet_dimensions_mm');
    return result('inventory_material_purchase','Record raw material',{
      kind:'raw_material', name, material_family:mat, form:'sheet', unit:'sheet', quantity:qty,
      thickness_mm:thickness, width_mm:dims?.width_mm ?? null, height_mm:dims?.height_mm ?? null,
      total_cost:c.amount, unit_cost:unitCost, currency:'GBP', source_text:raw
    }, missing, c.amount == null ? ['No purchase cost was stated; inventory can still be recorded without a cost.'] : []);
  }

  const supplyName = canonicalSupplyName(raw);
  // Stocktake: "I have 8 electrodes left". This is checked before purchase/addition language.
  if (/\b(have|left|remaining|stocktake|counted)\b/.test(lower) && supplyName && !/\b(bought|purchased?|received)\b/.test(lower)) {
    const q = raw.match(/\b(\d+(?:\.\d+)?)\b/);
    return result('inventory_stocktake','Set recorded stock count',{ inventory_name:supplyName, quantity_on_hand:q?n(q[1]):null, source_text:raw }, q?[]:['quantity_on_hand']);
  }

  // Supplies / consumables / packaging / hardware purchase.
  if (supplyName && /\b(bought|purchased?|add(?:ed)?|received|stock(?:ed)?|inventory)\b/.test(lower)) {
    const qty = extractQty(raw) ?? 1;
    const c = extractCost(raw);
    const unitCost = c.amount == null ? null : (c.per_unit ? c.amount : (qty > 0 ? c.amount/qty : null));
    return result('inventory_supply_purchase','Record supply',{
      kind:categoryForSupply(lower), name:supplyName, unit:supplyUnit(lower), quantity:qty,
      total_cost:c.amount, unit_cost:unitCost, currency:'GBP', source_text:raw
    });
  }

  // Expense.
  if (/\b(expense|spent|paid)\b/.test(lower) && money(raw) != null) {
    let category='Other';
    if (/\bpaint|primer|consumable|disc|electrode|nozzle|tip\b/.test(lower)) category='Consumables';
    else if (/\bsteel|metal|sheet|material\b/.test(lower)) category='Materials';
    else if (/\bpostage|shipping|courier\b/.test(lower)) category='Shipping';
    else if (/\badvert|etsy|ebay|fee\b/.test(lower)) category='Selling fees';
    return result('expense','Record expense',{category,description:raw,amount:money(raw),currency:'GBP',source_text:raw});
  }

  // Sale already completed.
  if (/\b(sold|sale)\b/.test(lower) && money(raw) != null) {
    const ref=productRef(raw); const qty=extractQty(raw,'items?|units?|pcs?|pieces?') ?? 1;
    return result('sale','Record sale',{
      ...ref, quantity:qty, gross_revenue:money(raw), channel:channel(raw), currency:'GBP', source_text:raw
    }, ref.product_code||ref.product_name?[]:['product_reference'], ['MERLIN will require an exact product match before linking the sale.']);
  }

  // MERLIN V6 deliberately does not maintain an open-order ledger. Completed work is recorded as sales/production history.
  if (/\b(new order|order for|customer order|ordered)\b/.test(lower)) {
    return result('unsupported','Open orders are not logged in MERLIN V6',{source_text:raw},['completed_sale_or_production_record'],[
      'Fulfil the order in the sales platform. After completion, record the sale and any measured production data against the short product code.'
    ]);
  }

  // Production record.
  if (/\b(cut|produced|made|production run|test cut)\b/.test(lower)) {
    const ref=productRef(raw); const qty=extractQty(raw,'items?|units?|pcs?|pieces?') ?? 1;
    const fields={...ref,quantity:qty,cut_seconds:durationSeconds(raw,['cut','cutting']),cleanup_seconds:durationSeconds(raw,['clean','cleanup','cleaning','deburr','deburring']),finishing_seconds:durationSeconds(raw,['finish','finishing','paint','painting']),packaging_seconds:durationSeconds(raw,['pack','packing','packaging']),success:!(/\b(failed|failure|scrap|bad cut)\b/.test(lower)),source_text:raw};
    const missing=[]; if(!fields.product_code&&!fields.product_name)missing.push('product_reference');
    return result('production_run','Record production run',fields,missing);
  }

  // Product price update.
  if (/\b(set|change|update)\b/.test(lower) && /\b(price|selling price)\b/.test(lower) && money(raw)!=null) {
    const ref=productRef(raw); const missing=[]; if(!ref.product_code&&!ref.product_name)missing.push('product_reference');
    return result('product_price','Update product selling price',{...ref,selling_price:money(raw),source_text:raw},missing);
  }

  // Generic direct business note: never silently filed as a fact elsewhere.
  if (/\b(note|record|remember)\b/.test(lower)) {
    return result('business_note','Record business note',{body:raw,source_text:raw});
  }

  return result('unsupported','Statement not recognised', {source_text:raw}, ['supported_statement_type'], [
    'Nothing has been written. Use a concrete statement about stock, a purchase, expense, completed sale, production run, product price, or business note.'
  ]);
}

export function normaliseIntakeText(text){ return compactText(text); }
