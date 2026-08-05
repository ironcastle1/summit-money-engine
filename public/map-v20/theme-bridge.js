export class ThemeBridge {
    constructor(options = {}) { this.root = options.root || document.documentElement; this.map = options.map || null; this.observer = new MutationObserver(() => this.apply()); this.observer.observe(this.root, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] }); this.apply(); }
    apply() { const style = getComputedStyle(this.root); const variables = { accent: style.getPropertyValue('--blue').trim() || style.getPropertyValue('--accent').trim(), panel: style.getPropertyValue('--panel').trim(), text: style.getPropertyValue('--text').trim(), background: style.getPropertyValue('--background').trim() }; this.map?.container?.style.setProperty('--map-accent', variables.accent); this.map?.container?.style.setProperty('--map-panel', variables.panel); this.map?.container?.style.setProperty('--map-text', variables.text); this.map?.events?.emit('themechange', variables); }
    destroy() { this.observer.disconnect(); }
}
