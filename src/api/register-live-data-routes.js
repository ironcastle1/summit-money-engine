import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
export function registerLiveDataRoutes(router,services){const live=services.liveData;
  router.get('/api/live-data/catalog',async({response})=>sendJson(response,200,live.catalog(),{cacheControl:'public, max-age=3600'}));
  router.get('/api/live-data/status',async({response})=>sendJson(response,200,await live.snapshot()));
  router.get('/api/live-data/diagnostics',async({response})=>sendJson(response,200,await live.diagnostics()));
  router.get('/api/live-data/source',async({response,context})=>{const id=String(context.query.get('id')||'');const data=await live.sourceData(id);if(!data){sendJson(response,404,{error:{code:'LIVE_SOURCE_NOT_FOUND',message:'Live source not found'}});return;}sendJson(response,200,data);});
  router.post('/api/live-data/refresh',async({request,response})=>{const body=await readJsonBody(request);sendJson(response,200,await live.refresh({reason:'api',sourceIds:Array.isArray(body.sourceIds)?body.sourceIds:undefined,timeoutMs:Number(body.timeoutMs)||undefined}));});
  router.get('/api/live-data/export',async({response,context})=>{const output=await live.export(String(context.query.get('format')||'json').toLowerCase());response.statusCode=200;response.setHeader('content-type',output.contentType);response.setHeader('content-disposition',`attachment; filename="merlin-live-data.${output.extension}"`);response.end(output.body);});
}
