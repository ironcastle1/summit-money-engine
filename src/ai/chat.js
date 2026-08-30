import { openAIClient, chatModel } from './openai.js';
import { merlinSystemPrompt } from './system-prompt.js';
import { toolDefinitions, executeTool } from './tools.js';
import { businessSnapshot } from '../services/snapshot.js';
import { id } from '../util/id.js';

function logEvent(db, role, content, toolName=null, toolPayload=null) {
  db.prepare('INSERT INTO ai_events (id,role,content,tool_name,tool_payload_json) VALUES (?,?,?,?,?)')
    .run(id('AI'), role, String(content), toolName, toolPayload ? JSON.stringify(toolPayload) : null);
}
function collectCitations(value,out=[]){
  if(!value||typeof value!=='object')return out;
  if(value.type==='url_citation'&&value.url)out.push({url:value.url,title:value.title||value.url});
  for(const v of Object.values(value)){if(Array.isArray(v))v.forEach(x=>collectCitations(x,out));else if(v&&typeof v==='object')collectCitations(v,out);}
  return out;
}
function uniqueSources(output){const m=new Map();for(const c of collectCitations(output)){if(!m.has(c.url))m.set(c.url,c);}return [...m.values()];}

export async function chatWithMerlin(db, message) {
  const client = openAIClient();
  const snapshot = businessSnapshot(db);
  logEvent(db, 'user', message);
  const tools=[{type:'web_search'},...toolDefinitions];

  let response = await client.responses.create({
    model: chatModel(),
    reasoning: { effort: 'medium' },
    instructions: merlinSystemPrompt(snapshot),
    input: message,
    tools
  });

  const gatheredSources=[];
  for (let round = 0; round < 10; round++) {
    gatheredSources.push(...uniqueSources(response.output));
    const calls = (response.output || []).filter(o => o.type === 'function_call');
    if (!calls.length) {
      const text = response.output_text || '';
      logEvent(db, 'assistant', text);
      const sources=[...new Map(gatheredSources.map(s=>[s.url,s])).values()];
      return { text, response_id: response.id, sources };
    }

    const outputs = [];
    for (const call of calls) {
      let args = {};
      try { args = JSON.parse(call.arguments || '{}'); } catch {}
      const result = executeTool(db, call.name, args);
      logEvent(db, 'tool', JSON.stringify(result), call.name, args);
      outputs.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) });
    }

    response = await client.responses.create({
      model: chatModel(),
      previous_response_id: response.id,
      input: outputs,
      tools
    });
  }
  throw new Error('MERLIN tool loop exceeded safety limit.');
}
