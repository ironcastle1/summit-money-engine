import { openAIClient, researchModel } from '../ai/openai.js';
import { businessSnapshot } from '../services/snapshot.js';
import { id } from '../util/id.js';

function extractJson(text) {
  const raw = String(text || '').trim();
  try { return JSON.parse(raw); } catch {}
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i) || raw.match(/(\{[\s\S]*\})/);
  if (!match) throw new Error('Research model did not return parseable JSON.');
  return JSON.parse(match[1]);
}

function normaliseUrl(value) {
  try { const u = new URL(value); u.hash=''; return u.toString().replace(/\/$/,''); } catch { return String(value||'').replace(/\/$/,''); }
}

function collectCitations(value, out=[]) {
  if (!value || typeof value !== 'object') return out;
  if (value.type === 'url_citation' && value.url) out.push({ url: value.url, title: value.title || null });
  for (const v of Object.values(value)) {
    if (Array.isArray(v)) v.forEach(x => collectCitations(x, out));
    else if (v && typeof v === 'object') collectCitations(v, out);
  }
  return out;
}

export async function runMarketResearch(db, focus='current best opportunities for this CNC plasma business') {
  const client = openAIClient();
  const snapshot = businessSnapshot(db);
  const prompt = `Research the public web for ${focus}.

You are not allowed to create scores, ratings, confidence percentages, fabricated sales estimates, fabricated demand, or unsourced numbers.
Only report observations supported by current sources. Prefer direct marketplace/supplier/official/trend evidence over generic listicles.
Filter everything through the CURRENT capabilities in the supplied business state. Do not research future geographic expansion or hypothetical equipment unless explicitly present in the state.

BUSINESS STATE:\n${JSON.stringify(snapshot, null, 2)}

Return ONLY valid JSON with this exact top-level shape:
{
  "observations": [
    {
      "topic": "short factual topic",
      "observation": "what was actually observed",
      "why_valuable": "clear reasoning tied to this current business",
      "direct_evidence": ["specific sourced facts, no invented figures"],
      "supporting_evidence": ["secondary evidence if any"],
      "unknowns": ["what cannot be established from available evidence"],
      "suggested_test": "small concrete validation action that does not assume the result",
      "sources": [{"url":"exact source URL used for this observation","title":"source title"}]
    }
  ]
}`;

  const response = await client.responses.create({
    model: researchModel(),
    reasoning: { effort: 'medium' },
    tools: [{ type: 'web_search' }],
    input: prompt
  });

  const payload = extractJson(response.output_text);
  const citations = [...new Map(collectCitations(response.output).map(c => [c.url, c])).values()];
  const citationByUrl = new Map(citations.map(c => [normaliseUrl(c.url), c]));
  const sourceIdByUrl = new Map();
  for (const c of citations) {
    const existing = db.prepare('SELECT id FROM research_sources WHERE url=? ORDER BY observed_at DESC LIMIT 1').get(c.url);
    const sid = existing?.id || id('SRC');
    if (!existing) db.prepare('INSERT INTO research_sources (id,url,title,source_type) VALUES (?,?,?,?)').run(sid,c.url,c.title,'web');
    sourceIdByUrl.set(normaliseUrl(c.url), sid);
  }

  const inserted = [];
  for (const obs of payload.observations || []) {
    const sourceIds = (obs.sources || [])
      .map(s => normaliseUrl(s.url))
      .filter(u => citationByUrl.has(u))
      .map(u => sourceIdByUrl.get(u));
    const oid = id('OBS');
    db.prepare(`INSERT INTO market_observations (
      id,topic,observation,why_valuable,direct_evidence_json,supporting_evidence_json,unknowns_json,suggested_test,applicable_now,source_ids_json
    ) VALUES (?,?,?,?,?,?,?,?,1,?)`).run(
      oid, obs.topic, obs.observation, obs.why_valuable || null,
      JSON.stringify(obs.direct_evidence || []), JSON.stringify(obs.supporting_evidence || []),
      JSON.stringify(obs.unknowns || []), obs.suggested_test || null, JSON.stringify([...new Set(sourceIds)])
    );
    inserted.push(oid);
  }
  db.prepare(`INSERT INTO meta (key,value) VALUES ('last_market_research_at',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run(new Date().toISOString());
  db.prepare(`INSERT INTO meta (key,value) VALUES ('last_market_research_status','success') ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run();
  return { observations: inserted, sources: citations, model_response_id: response.id };
}
