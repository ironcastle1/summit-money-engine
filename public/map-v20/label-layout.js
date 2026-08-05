function intersects(left, right, padding = 3) { return !(left.right + padding < right.left || left.left - padding > right.right || left.bottom + padding < right.top || left.top - padding > right.bottom); }
function priority(feature) { const properties = feature.properties || {}; return Number(properties.labelPriority || properties.importance || 0) + (properties.labelType === 'country' ? 100 : properties.labelType === 'capital' ? 90 : properties.labelType === 'city' ? 60 : 30); }
export function layoutLabels(candidates, options = {}) { const accepted = []; const sorted = [...candidates].sort((a, b) => priority(b.feature) - priority(a.feature)); for (const candidate of sorted) {
    if (candidate.point.x < 0 || candidate.point.y < 0 || candidate.point.x > options.width || candidate.point.y > options.height)
        continue;
    if (accepted.some(existing => intersects(existing.box, candidate.box, options.padding || 3)))
        continue;
    accepted.push(candidate);
    if (accepted.length >= (options.maximum || 150))
        break;
} return accepted; }
export function estimateLabelBox(point, lines, options = {}) { const width = Math.max(...lines.map(line => line.length), 1) * (options.characterWidth || 6.4); const height = lines.length * (options.lineHeight || 13); return { left: point.x - width / 2, right: point.x + width / 2, top: point.y + (options.offsetY || 10), bottom: point.y + (options.offsetY || 10) + height }; }
