import { ValidationError } from '../core/errors.js';

export async function readRawBody(request, options = {}) {
  const maximumBytes = Math.max(1024, Math.min(5_000_000, Number(options.maximumBytes) || 500_000));
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximumBytes) throw new ValidationError('Request body is too large', { maximumBytes });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function readJsonBody(request, options = {}) {
  const contentType = String(request.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) throw new ValidationError('Content-Type must be application/json');
  const raw = await readRawBody(request, options);
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('root must be an object');
    return value;
  } catch (error) {
    throw new ValidationError('Request body is not valid JSON', { cause: error.message });
  }
}
