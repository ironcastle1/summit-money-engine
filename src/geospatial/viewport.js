import { DEFAULT_VIEWPORT, TILE_SIZE } from './constants.js';
import { clamp } from './number.js';
import { coordinate } from './coordinate.js';
import { projectWorld, unprojectWorld } from './mercator.js';
import { clampViewportToWorld } from './world-clamp.js';
export function viewport(input = {}, options = {}) {
    const value = {
        center: coordinate(input.center?.lat ?? DEFAULT_VIEWPORT.center.lat, input.center?.lon ?? DEFAULT_VIEWPORT.center.lon),
        zoom: Number.isFinite(Number(input.zoom)) ? Number(input.zoom) : DEFAULT_VIEWPORT.zoom,
        bearing: clamp(input.bearing ?? 0, -180, 180),
        pitch: clamp(input.pitch ?? 0, 0, 60),
        width: Math.max(1, Math.round(Number(input.width) || DEFAULT_VIEWPORT.width)),
        height: Math.max(1, Math.round(Number(input.height) || DEFAULT_VIEWPORT.height))
    };
    return clampViewportToWorld(value, options);
}
export function projectToViewport(point, value, tileSize = TILE_SIZE) {
    const center = projectWorld(value.center, value.zoom, tileSize);
    const projected = projectWorld(point, value.zoom, tileSize);
    return { x: value.width / 2 + projected.x - center.x, y: value.height / 2 + projected.y - center.y };
}
export function unprojectFromViewport(pixel, value, tileSize = TILE_SIZE) {
    const center = projectWorld(value.center, value.zoom, tileSize);
    return unprojectWorld({ x: center.x + Number(pixel.x) - value.width / 2, y: center.y + Number(pixel.y) - value.height / 2 }, value.zoom, tileSize);
}
export function panViewport(value, delta, options = {}) {
    const center = projectWorld(value.center, value.zoom, options.tileSize || TILE_SIZE);
    return viewport({ ...value, center: unprojectWorld({ x: center.x - Number(delta.x || 0), y: center.y - Number(delta.y || 0) }, value.zoom, options.tileSize || TILE_SIZE) }, options);
}
export function zoomViewportAround(value, nextZoom, pixel, options = {}) {
    const anchor = unprojectFromViewport(pixel, value, options.tileSize || TILE_SIZE);
    const candidate = viewport({ ...value, zoom: nextZoom }, options);
    const projectedAnchor = projectToViewport(anchor, candidate, options.tileSize || TILE_SIZE);
    return panViewport(candidate, { x: projectedAnchor.x - pixel.x, y: projectedAnchor.y - pixel.y }, options);
}
