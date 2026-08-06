export function performanceBudget(input = {}) { const budgets = input.budgets || {}, actual = input.actual || {}, checks = []; for (const [metric, limit] of Object.entries(budgets)) {
    const value = Number(actual[metric]);
    const maximum = Number(limit);
    const state = !Number.isFinite(value) ? 'NOT_RUN' : value <= maximum ? 'PASS' : value <= maximum * 1.1 ? 'WARN' : 'FAIL';
    checks.push({ metric, value: Number.isFinite(value) ? value : null, maximum, state, variance: Number.isFinite(value) ? value - maximum : null });
} return Object.freeze({ checks, pass: !checks.some(item => item.state === 'FAIL' || item.state === 'NOT_RUN'), failures: checks.filter(item => item.state === 'FAIL'), warnings: checks.filter(item => item.state === 'WARN') }); }
