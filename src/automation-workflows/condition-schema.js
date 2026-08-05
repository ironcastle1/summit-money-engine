import { CONDITION_OPERATORS } from './constants.js';
import { clean, frozen } from './utilities.js';
export function conditionRecord(input = {}, index = 0) {
    const operator = String(input.operator || 'EQ').toUpperCase();
    if (!CONDITION_OPERATORS.includes(operator))
        throw new TypeError(`Unsupported condition operator: ${operator}`);
    const path = clean(input.path, 240);
    if (!path)
        throw new TypeError(`Condition ${index + 1} requires a path`);
    return frozen({
        id: clean(input.id, 120) || `condition-${index + 1}`,
        path,
        operator,
        value: input.value,
        caseSensitive: Boolean(input.caseSensitive),
        negate: Boolean(input.negate)
    });
}
