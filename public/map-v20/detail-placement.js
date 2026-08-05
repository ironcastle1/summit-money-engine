import { clamp } from './math.js';
export function placeFloatingPanel(anchor, panelSize, viewportSize, options = {}) { const margin = options.margin || 10; const offset = options.offset || 14; let left = anchor.x + offset; let top = anchor.y + offset; if (left + panelSize.width + margin > viewportSize.width)
    left = anchor.x - panelSize.width - offset; if (top + panelSize.height + margin > viewportSize.height)
    top = anchor.y - panelSize.height - offset; return { left: clamp(left, margin, Math.max(margin, viewportSize.width - panelSize.width - margin)), top: clamp(top, margin, Math.max(margin, viewportSize.height - panelSize.height - margin)) }; }
