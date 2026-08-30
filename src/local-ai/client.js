const baseUrl = () => (process.env.MERLIN_LOCAL_AI_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const timeoutMs = () => Math.max(10_000, Number(process.env.MERLIN_LOCAL_AI_TIMEOUT_MS || 180000));

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    const response = await fetch(`${baseUrl()}${path}`, { ...options, signal: controller.signal });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
    if (!response.ok) {
      const error = new Error(body?.error || body?.message || `${response.status} ${response.statusText}`);
      error.status = response.status;
      error.payload = body;
      throw error;
    }
    return body;
  } finally { clearTimeout(timer); }
}

export function configuredModel(db) {
  const dbValue = db?.prepare?.("SELECT value FROM meta WHERE key='local_ai_model'").get()?.value;
  return dbValue || process.env.MERLIN_LOCAL_AI_MODEL || 'merlin-cnc';
}

export async function localAiStatus(db) {
  try {
    const tags = await request('/api/tags');
    const models = (tags?.models || []).map(m => m.name || m.model).filter(Boolean);
    const model = configuredModel(db);
    return { online: true, engine: 'ollama-compatible-local-runtime', url: baseUrl(), model, model_installed: models.some(m => m === model || m.startsWith(`${model}:`)), models };
  } catch (error) {
    return { online: false, engine: 'ollama-compatible-local-runtime', url: baseUrl(), model: configuredModel(db), model_installed: false, models: [], error: error.message };
  }
}

export async function chatLocal({ db, messages, tools = [], temperature = 0.1, format = null }) {
  const payload = { model: configuredModel(db), messages, stream: false, options: { temperature } };
  if (tools?.length) payload.tools = tools;
  if (format) payload.format = format;
  return request('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function generateLocal({ db, prompt, system = '', temperature = 0.1, format = null }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  return chatLocal({ db, messages, temperature, format });
}

export async function setLocalModel(db, model) {
  if (!model || typeof model !== 'string') throw new Error('Model name required');
  db.prepare("INSERT INTO meta (key,value) VALUES ('local_ai_model',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(model.trim());
  return localAiStatus(db);
}
