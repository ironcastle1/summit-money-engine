import { TILE_SIZE, MAX_ZOOM } from './constants.js';
import { clamp } from './math.js';
import { project, unproject, worldSize } from './projection.js';
export function minimumZoomForSize(size) { return Math.max(0, Math.log2(Math.max(Number(size.width), Number(size.height), TILE_SIZE) / TILE_SIZE)); }
export function clampViewport(value) {
    const minimumZoom = minimumZoomForSize(value.size);
    const zoom = clamp(value.zoom, minimumZoom, MAX_ZOOM);
    const world = worldSize(zoom);
    const center = project(value.center, zoom);
    const halfWidth = Math.min(world / 2, value.size.width / 2);
    const halfHeight = Math.min(world / 2, value.size.height / 2);
    center.x = clamp(center.x, halfWidth, world - halfWidth);
    center.y = clamp(center.y, halfHeight, world - halfHeight);
    return { ...value, center: unproject(center, zoom), zoom, minimumZoom };
}
export function worldRect(value) { const world = worldSize(value.zoom); const center = project(value.center, value.zoom); return { left: value.size.width / 2 - center.x, top: value.size.height / 2 - center.y, width: world, height: world }; }
