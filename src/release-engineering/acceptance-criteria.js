export function acceptanceCriteria(criteria = [], evidence = {}) { const rows = criteria.map(item => { const value = evidence[item.id]; let state = 'NOT_RUN'; if (typeof item.evaluate === 'function')
    state = item.evaluate(value) ? 'PASS' : 'FAIL';
else if (item.expected !== undefined)
    state = JSON.stringify(value) === JSON.stringify(item.expected) ? 'PASS' : 'FAIL';
else
    state = value ? 'PASS' : 'FAIL'; return { id: item.id, title: item.title || item.id, required: item.required !== false, state, value }; }); const blockers = rows.filter(item => item.required && item.state !== 'PASS'); return Object.freeze({ rows, accepted: blockers.length === 0, blockers, passCount: rows.filter(item => item.state === 'PASS').length, total: rows.length }); }
