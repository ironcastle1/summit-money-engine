import { id } from '../util/id.js';

export function requestUpgrade(db, { trigger, reason, requested_changes }) {
  const upgradeId = id('UPG');
  db.prepare(`INSERT INTO system_upgrade_requests (id, trigger, reason, requested_changes_json)
    VALUES (?, ?, ?, ?)`)
    .run(upgradeId, trigger, reason, JSON.stringify(requested_changes || []));
  return db.prepare('SELECT * FROM system_upgrade_requests WHERE id=?').get(upgradeId);
}
