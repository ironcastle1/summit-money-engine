export function clamp(value, minimum, maximum) {
    const number = Number(value);
    if (!Number.isFinite(number))
        return minimum;
    return Math.min(maximum, Math.max(minimum, number));
}
export function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}
export function nearlyEqual(left, right, epsilon = 1e-9) {
    return Math.abs(Number(left) - Number(right)) <= epsilon;
}
export function positiveModulo(value, divisor) {
    const result = Number(value) % Number(divisor);
    return result < 0 ? result + Number(divisor) : result;
}
export function roundTo(value, digits = 6) {
    const scale = 10 ** digits;
    return Math.round(Number(value) * scale) / scale;
}
