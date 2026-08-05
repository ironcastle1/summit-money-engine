import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
import { clampInteger } from '../core/validation.js';
function safeId(value) {
    return String(value || '').trim().slice(0, 180);
}
export function registerProcessingRoutes(router, services) {
    router.get('/api/intelligence/processing/status', async ({ response }) => {
        sendJson(response, 200, services.intelligenceProcessing.status(), { cacheControl: 'no-store' });
    });
    router.post('/api/intelligence/processing/run', async ({ request, response, context }) => {
        const body = await readJsonBody(request, { maximumBytes: 2000000 });
        const records = Array.isArray(body.records) ? body.records.slice(0, 2000) : [];
        const result = services.intelligenceProcessing.process(records, {
            query: String(body.query || '').slice(0, 240),
            coordinate: body.coordinate || null,
            radiusKm: Number(body.radiusKm) || 1000,
            watchlist: Array.isArray(body.watchlist) ? body.watchlist.slice(0, 100) : []
        });
        sendJson(response, 200, {
            recordCount: result.records.length,
            clusterCount: result.clusters.length,
            eventCount: result.events.length,
            materialCount: result.materialEvents.length,
            filteredCount: result.filteredEvents.length,
            narrativeCount: result.narratives.length,
            events: result.events.slice(0, clampInteger(context.query.get('limit'), 100, 1, 500)),
            narratives: result.narratives,
            generatedAt: result.generatedAt
        });
    });
    router.post('/api/intelligence/processing/live', async ({ response, context }) => {
        const limit = clampInteger(context.query.get('limit'), 500, 1, 2000);
        const snapshot = await services.eventService.globalSnapshot({ maxAgeMs: 30000, limit });
        const records = (snapshot.events || []).map(event => ({
            ...event,
            sourceId: event.sourceId || event.source?.id || 'event-registry',
            timestamp: event.timestamp || event.updatedAt,
            coordinate: event.coordinate || (Number.isFinite(event.lat) && Number.isFinite(event.lon) ? { lat: event.lat, lon: event.lon } : null)
        }));
        const result = services.intelligenceProcessing.process(records, {
            query: String(context.query.get('q') || '').slice(0, 240)
        });
        sendJson(response, 200, {
            sourceEventCount: records.length,
            eventCount: result.events.length,
            materialCount: result.materialEvents.length,
            events: result.materialEvents,
            narratives: result.narratives,
            generatedAt: result.generatedAt
        });
    });
    router.get('/api/intelligence/material-events', async ({ response, context }) => {
        const limit = clampInteger(context.query.get('limit'), 100, 1, 500);
        const category = String(context.query.get('category') || '').toLowerCase().slice(0, 64);
        sendJson(response, 200, {
            events: services.intelligenceProcessing.materialEvents({ limit, category: category || null }),
            generatedAt: new Date().toISOString()
        });
    });
    router.get('/api/intelligence/material-events/:id', async ({ response, params }) => {
        const event = services.intelligenceProcessing.event(safeId(params.id));
        if (!event) {
            sendJson(response, 404, { error: { code: 'MATERIAL_EVENT_NOT_FOUND', message: 'Material event not found' } });
            return;
        }
        sendJson(response, 200, event);
    });
    router.get('/api/intelligence/entities/:id', async ({ response, params }) => {
        const entity = services.intelligenceProcessing.entity(safeId(params.id));
        if (!entity) {
            sendJson(response, 404, { error: { code: 'ENTITY_NOT_FOUND', message: 'Entity not found' } });
            return;
        }
        sendJson(response, 200, entity);
    });
    router.get('/api/intelligence/narratives/:id', async ({ response, params }) => {
        const narrative = services.intelligenceProcessing.narrative(safeId(params.id));
        if (!narrative) {
            sendJson(response, 404, { error: { code: 'NARRATIVE_NOT_FOUND', message: 'Narrative not found' } });
            return;
        }
        sendJson(response, 200, narrative);
    });
    router.post('/api/intelligence/entities/resolve', async ({ request, response }) => {
        const body = await readJsonBody(request, { maximumBytes: 128000 });
        const result = services.intelligenceProcessing.resolveEntity(body);
        sendJson(response, result.merged ? 200 : 201, result);
    });
    router.post('/api/intelligence/claims/corroborate', async ({ request, response }) => {
        const body = await readJsonBody(request, { maximumBytes: 512000 });
        const claims = Array.isArray(body.claims) ? body.claims.slice(0, 1000) : [];
        const sources = body.sources && typeof body.sources === 'object' ? body.sources : {};
        sendJson(response, 200, services.intelligenceProcessing.corroborate(claims, sources));
    });
}
