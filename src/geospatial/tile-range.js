import { TILE_SIZE } from './constants.js';
import { projectWorld, worldSize } from './mercator.js';
import { normalizeTile, tileKey } from './tile-coordinate.js';
export function visibleTiles(viewport, options = {}) {
    const tileSize = options.tileSize || TILE_SIZE;
    const zoom = Math.max(0, Math.floor(viewport.zoom));
    const center = projectWorld(viewport.center, zoom, tileSize);
    const halfWidth = viewport.width / 2;
    const halfHeight = viewport.height / 2;
    const minimumX = Math.floor((center.x - halfWidth) / tileSize);
    const maximumX = Math.floor((center.x + halfWidth) / tileSize);
    const minimumY = Math.floor((center.y - halfHeight) / tileSize);
    const maximumY = Math.floor((center.y + halfHeight) / tileSize);
    const count = 2 ** zoom;
    const output = [];
    for (let y = Math.max(0, minimumY); y <= Math.min(count - 1, maximumY); y += 1) {
        for (let x = minimumX; x <= maximumX; x += 1) {
            const tile = normalizeTile({ z: zoom, x, y });
            output.push({ ...tile, worldX: x, key: tileKey(tile, options.source), left: x * tileSize - center.x + halfWidth, top: y * tileSize - center.y + halfHeight });
        }
    }
    return output;
}
export function worldPixelBounds(viewport, tileSize = TILE_SIZE) {
    const center = projectWorld(viewport.center, viewport.zoom, tileSize);
    const size = worldSize(viewport.zoom, tileSize);
    return { left: center.x - viewport.width / 2, top: center.y - viewport.height / 2, right: center.x + viewport.width / 2, bottom: center.y + viewport.height / 2, worldSize: size };
}
