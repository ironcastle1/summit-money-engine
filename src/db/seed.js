export function seedCurrentBusiness(db) {
  const machine = db.prepare('SELECT id FROM machines WHERE id = ?').get('MACH-CROSSFIRE-2X2');
  if (!machine) {
    db.prepare(`
      INSERT INTO machines (
        id, name, type, manufacturer, model, working_width_mm, working_height_mm, max_current_a, rules_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'MACH-CROSSFIRE-2X2',
      'CrossFire 2x2 + Razorweld 45',
      'cnc_plasma',
      'Langmuir Systems / Razorweld',
      'CrossFire 2x2 / Razorweld 45',
      642.62,
      591.82,
      45,
      JSON.stringify({
        ihs: true,
        thc: true,
        machine_torch: true,
        min_bridge_mm: null,
        min_hole_mm: null,
        min_slot_mm: null,
        note: 'Minimum feature rules deliberately unset until calibrated from real cuts. MERLIN must not invent them.'
      })
    );
  }

  const capabilities = [
    ['CAP-CNC-PLASMA', 'CNC plasma cutting', { machine_id: 'MACH-CROSSFIRE-2X2' }],
    ['CAP-DXF', 'DXF production and ingestion', {}],
    ['CAP-MANUAL-FINISH', 'Manual cleanup and finishing', {}],
    ['CAP-MADE-TO-ORDER', 'Made-to-order production', {}]
  ];
  const insert = db.prepare('INSERT OR IGNORE INTO capabilities (id, name, details_json) VALUES (?, ?, ?)');
  for (const [cid, name, details] of capabilities) insert.run(cid, name, JSON.stringify(details));

  const facts = [
    ['business', 'system_name', 'MERLIN'],
    ['business', 'current_stage', 'Single current CNC plasma setup; expansion modules should remain dormant until the user reports a real business upgrade.'],
    ['decision_policy', 'no_fake_scores', 'Do not create opportunity scores, confidence percentages, or fabricated precision. Present factual evidence, calculations from known inputs, reasons, and unknowns.'],
    ['decision_policy', 'current_state_only', 'Do not preload future factories, Prague, Middle East, or other expansion assumptions into current operational decisions. Evolve when the physical business evolves.'],
    ['product_policy', 'cuttable_only', 'Do not label a CNC design production-ready unless deterministic checks pass and unresolved geometry/topology risks are disclosed.'],
    ['catalogue', 'multilingual_goal', 'The language/number product line is intended to support many major languages/scripts: Arabic, Russian, Turkish, English, French, Italian, Spanish, Japanese, Korean, Chinese and Indian-language products, using appropriate names, numbers, letters/characters, phrases or mantras as applicable.'],
    ['catalogue', 'current_product_families', 'Current catalogue strategy includes repeatable numbers/house-number systems; letters and typography; names; multilingual words/phrases/mantras; monograms/family signs; general and business signs; historical/classical/medieval/dark-fantasy/wildlife/Islamic wall art; selected modular statement pieces where appropriate; garden products; basic functional CNC products; decorative panels; and fire-pit concepts where current fabrication capability allows.'],
    ['catalogue', 'current_file_bias', 'The existing saved design library is currently weighted heavily toward wall art. MERLIN should actively look for evidence-backed non-wall-art opportunities rather than simply recommending more wall art.'],
    ['production_policy', 'no_welding_dependency', 'At the current stage, prioritise products that do not require welding or extra fabrication processes unless the owner explicitly confirms that process is available for the product.'],
    ['commercial_policy', 'ip_independence', 'Do not build core forecasts around unlicensed third-party game, anime, film or television intellectual property.']
  ];
  const upsert = db.prepare(`
    INSERT INTO memory_facts (id, category, fact_key, fact_value, source, confidence)
    VALUES (?, ?, ?, ?, 'user', 'direct')
    ON CONFLICT(category, fact_key) DO UPDATE SET fact_value=excluded.fact_value, updated_at=CURRENT_TIMESTAMP
  `);
  for (const [category, key, value] of facts) upsert.run(`FACT-${category}-${key}`, category, key, value);

  const marketQueries = [
    ['MSRC-001','Metal house numbers','search','metal house numbers UK'],
    ['MSRC-002','Etsy house-number listings','search','site:etsy.com/uk/listing metal house number steel'],
    ['MSRC-003','Personalised metal signs','search','personalised metal sign UK steel'],
    ['MSRC-004','Etsy personalised metal signs','search','site:etsy.com/uk/listing personalised metal sign'],
    ['MSRC-005','Metal wall art','search','metal wall art UK handmade steel'],
    ['MSRC-006','Historical metal wall art','search','historical metal wall art steel UK'],
    ['MSRC-007','Arabic metal wall art','search','Arabic metal wall art UK steel'],
    ['MSRC-008','French phrase metal decor','search','French phrase metal wall decor'],
    ['MSRC-009','Italian phrase metal decor','search','Italian phrase metal wall decor'],
    ['MSRC-010','Spanish phrase metal decor','search','Spanish phrase metal wall decor'],
    ['MSRC-011','Family monograms','search','metal family monogram wall sign UK'],
    ['MSRC-012','Garden metal signs','search','metal garden sign UK personalised'],
    ['MSRC-013','Functional plasma-cut products','search','plasma cut steel brackets home workshop products'],
    ['MSRC-014','CNC plasma product trends','news','CNC plasma metal products small business trends'],
    ['MSRC-015','Interior metal decor trends','news','metal wall decor interior trend UK'],
    ['MSRC-016','Wedding metal signage','news','metal wedding signage trend personalised'],
    ['MSRC-017','Steel supplier intelligence','search','2mm mild steel sheet 500mm 500mm UK price'],
    ['MSRC-018','Powder and paint inputs','search','metal spray paint primer steel UK price'],
    ['MSRC-019','Marketplace bestseller labels','search','site:etsy.com/uk/listing Bestseller metal sign steel'],
    ['MSRC-020','Marketplace popular metal art','search','site:etsy.com/uk/listing popular now metal wall art steel'],
    ['MSRC-021','Broad UK emerging search trends','trends','United Kingdom daily trends'],
    ['MSRC-022','Home decor trend reporting','news','home decor trends UK emerging'],
    ['MSRC-023','Garden decor trend reporting','news','garden decor trends UK emerging'],
    ['MSRC-024','Personalised gift trend reporting','news','personalised gifts trends UK']
  ];
  const sourceInsert = db.prepare(`INSERT OR IGNORE INTO market_source_config (id,name,source_type,query,enabled,notes) VALUES (?,?,?,?,1,?)`);
  for (const [sid,name,type,query] of marketQueries) sourceInsert.run(sid,name,type,query,'Current-stage research seed. Edit or disable from MERLIN as the catalogue evolves.');

}
