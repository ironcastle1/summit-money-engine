import { rafThrottle } from './math.js';

export class GestureController {
  constructor(options) {
    Object.assign(this, options);
    this.drag = null;
    this.wheelAccumulator = 0;
    this.lastWheelAt = 0;
    this.move = rafThrottle(event => this.#move(event));
    this.#bind();
  }

  #bind() {
    this.onWheel = event => {
      event.preventDefault();
      const multiplier = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? 120 : 1;
      const pinchFactor = event.ctrlKey ? 0.42 : 1;
      this.wheelAccumulator += event.deltaY * multiplier * pinchFactor;
      const now = performance.now();
      if (now - this.lastWheelAt < 75 || Math.abs(this.wheelAccumulator) < 95) return;
      this.lastWheelAt = now;
      const direction = this.wheelAccumulator < 0 ? 1 : -1;
      this.wheelAccumulator = 0;
      const box = this.element.getBoundingClientRect();
      this.viewport.zoomAround(
        Math.round(this.viewport.state.zoom + direction),
        { x: event.clientX - box.left, y: event.clientY - box.top }
      );
      this.changed('zoom');
    };

    this.onDown = event => {
      if (event.button !== 0) return;
      this.drag = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
      this.element.setPointerCapture?.(event.pointerId);
    };
    this.onUp = event => this.#finish(event);
    this.onDoubleClick = event => {
      const box = this.element.getBoundingClientRect();
      this.viewport.zoomAround(Math.round(this.viewport.state.zoom + 1), { x: event.clientX - box.left, y: event.clientY - box.top });
      this.changed('zoom');
    };

    this.element.addEventListener('wheel', this.onWheel, { passive: false });
    this.element.addEventListener('pointerdown', this.onDown);
    this.element.addEventListener('pointermove', this.move);
    this.element.addEventListener('pointerup', this.onUp);
    this.element.addEventListener('pointercancel', this.onUp);
    this.element.addEventListener('dblclick', this.onDoubleClick);
  }

  #move(event) {
    if (!this.drag) return;
    const dx = event.clientX - this.drag.lastX;
    const dy = event.clientY - this.drag.lastY;
    this.drag.lastX = event.clientX;
    this.drag.lastY = event.clientY;
    if (Math.abs(event.clientX - this.drag.x) + Math.abs(event.clientY - this.drag.y) > 4) this.drag.moved = true;
    this.viewport.panBy({ x: dx, y: dy });
    this.changed('pan');
  }

  #finish(event) {
    if (!this.drag) return;
    const moved = this.drag.moved;
    this.drag = null;
    this.element.releasePointerCapture?.(event.pointerId);
    if (!moved) this.click?.(event);
  }

  destroy() {
    this.element.removeEventListener('wheel', this.onWheel);
    this.element.removeEventListener('pointerdown', this.onDown);
    this.element.removeEventListener('pointermove', this.move);
    this.element.removeEventListener('pointerup', this.onUp);
    this.element.removeEventListener('pointercancel', this.onUp);
    this.element.removeEventListener('dblclick', this.onDoubleClick);
  }
}
