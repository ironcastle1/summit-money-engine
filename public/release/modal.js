export function releasePrompt(title, fields = []) {
    const result = {};
    for (const field of fields) {
        const value = window.prompt(`${title}

${field.label}`, field.value || '');
        if (value === null)
            return null;
        result[field.key] = value;
    }
    return result;
}
