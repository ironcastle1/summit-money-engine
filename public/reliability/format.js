export const escapeReliability = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const operationsNumber = value => Number.isFinite(Number(value)) ? new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(Number(value)) : '--';
export const operationsAge = value => {
    const time = Date.parse(value);
    if (!Number.isFinite(time))
        return '--';
    const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
    return minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.round(minutes / 60)}h ago` : `${Math.round(minutes / 1440)}d ago`;
};
export const stateClass = value => String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
