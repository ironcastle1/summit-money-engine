export class InteractionController {
    constructor(options) { Object.assign(this, options); this.#bind(); }
    #target(event) { return event.target.closest?.('[data-map-entity]'); }
    #bind() { this.surface.addEventListener('click', this.onClick = event => { const target = this.#target(event); if (!target)
        return; event.stopPropagation(); const entity = this.entities.get(target.dataset.mapEntity); if (entity)
        this.select?.(entity); }); this.surface.addEventListener('keydown', this.onKeyDown = event => { if (!['Enter', ' '].includes(event.key))
        return; const target = this.#target(event); if (!target)
        return; event.preventDefault(); const entity = this.entities.get(target.dataset.mapEntity); if (entity)
        this.select?.(entity); }); this.surface.addEventListener('pointermove', this.onMove = event => { const target = this.#target(event); if (!target) {
        this.tooltip.hide();
        return;
    } const entity = this.entities.get(target.dataset.mapEntity); const value = entity?.data || entity?.feature?.properties || {}; this.tooltip.show(value.title || value.nameEnglish || value.name || value.labelText || entity?.kind || 'Map item', { x: event.clientX, y: event.clientY }); }); this.surface.addEventListener('pointerleave', this.onLeave = () => this.tooltip.hide()); }
    destroy() { this.surface.removeEventListener('click', this.onClick); this.surface.removeEventListener('keydown', this.onKeyDown); this.surface.removeEventListener('pointermove', this.onMove); this.surface.removeEventListener('pointerleave', this.onLeave); }
}
