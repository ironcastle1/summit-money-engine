const health = new Map();

function startSource(name, category) {
  const row = health.get(name) || { name, category, success: false, records: 0, failures: 0, lastSuccess: null, lastFailure: null, message: "Not run yet" };
  row.category = category || row.category;
  row.running = true;
  row.startedAt = new Date().toISOString();
  health.set(name, row);
}

function markSuccess(name, records, message = "OK", meta = {}) {
  const row = health.get(name) || { name };
  row.success = true;
  row.running = false;
  row.records = Number.isFinite(Number(records)) ? Number(records) : 0;
  row.lastSuccess = new Date().toISOString();
  row.message = message;
  row.failures = row.failures || 0;
  row.meta = { ...(row.meta || {}), ...meta };
  health.set(name, row);
}

function markFailure(name, err, meta = {}) {
  const row = health.get(name) || { name };
  row.success = false;
  row.running = false;
  row.records = row.records || 0;
  row.failures = (row.failures || 0) + 1;
  row.lastFailure = new Date().toISOString();
  row.message = err && err.message ? err.message : String(err || "Failed");
  row.meta = { ...(row.meta || {}), ...meta };
  health.set(name, row);
}

function listHealth() {
  return [...health.values()].sort((a, b) => String(a.category || "").localeCompare(String(b.category || "")) || a.name.localeCompare(b.name));
}

module.exports = { startSource, markSuccess, markFailure, listHealth };
