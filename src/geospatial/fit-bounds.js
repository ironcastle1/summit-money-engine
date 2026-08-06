import { TILE_SIZE } from './constants.js';
import { bboxCenter, bboxHeight, bboxWidth } from './bbox.js';
import { mercatorX, mercatorY } from './mercator.js';
import { viewport } from './viewport.js';
function paddingValue(padding, side) {
    if (Number.isFinite(Number(padding)))
        return Number(padding);
    return Number(padding?.[side] || 0);
}
export function fitBounds(bounds, dimensions, options = {}) {
    const left = paddingValue(options.padding, 'left');
    const right = paddingValue(options.padding, 'right');
    const top = paddingValue(options.padding, 'top');
    const bottom = paddingValue(options.padding, 'bottom');
    const availableWidth = Math.max(1, dimensions.width - left - right);
    const availableHeight = Math.max(1, dimensions.height - top - bottom);
    const westX = mercatorX(bounds.west);
    let eastX = mercatorX(bounds.east);
    if (bboxWidth(bounds) > 180 && eastX < westX)
        eastX += 1;
    const northY = mercatorY(bounds.north);
    const southY = mercatorY(bounds.south);
    const widthFraction = Math.max(Math.abs(eastX - westX), 1 / (2 ** (options.maximumZoom ?? 20)));
    const heightFraction = Math.max(Math.abs(southY - northY), 1 / (2 ** (options.maximumZoom ?? 20)));
    const zoomX = Math.log2(availableWidth / TILE_SIZE / widthFraction);
    const zoomY = Math.log2(availableHeight / TILE_SIZE / heightFraction);
    const zoom = Math.min(options.maximumZoom ?? 18, zoomX, zoomY);
    const center = bboxCenter(bounds);
    return viewport({ center, zoom, width: dimensions.width, height: dimensions.height }, options);
}
export function fitCoordinates(points, dimensions, options = {}) {
    if (!points?.length)
        return viewport({ width: dimensions.width, height: dimensions.height }, options);
    const lats = points.map(point => Number(point.lat));
    const lons = points.map(point => Number(point.lon));
    return fitBounds({ west: Math.min(...lons), south: Math.min(...lats), east: Math.max(...lons), north: Math.max(...lats) }, dimensions, options);
}
