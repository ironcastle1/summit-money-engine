import { quietHoursDecision } from './quiet-hours.js';
import { RatePolicy } from './rate-policy.js';
export class NotificationRouter {
    constructor(options = {}) { this.channels = new Map(); this.store = options.store; this.rate = options.rate || new RatePolicy(); this.defaultPolicy = options.defaultPolicy || { limit: 120, windowMs: 60000 }; }
    register(type, handler) { this.channels.set(String(type).toUpperCase(), handler); return this; }
    async route(input = {}) { const results = []; for (const channelName of input.channels || ['IN_APP']) {
        const channel = String(channelName).toUpperCase();
        const quiet = quietHoursDecision({ ...input.quietHours, severity: input.severity }, input.now);
        if (quiet.quiet) {
            results.push(Object.freeze({ channel, state: 'SUPPRESSED', reason: quiet.reason }));
            continue;
        }
        const rate = this.rate.consume(`${input.owner}:${channel}`, input.ratePolicy || this.defaultPolicy);
        if (!rate.allowed) {
            results.push(Object.freeze({ channel, state: 'RATE_LIMITED', resetAt: rate.resetAt }));
            continue;
        }
        const handler = this.channels.get(channel);
        if (!handler) {
            const record = await this.store?.create?.(input.owner, { ...input, channel, state: 'UNAVAILABLE', body: `${input.body || ''} [${channel} connector not configured]` });
            results.push(Object.freeze({ channel, state: 'UNAVAILABLE', id: record?.id || null }));
            continue;
        }
        results.push(await handler({ ...input, channel }));
    } return Object.freeze({ delivered: results.filter(item => item.state === 'DELIVERED').length, results: Object.freeze(results) }); }
}
