import { deepGet } from './utilities.js';
function normalize(value, caseSensitive) {
    return typeof value === 'string' && !caseSensitive ? value.toLowerCase() : value;
}
export function evaluateCondition(condition, context = {}) {
    const actualRaw = deepGet(context, condition.path);
    const expectedRaw = condition.value;
    const actual = normalize(actualRaw, condition.caseSensitive);
    const expected = normalize(expectedRaw, condition.caseSensitive);
    let passed = false;
    switch (condition.operator) {
        case 'EQ':
            passed = actual === expected;
            break;
        case 'NE':
            passed = actual !== expected;
            break;
        case 'GT':
            passed = Number(actual) > Number(expected);
            break;
        case 'GTE':
            passed = Number(actual) >= Number(expected);
            break;
        case 'LT':
            passed = Number(actual) < Number(expected);
            break;
        case 'LTE':
            passed = Number(actual) <= Number(expected);
            break;
        case 'IN':
            passed = Array.isArray(expected) && expected.map(item => normalize(item, condition.caseSensitive)).includes(actual);
            break;
        case 'NOT_IN':
            passed = Array.isArray(expected) && !expected.map(item => normalize(item, condition.caseSensitive)).includes(actual);
            break;
        case 'CONTAINS':
            passed = Array.isArray(actual) ? actual.includes(expected) : String(actual ?? '').includes(String(expected ?? ''));
            break;
        case 'STARTS_WITH':
            passed = String(actual ?? '').startsWith(String(expected ?? ''));
            break;
        case 'ENDS_WITH':
            passed = String(actual ?? '').endsWith(String(expected ?? ''));
            break;
        case 'EXISTS':
            passed = actualRaw !== undefined && actualRaw !== null;
            break;
        case 'NOT_EXISTS':
            passed = actualRaw === undefined || actualRaw === null;
            break;
        case 'MATCHES':
            passed = new RegExp(String(expectedRaw), condition.caseSensitive ? '' : 'i').test(String(actualRaw ?? ''));
            break;
        default: passed = false;
    }
    return Object.freeze({ passed: condition.negate ? !passed : passed, actual: actualRaw, expected: expectedRaw, condition });
}
export function evaluateConditions(conditions = [], context = {}, mode = 'ALL') {
    const results = conditions.map(condition => evaluateCondition(condition, context));
    const passed = !results.length || (String(mode).toUpperCase() === 'ANY' ? results.some(item => item.passed) : results.every(item => item.passed));
    return Object.freeze({ passed, results: Object.freeze(results) });
}
