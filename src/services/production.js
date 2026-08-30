import { id } from '../util/id.js';

export function recordProductionRun(db, input) {
  const runId = id('RUN');
  db.prepare(`INSERT INTO production_runs (
    id, product_id, revision_id, machine_id, quantity, material_inventory_item_id,
    cut_seconds, cleanup_seconds, finishing_seconds, packaging_seconds, success, failure_reason, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      runId, input.product_id, input.revision_id || null, input.machine_id || null,
      Number(input.quantity || 1), input.material_inventory_item_id || null,
      input.cut_seconds ?? null, input.cleanup_seconds ?? null, input.finishing_seconds ?? null,
      input.packaging_seconds ?? null, input.success === false ? 0 : 1, input.failure_reason || null, input.notes || null
    );
  return db.prepare('SELECT * FROM production_runs WHERE id=?').get(runId);
}
