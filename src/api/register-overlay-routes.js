import { readJsonBody } from '../http/body.js';
import { sendJson } from '../http/response.js';
import { boundedString, clampInteger } from '../core/validation.js';
function bounds(query){ const values=['west','south','east','north'].map(key=>query.get(key)); if(values.every(value=>value===null)) return null; const [west,south,east,north]=values.map(Number); if(![west,south,east,north].every(Number.isFinite)) return null; return {west,south,east,north}; }
function list(value){ return String(value||'').split(',').map(item=>item.trim()).filter(Boolean).slice(0,80); }
export function registerOverlayRoutes(router,services){
  const overlays=services.overlays;
  router.get('/api/overlays/catalog',async({response,context})=>sendJson(response,200,{...overlays.platform.catalogSnapshot(),search:String(context.query.get('q')||''),generatedAt:new Date().toISOString()},{cacheControl:'public, max-age=300'}));
  router.get('/api/overlays/presets',async({response})=>sendJson(response,200,{presets:overlays.presets.list(),generatedAt:new Date().toISOString()},{cacheControl:'public, max-age=300'}));
  router.get('/api/overlays/availability',async({response})=>sendJson(response,200,overlays.availability()));
  router.get('/api/overlays/diagnostics',async({response})=>sendJson(response,200,overlays.platform.diagnostics()));
  router.get('/api/overlays/:id/features',async({response,context,params})=>{ const id=boundedString(params.id,'id',{min:2,max:64}); const result=await overlays.platform.layer(id,{bounds:bounds(context.query),limit:clampInteger(context.query.get('limit'),2500,1,10000),filters:{minimumConfidence:Number(context.query.get('minimumConfidence')||0),minimumSeverity:Number(context.query.get('minimumSeverity')||0),maximumAgeHours:Number(context.query.get('maximumAgeHours')||168)}}); sendJson(response,200,result,{cacheControl:result.layer?.sourceMode==='live'?'no-store':'public, max-age=300'}); });
  router.post('/api/overlays/query',async({request,response})=>{ const body=await readJsonBody(request,{maximumBytes:500000}); const result=await overlays.platform.query({layerIds:list(body.layerIds||body.layers),bounds:body.bounds||null,filters:body.filters||{},limit:clampInteger(body.limit,2500,1,10000)}); sendJson(response,200,result); });
  router.get('/api/overlays/state',async({response})=>sendJson(response,200,await overlays.state.load('anonymous')));
  router.post('/api/overlays/state',async({request,response})=>{ const body=await readJsonBody(request,{maximumBytes:500000}); sendJson(response,200,await overlays.state.save('anonymous',body)); });
  router.post('/api/overlays/presets/:id/apply',async({response,params})=>sendJson(response,200,overlays.presets.apply(boundedString(params.id,'id',{min:2,max:64}),overlays.state)));
  router.post('/api/overlays/export',async({request,response})=>{ const body=await readJsonBody(request,{maximumBytes:500000}); const result=await overlays.platform.query(body); sendJson(response,200,overlays.exporter.toGeoJson(result.results,{requestedLayers:body.layerIds||[]})); });
}
