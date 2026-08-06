import { MAX_MERCATOR_LATITUDE, TILE_SIZE } from './constants.js';
import { clamp } from './number.js';
import { projectWorld, unprojectWorld, worldSize } from './mercator.js';
export function minimumWorldZoom(width, height, tileSize = TILE_SIZE) {
    const horizontal = Math.log2(Math.max(1, Number(width)) / tileSize);
    const vertical = Math.log2(Math.max(1, Number(height)) / tileSize);
    return Math.max(0, horizontal, vertical);
}
export function clampViewportToWorld(viewport, options = {}) {
    const tileSize = options.tileSize || TILE_SIZE;
    const minimumZoom = Math.max(options.minimumZoom || 0, minimumWorldZoom(viewport.width, viewport.height, tileSize));
    const zoom = clamp(viewport.zoom, minimumZoom, options.maximumZoom ?? 20);
    const size = worldSize(zoom, tileSize);
    const projected = projectWorld(viewport.center, zoom, tileSize);
    const halfWidth = Math.min(size / 2, viewport.width / 2);
    const halfHeight = Math.min(size / 2, viewport.height / 2);
    projected.x = clamp(projected.x, halfWidth, size - halfWidth);
    projected.y = clamp(projected.y, halfHeight, size - halfHeight);
    const center = unprojectWorld(projected, zoom, tileSize);
    center.lat = clamp(center.lat, -MAX_MERCATOR_LATITUDE, MAX_MERCATOR_LATITUDE);
    return Object.freeze({ ...viewport, center: Object.freeze(center), zoom, minimumZoom });
}
