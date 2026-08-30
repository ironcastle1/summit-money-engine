import { openAIClient, defaultModel } from './openai.js';
import { merlinSystemPrompt } from './system-prompt.js';
import { toolDefinitions, executeTool } from './tools.js';
import { businessSnapshot } from '../services/snapshot.js';
import { id } from '../util/id.js';

function logEvent(db, role, content, toolName=null, toolPayload=null) {
  db.prepare('INSERT INTO ai_events (id,role,content,tool_name,tool_payload_json) VALUES (?,?,?,?,?)')
    .run(id('AI'), role, String(content), toolName, toolPayload ? JSON.stringify(toolPayload) : null);
}

export async function chatWithMerlin(db, message) {
  const client = openAIClient();
  const snapshot = businessSnapshot(db);
  logEvent(db, 'user', message);

  let response = await client.responses.create({
    model: defaultModel(),
    reasoning: { effort: 'medium' },
    instructions: merlinSystemPrompt(snapshot),
    input: message,
    tools: toolDefinitions
  });

  for (let round = 0; round < 8; round++) {
    const calls = (response.output || []).filter(o => o.type === 'function_call');
    if (!calls.length) {
      const text = response.output_text || '';
      logEvent(db, 'assistant', text);
      return { text, response_id: response.id };
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
      model: defaultModel(),
      previous_response_id: response.id,
      input: outputs,
      tools: toolDefinitions
    });
  }

  throw new Error('MERLIN tool loop exceeded safety limit.');
}
