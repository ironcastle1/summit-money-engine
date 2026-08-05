function first(properties, keys) { for (const key of keys)
    if (String(properties?.[key] || '').trim())
        return String(properties[key]).trim(); return ''; }
export function bilingualText(properties = {}) { const english = first(properties, ['labelEnglish', 'nameEnglish', 'englishName', 'name']); const local = first(properties, ['labelLocal', 'nameLocal', 'localName', 'nativeName']); const primary = english || local || String(properties.title || ''); const secondary = local && local.toLocaleLowerCase() !== primary.toLocaleLowerCase() ? local : ''; return { primary, secondary }; }
export function labelLines(properties = {}) { const value = bilingualText(properties); return value.secondary ? [value.primary, `(${value.secondary})`] : [value.primary]; }
