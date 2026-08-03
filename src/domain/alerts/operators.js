export const ALERT_OPERATORS = Object.freeze([
  'GT', 'GTE', 'LT', 'LTE', 'EQ', 'NEQ', 'IN', 'NOT_IN', 'CONTAINS', 'BETWEEN', 'CHANGED_BY'
]);

export function compare(operator, actual, expected, context = {}) {
  switch (operator) {
    case 'GT': return Number.isFinite(Number(actual)) && Number(actual) > Number(expected);
    case 'GTE': return Number.isFinite(Number(actual)) && Number(actual) >= Number(expected);
    case 'LT': return Number.isFinite(Number(actual)) && Number(actual) < Number(expected);
    case 'LTE': return Number.isFinite(Number(actual)) && Number(actual) <= Number(expected);
    case 'EQ': return actual === expected || String(actual) === String(expected);
    case 'NEQ': return !(actual === expected || String(actual) === String(expected));
    case 'IN': return Array.isArray(expected) && expected.map(String).includes(String(actual));
    case 'NOT_IN': return Array.isArray(expected) && !expected.map(String).includes(String(actual));
    case 'CONTAINS': return Array.isArray(actual) ? actual.map(String).includes(String(expected)) : String(actual || '').toLowerCase().includes(String(expected || '').toLowerCase());
    case 'BETWEEN': {
      if (!Array.isArray(expected) || expected.length < 2 || !Number.isFinite(Number(actual))) return false;
      const lower = Number(expected[0]);
      const upper = Number(expected[1]);
      return Number(actual) >= Math.min(lower, upper) && Number(actual) <= Math.max(lower, upper);
    }
    case 'CHANGED_BY': {
      const previous = context.previous;
      if (!Number.isFinite(Number(actual)) || !Number.isFinite(Number(previous))) return false;
      return Math.abs(Number(actual) - Number(previous)) >= Math.abs(Number(expected));
    }
    default: return false;
  }
}
