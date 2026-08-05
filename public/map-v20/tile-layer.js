import { TILE_SIZE } from './constants.js';
import { project } from './projection.js';
import { TileCache } from './tile-cache.js';
import { TileScheduler } from './tile-scheduler.js';
export class TileLayer {
    constructor(container, source) { this.container = container; this.source = source; this.cache = new TileCache(196); this.scheduler = new TileScheduler({ maximumConcurrent: 8 }); }
    setSource(source) { if (this.source?.id === source?.id)
        return; this.source = source; this.clear(); }
    render(viewport) {
        if (!this.source?.enabled) {
            this.container.replaceChildren();
            this.cache.clear();
            return;
        }
        const zoom = Math.max(0, Math.floor(viewport.zoom));
        const count = 2 ** zoom;
        const center = project(viewport.center, zoom);
        const halfWidth = viewport.size.width / 2;
        const halfHeight = viewport.size.height / 2;
        const minX = Math.floor((center.x - halfWidth) / TILE_SIZE);
        const maxX = Math.floor((center.x + halfWidth) / TILE_SIZE);
        const minY = Math.max(0, Math.floor((center.y - halfHeight) / TILE_SIZE));
        const maxY = Math.min(count - 1, Math.floor((center.y + halfHeight) / TILE_SIZE));
        const visible = [];
        for (let y = minY; y <= maxY; y += 1)
            for (let worldX = minX; worldX <= maxX; worldX += 1) {
                if (worldX < 0 || worldX >= count)
                    continue;
                const tile = { z: zoom, x: worldX, y };
                const key = `${this.source.id}:${zoom}/${worldX}/${y}`;
                visible.push(key);
                let record = this.cache.get(key);
                if (!record) {
                    const image = document.createElement('img');
                    image.className = 'merlin-v20-tile';
                    image.alt = '';
                    image.draggable = false;
                    image.decoding = 'async';
                    image.loading = 'eager';
                    record = { element: image, loaded: false };
                    this.cache.set(key, record);
                    this.container.append(image);
                    this.scheduler.schedule(key, () => this.#load(image, tile), -Math.hypot(worldX - center.x / TILE_SIZE, y - center.y / TILE_SIZE)).catch(() => { });
                }
                const image = record.element;
                image.style.left = `${worldX * TILE_SIZE - center.x + halfWidth}px`;
                image.style.top = `${y * TILE_SIZE - center.y + halfHeight}px`;
            }
        this.cache.retain(visible);
    }
    #load(image, tile) { return new Promise(resolve => { image.onload = () => { image.classList.add('loaded'); resolve(true); }; image.onerror = () => { const fallback = this.source.fallbackUrl(tile); if (fallback && image.src !== fallback)
        image.src = fallback;
    else {
        image.remove();
        resolve(false);
    } }; image.src = this.source.url(tile); }); }
    clear() { this.scheduler.clear(); this.cache.clear(); this.container.replaceChildren(); }
}
