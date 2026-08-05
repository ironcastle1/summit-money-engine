export function commercialPrompt(title, fields = []) {
    const values = {};
    for (const field of fields) {
        const value = window.prompt(`${title}\n${field.label}`, field.value || '');
        if (value === null)
            return null;
        values[field.key] = value;
    }
    return values;
}
