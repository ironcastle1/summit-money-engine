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
    ['catalogue', 'multilingual_goal', 'Long-term language/number catalogue is intended to cover major languages/scripts, but only activate ranges when relevant to the current product programme.']
  ];
  const upsert = db.prepare(`
    INSERT INTO memory_facts (id, category, fact_key, fact_value, source, confidence)
    VALUES (?, ?, ?, ?, 'user', 'direct')
    ON CONFLICT(category, fact_key) DO UPDATE SET fact_value=excluded.fact_value, updated_at=CURRENT_TIMESTAMP
  `);
  for (const [category, key, value] of facts) upsert.run(`FACT-${category}-${key}`, category, key, value);
}
