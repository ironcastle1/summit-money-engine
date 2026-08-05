import { DEFAULT_LIMITS } from './constants.js';
export function retryPolicy(input = {}) {
    return Object.freeze({
        attempts: Math.max(1, Math.min(DEFAULT_LIMITS.maximumAttempts, Number(input.attempts) || 1)),
        initialDelayMs: Math.max(0, Math.min(30000, Number(input.initialDelayMs) || 250)),
        factor: Math.max(1, Math.min(5, Number(input.factor) || 2)),
        maximumDelayMs: Math.max(250, Math.min(60000, Number(input.maximumDelayMs) || 5000)),
        jitter: Math.max(0, Math.min(1, Number(input.jitter) || 0.15))
    });
}
export function retryDelay(policy, attempt) {
    const base = Math.min(policy.maximumDelayMs, policy.initialDelayMs * policy.factor ** Math.max(0, attempt - 1));
    const range = base * policy.jitter;
    return Math.max(0, Math.round(base - range + Math.random() * range * 2));
}
export async function withRetries(operation, input = {}, hooks = {}) {
    const policy = retryPolicy(input);
    let lastError;
    for (let attempt = 1; attempt <= policy.attempts; attempt += 1) {
        try {
            return await operation({ attempt, policy });
        }
        catch (error) {
            lastError = error;
            hooks.onFailure?.(error, attempt);
            if (attempt >= policy.attempts)
                break;
            const delay = retryDelay(policy, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
