import { expired } from './time.js';
export function subscriptionState(input = {}, now = Date.now()) { if (input.cancelledAt)
    return 'CANCELLED'; if (input.suspendedAt)
    return 'SUSPENDED'; if (input.trialEndsAt && !expired(input.trialEndsAt, now))
    return 'TRIAL'; if (input.currentPeriodEndsAt && expired(input.currentPeriodEndsAt, now) && input.cancelAtPeriodEnd)
    return 'CANCELLED'; if (input.pastDueSince)
    return 'PAST_DUE'; return input.state || 'ACTIVE'; }
export function allowedTransition(from, to) { const graph = { TRIAL: ['ACTIVE', 'CANCELLED'], ACTIVE: ['PAST_DUE', 'SUSPENDED', 'CANCELLED'], PAST_DUE: ['ACTIVE', 'SUSPENDED', 'CANCELLED'], SUSPENDED: ['ACTIVE', 'CANCELLED'], CANCELLED: [] }; return (graph[String(from).toUpperCase()] || []).includes(String(to).toUpperCase()); }
