import { deepGet } from './utilities.js';
const TOKEN = /{{\s*([a-zA-Z0-9_.-]+)\s*}}/g;
export function interpolateText(template, context = {}, options = {}) {
    return String(template ?? '').replace(TOKEN, (_match, path) => {
        const value = deepGet(context, path, options.missing ?? '');
        if (value === null || value === undefined)
            return options.missing ?? '';
        if (typeof value === 'object')
            return JSON.stringify(value);
        return String(value);
    });
}
export function interpolateValue(value, context = {}, options = {}) {
    if (typeof value === 'string')
        return interpolateText(value, context, options);
    if (Array.isArray(value))
        return value.map(item => interpolateValue(item, context, options));
    if (value && typeof value === 'object')
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, interpolateValue(item, context, options)]));
    return value;
}
export function referencedPaths(template) {
    const paths = new Set();
    const scan = value => {
        if (typeof value === 'string')
            for (const match of value.matchAll(TOKEN))
                paths.add(match[1]);
        else if (Array.isArray(value))
            value.forEach(scan);
        else if (value && typeof value === 'object')
            Object.values(value).forEach(scan);
    };
    scan(template);
    return Object.freeze([...paths].sort());
}
