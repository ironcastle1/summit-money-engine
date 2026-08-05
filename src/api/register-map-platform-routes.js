import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
import { boundedString, clampInteger, finiteNumber } from '../core/validation.js';
function optionalNumber(value, fallback) { return value === null || value === undefined || value === '' ? fallback : Number(value); }
function boundsFromQuery(query) {
    if (![query.get('west'), query.get('south'), query.get('east'), query.get('north')].some(value => value !== null))
        return null;
    return {
        west: finiteNumber(query.get('west'), 'west', { min: -540, max: 540 }), south: finiteNumber(query.get('south'), 'south', { min: -90, max: 90 }),
        east: finiteNumber(query.get('east'), 'east', { min: -540, max: 540 }), north: finiteNumber(query.get('north'), 'north', { min: -90, max: 90 })
    };
}
function csrf(request) { return request.headers['x-csrf-token']; }
export function registerMapPlatformRoutes(router, services) {
    router.get('/api/map/platform', async ({ response }) => sendJson(response, 200, services.mapPlatform.bootstrap(), { cacheControl: 'public, max-age=300' }));
    router.get('/api/map/layers', async ({ response }) => sendJson(response, 200, services.mapPlatform.layers.snapshot(), { cacheControl: 'public, max-age=300' }));
    router.get('/api/map/diagnostics', async ({ response }) => sendJson(response, 200, services.mapDiagnostics.snapshot()));
    router.get('/api/map/search', async ({ response, context }) => {
        const query = boundedString(context.query.get('q'), 'q', { min: 1, max: 120 });
        const near = context.query.get('lat') !== null && context.query.get('lon') !== null ? { lat: finiteNumber(context.query.get('lat'), 'lat', { min: -90, max: 90 }), lon: finiteNumber(context.query.get('lon'), 'lon', { min: -180, max: 180 }) } : undefined;
        sendJson(response, 200, { query, results: services.mapPlatform.searchPlaces(query, { near, limit: clampInteger(context.query.get('limit'), 12, 1, 50) }) });
    });
    router.get('/api/map/features/:layerId', async ({ response, context, params }) => {
        const layerId = boundedString(params.layerId, 'layerId', { min: 2, max: 64 });
        const result = await services.mapPlatform.layerData(layerId, { bounds: boundsFromQuery(context.query), limit: clampInteger(context.query.get('limit'), 5000, 1, 5000), maxAgeMs: clampInteger(context.query.get('maxAgeMs'), 20000, 1000, 300000) });
        sendJson(response, 200, { layerId, ...result }, { cacheControl: layerId === 'events' ? 'no-store' : 'public, max-age=3600' });
    });
    router.post('/api/map/fit', async ({ request, response }) => {
        const body = await readJsonBody(request, { maximumBytes: 100000 });
        sendJson(response, 200, { viewport: services.mapPlatform.fit(body) });
    });
    router.get('/api/map/saved-views', async ({ request, response }) => {
        const auth = await services.auth.requireUser(request);
        sendJson(response, 200, { views: await services.savedMapViews.list(auth.user) });
    });
    router.post('/api/map/saved-views', async ({ request, response }) => {
        const auth = await services.auth.requireUser(request);
        services.auth.verifyCsrf(auth, csrf(request));
        const body = await readJsonBody(request, { maximumBytes: 250000 });
        services.mapDiagnostics.increment('savedViewWrites');
        sendJson(response, 200, { views: await services.savedMapViews.put(auth.user, body.view || body) });
    });
    router.post('/api/map/saved-views/delete', async ({ request, response }) => {
        const auth = await services.auth.requireUser(request);
        services.auth.verifyCsrf(auth, csrf(request));
        const body = await readJsonBody(request, { maximumBytes: 50000 });
        sendJson(response, 200, await services.savedMapViews.remove(auth.user, boundedString(body.id, 'id', { min: 1, max: 160 })));
    });
}
