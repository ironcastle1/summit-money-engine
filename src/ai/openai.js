import OpenAI from 'openai';

export function openAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw Object.assign(new Error('OPENAI_API_KEY is not configured.'), { status: 503, code: 'AI_NOT_CONFIGURED' });
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const defaultModel = () => process.env.OPENAI_MODEL || 'gpt-5.6-terra';
