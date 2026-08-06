const LOCAL_KEYS = ['nameLocal', 'localName', 'name_native', 'nativeName'];
const ENGLISH_KEYS = ['nameEnglish', 'englishName', 'name_en', 'name'];
function first(properties, keys) { for (const key of keys)
    if (String(properties?.[key] || '').trim())
        return String(properties[key]).trim(); return ''; }
export function bilingualLabel(properties = {}, options = {}) {
    const english = first(properties, ENGLISH_KEYS);
    const local = first(properties, LOCAL_KEYS);
    const fallback = String(properties.label || properties.title || properties.code || '').trim();
    const primary = english || fallback || local;
    const secondary = local && local.toLocaleLowerCase() !== primary.toLocaleLowerCase() ? local : '';
    return Object.freeze({ primary, secondary, text: secondary && options.includeLocal !== false ? `${primary}\n(${secondary})` : primary });
}
export function applyBilingualProperties(feature, options = {}) {
    const label = bilingualLabel(feature.properties, options);
    return Object.freeze({ ...feature, properties: Object.freeze({ ...(feature.properties || {}), labelEnglish: label.primary, labelLocal: label.secondary, labelText: label.text }) });
}
