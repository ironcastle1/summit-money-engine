import { clean } from './utilities.js';
export function requiredVariable(input = {}) { const key = clean(input.key, 160); if (!key)
    throw new TypeError('Variable key required'); return Object.freeze({ key, description: clean(input.description, 500), secret: Boolean(input.secret), requiredIn: Array.isArray(input.requiredIn) ? input.requiredIn : ['production'], validation: clean(input.validation || 'NON_EMPTY', 80), example: input.secret ? null : clean(input.example, 200) }); }
