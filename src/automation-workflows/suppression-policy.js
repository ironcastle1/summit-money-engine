import { deepGet } from './utilities.js';
export function suppressionDecision(policy = {}, context = {}, history = []) {
    const minutes = Math.max(0, Number(policy.minutes || policy.suppressMinutes || 0));
    if (!minutes)
        return Object.freeze({ suppressed: false, reason: 'Suppression disabled' });
    const keyPath = policy.keyPath || 'signal.id';
    const key = deepGet(context, keyPath, context.signal?.id || context.event?.id || context.workflowId);
    const cutoff = Date.now() - minutes * 60000;
    const duplicate = history.find(item => item.createdAt && Date.parse(item.createdAt) >= cutoff && (item.suppressionKey || item.context?.suppressionKey) === key);
    return Object.freeze({ suppressed: Boolean(duplicate), reason: duplicate ? `Equivalent action already emitted within ${minutes} minutes` : 'No recent equivalent action', key, duplicateRunId: duplicate?.id || null });
}
