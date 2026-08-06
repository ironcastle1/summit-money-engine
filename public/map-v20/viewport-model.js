import { DEFAULT_CENTER } from './constants.js';
import { clampViewport } from './world-boundary.js';
import { project, unproject } from './projection.js';
export class ViewportModel {
    get zoom() { return this.state.zoom; }
    constructor(options = {}) { this.state = clampViewport({ center: { lat: Number(options.center?.lat ?? DEFAULT_CENTER.lat), lon: Number(options.center?.lon ?? DEFAULT_CENTER.lon) }, zoom: Number(options.zoom ?? 2), size: { width: Math.max(320, Number(options.width || 320)), height: Math.max(240, Number(options.height || 240)) } }); }
    snapshot() { return { center: { ...this.state.center }, zoom: this.state.zoom, minimumZoom: this.state.minimumZoom, size: { ...this.state.size } }; }
    resize(width, height) { this.state = clampViewport({ ...this.state, size: { width: Math.max(320, Math.round(width)), height: Math.max(240, Math.round(height)) } }); return this.snapshot(); }
    setCenter(center) { this.state = clampViewport({ ...this.state, center: { lat: Number(center.lat), lon: Number(center.lon) } }); return this.snapshot(); }
    setZoom(zoom) { this.state = clampViewport({ ...this.state, zoom: Number(zoom) }); return this.snapshot(); }
    project(point) { const center = project(this.state.center, this.state.zoom); const value = project(point, this.state.zoom); return { x: this.state.size.width / 2 + value.x - center.x, y: this.state.size.height / 2 + value.y - center.y }; }
    unproject(pixel) { const center = project(this.state.center, this.state.zoom); return unproject({ x: center.x + Number(pixel.x) - this.state.size.width / 2, y: center.y + Number(pixel.y) - this.state.size.height / 2 }, this.state.zoom); }
    panBy(delta) { const center = project(this.state.center, this.state.zoom); this.state = clampViewport({ ...this.state, center: unproject({ x: center.x - Number(delta.x || 0), y: center.y - Number(delta.y || 0) }, this.state.zoom) }); return this.snapshot(); }
    zoomAround(zoom, pixel) { const anchor = this.unproject(pixel); this.setZoom(zoom); const projected = this.project(anchor); return this.panBy({ x: projected.x - pixel.x, y: projected.y - pixel.y }); }
}
