import { SVG_NS } from './constants.js';
export function svg(tag, attributes = {}) { const element = document.createElementNS(SVG_NS, tag); for (const [name, value] of Object.entries(attributes))
    element.setAttribute(name, String(value)); return element; }
export class SvgSurface {
    constructor(container) { this.root = svg('svg', { class: 'merlin-v20-overlay', role: 'application', 'aria-label': 'Interactive Merlin world map' }); this.groups = new Map(); container.append(this.root); }
    resize(width, height) { this.root.setAttribute('viewBox', `0 0 ${width} ${height}`); this.root.setAttribute('width', width); this.root.setAttribute('height', height); }
    group(id, order = 0) { if (this.groups.has(id))
        return this.groups.get(id); const group = svg('g', { 'data-layer-group': id, 'data-order': order }); this.groups.set(id, group); this.root.append(group); this.#sort(); return group; }
    clear(id) { this.groups.get(id)?.replaceChildren(); }
    setVisible(id, visible) { const group = this.groups.get(id); if (group)
        group.style.display = visible ? '' : 'none'; }
    #sort() { [...this.groups.values()].sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order)).forEach(group => this.root.append(group)); }
    destroy() { this.root.remove(); this.groups.clear(); }
}
