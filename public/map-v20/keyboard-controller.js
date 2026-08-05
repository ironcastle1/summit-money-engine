export class KeyboardController {
    constructor(options) { Object.assign(this, options); this.element.tabIndex ||= 0; this.element.addEventListener('keydown', this.onKeyDown = event => this.#handle(event)); }
    #handle(event) { const step = event.shiftKey ? 160 : 70; let handled = true; if (event.key === 'ArrowLeft')
        this.viewport.panBy({ x: -step, y: 0 });
    else if (event.key === 'ArrowRight')
        this.viewport.panBy({ x: step, y: 0 });
    else if (event.key === 'ArrowUp')
        this.viewport.panBy({ x: 0, y: -step });
    else if (event.key === 'ArrowDown')
        this.viewport.panBy({ x: 0, y: step });
    else if (event.key === '+' || event.key === '=')
        this.viewport.setZoom(this.viewport.state.zoom + 1);
    else if (event.key === '-' || event.key === '_')
        this.viewport.setZoom(this.viewport.state.zoom - 1);
    else if (event.key === 'Home') {
        this.viewport.setCenter({ lat: 20, lon: 0 });
        this.viewport.setZoom(2);
    }
    else
        handled = false; if (handled) {
        event.preventDefault();
        this.changed('keyboard');
    } }
    destroy() { this.element.removeEventListener('keydown', this.onKeyDown); }
}
