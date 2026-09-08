import { id } from '../util/id.js';

export function upsertFact(db, { category, fact_key, fact_value, source='user', confidence='direct' }) {
  const existing = db.prepare('SELECT id FROM memory_facts WHERE category=? AND fact_key=?').get(category, fact_key);
  const factId = existing?.id || id('FACT');
  db.prepare(`
    INSERT INTO memory_facts (id, category, fact_key, fact_value, source, confidence)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(category, fact_key) DO UPDATE SET
      fact_value=excluded.fact_value, source=excluded.source, confidence=excluded.confidence,
      active=1, updated_at=CURRENT_TIMESTAMP
  `).run(factId, category, fact_key, String(fact_value), source, confidence);
  return db.prepare('SELECT * FROM memory_facts WHERE category=? AND fact_key=?').get(category, fact_key);
}
