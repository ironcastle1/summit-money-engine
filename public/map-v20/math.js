export const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
export const modulo = (value, divisor) => ((Number(value) % Number(divisor)) + Number(divisor)) % Number(divisor);
export const finite = value => Number.isFinite(Number(value));
export const lerp = (from, to, amount) => Number(from) + (Number(to) - Number(from)) * Number(amount);
export const distance2d = (left, right) => Math.hypot(Number(right.x) - Number(left.x), Number(right.y) - Number(left.y));
export function debounce(callback, delay = 100) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => callback(...args), delay); }; }
export function rafThrottle(callback) { let frame = 0; let latest; return (...args) => { latest = args; if (frame)
    return; frame = requestAnimationFrame(() => { frame = 0; callback(...latest); }); }; }
