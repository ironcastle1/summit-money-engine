export function quietHoursDecision(policy = {}, now = new Date()) {
    if (!policy.enabled)
        return Object.freeze({ quiet: false, reason: 'Quiet hours disabled' });
    const timezone = policy.timezone || 'UTC';
    const local = new Date(new Date(now).toLocaleString('en-US', { timeZone: timezone }));
    const minutes = local.getHours() * 60 + local.getMinutes();
    const parse = value => { const [h, m] = String(value || '00:00').split(':').map(Number); return h * 60 + m; };
    const start = parse(policy.start || '22:00');
    const end = parse(policy.end || '07:00');
    const quiet = start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
    const bypass = (policy.bypassSeverities || ['CRITICAL']).includes(String(policy.severity || '').toUpperCase());
    return Object.freeze({ quiet: quiet && !bypass, reason: quiet ? (bypass ? 'Severity bypassed quiet hours' : 'Current time is inside quiet hours') : 'Current time is outside quiet hours', timezone, localTime: local.toISOString() });
}
