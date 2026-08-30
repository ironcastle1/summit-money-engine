import OpenAI from 'openai';

export function openAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw Object.assign(new Error('OPENAI_API_KEY is not configured on the MERLIN backend.'), { status: 503, code: 'AI_NOT_CONFIGURED' });
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const chatModel = () => process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || 'gpt-5.6-terra';
export const researchModel = () => process.env.OPENAI_RESEARCH_MODEL || 'gpt-5.6-sol';
