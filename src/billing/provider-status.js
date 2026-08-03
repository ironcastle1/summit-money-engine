export const BILLING_STATES = Object.freeze({ READY: 'READY', NOT_CONFIGURED: 'NOT_CONFIGURED', ERROR: 'ERROR' });
export function providerHealth(id, configured, extra = {}) { return { id, state: configured ? BILLING_STATES.READY : BILLING_STATES.NOT_CONFIGURED, configured: Boolean(configured), ...extra }; }
