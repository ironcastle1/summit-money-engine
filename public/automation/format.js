export function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
export function ageLabel(value) { const elapsed = Date.now() - Date.parse(value || 0); if (!Number.isFinite(elapsed))
    return 'UNKNOWN'; if (elapsed < 60000)
    return 'NOW'; if (elapsed < 3600000)
    return `${Math.floor(elapsed / 60000)}M`; if (elapsed < 86400000)
    return `${Math.floor(elapsed / 3600000)}H`; return `${Math.floor(elapsed / 86400000)}D`; }
export function stateClass(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
