import { placeFloatingPanel } from './detail-placement.js';
export class TooltipController {
    constructor(container) { this.container = container; this.element = document.createElement('div'); this.element.className = 'merlin-v20-tooltip hidden'; this.element.setAttribute('role', 'tooltip'); container.append(this.element); }
    show(text, clientPoint) { this.element.textContent = text; this.element.classList.remove('hidden'); const box = this.container.getBoundingClientRect(); const size = { width: this.element.offsetWidth || 240, height: this.element.offsetHeight || 42 }; const position = placeFloatingPanel({ x: clientPoint.x - box.left, y: clientPoint.y - box.top }, size, { width: box.width, height: box.height }); this.element.style.left = `${position.left}px`; this.element.style.top = `${position.top}px`; }
    hide() { this.element.classList.add('hidden'); }
    destroy() { this.element.remove(); }
}
