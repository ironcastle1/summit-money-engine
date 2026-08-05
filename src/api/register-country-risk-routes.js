import {
  readJsonBody
}
from '../http/body.js';
import {
  sendJson
}
from '../http/response.js';
import {
  boundedString
}
from '../core/validation.js';
function owner(context){
  return String(context?.user?.id||context?.session?.userId||'anonymous');
}
function list(value){
  return String(value||'').split(',').map(item=>item.trim()).filter(Boolean).slice(0,30);
}
export function registerCountryRiskRoutes(router,services){
  const risk=services.countryRisk;
  router.get('/api/country-risk/catalog',async({
    response
  })=>sendJson(response,200,risk.catalog(),{
    cacheControl:'public, max-age=900'
  }));
  router.get('/api/country-risk/diagnostics',async({
    response
  })=>sendJson(response,200,risk.diagnostics()));
  router.get('/api/country-risk/snapshot',async({
    response,context
  })=>sendJson(response,200,await risk.snapshot({
    query:context.query.get('query'),region:context.query.get('region'),minimumRisk:context.query.get('minimumRisk'),limit:context.query.get('limit'),includeNews:context.query.get('includeNews')!=='false'
  }),{
    cacheControl:'no-store'
  }));
  router.post('/api/country-risk/snapshot',async({
    request,response
  })=>sendJson(response,200,await risk.snapshot(await readJsonBody(request,{
    maximumBytes:4000000
  }))));
  router.get('/api/country-risk/country/:id',async({
    response,params,context
  })=>sendJson(response,200,await risk.country(params.id,{
    hours:context.query.get('hours')
  })));
  router.post('/api/country-risk/compare',async({
    request,response
  })=>sendJson(response,200,await risk.compare(await readJsonBody(request,{
    maximumBytes:2000000
  }))));
  router.post('/api/country-risk/scenario',async({
    request,response
  })=>sendJson(response,200,await risk.scenario(await readJsonBody(request,{
    maximumBytes:2000000
  }))));
  router.get('/api/country-risk/watchlist',async({
    response,context
  })=>sendJson(response,200,{
    watches:await risk.watchlist.list(owner(context)),generatedAt:new Date().toISOString()
  }));
  router.post('/api/country-risk/watchlist',async({
    request,response,context
  })=>sendJson(response,201,await risk.watchlist.add(owner(context),await readJsonBody(request,{
    maximumBytes:100000
  }))));
  router.post('/api/country-risk/watchlist/remove',async({
    request,response,context
  })=>{
    const body=await readJsonBody(request,{
      maximumBytes:50000
    });
    sendJson(response,200,{
      removed:await risk.watchlist.remove(owner(context),boundedString(body.id,'id',{
        min:1,max:160
      }))
    });
  });
  router.post('/api/country-risk/alerts',async({
    request,response,context
  })=>sendJson(response,200,{
    alerts:await risk.alerts(owner(context),await readJsonBody(request,{
      maximumBytes:2000000
    })),generatedAt:new Date().toISOString()
  }));
  router.post('/api/country-risk/export',async({
    request,response
  })=>{
    const body=await readJsonBody(request,{
      maximumBytes:4000000
    });
    const snapshot=body.snapshot||await risk.snapshot(body);
    const format=String(body.format||'csv').toLowerCase();
    if(format==='csv'){
      response.statusCode=200;
      response.setHeader('content-type','text/csv; charset=utf-8');
      response.end(risk.exporter.toCsv(snapshot.profiles||[]));
      return;
    }
    if(format==='json'){
      response.statusCode=200;
      response.setHeader('content-type','application/json; charset=utf-8');
      response.end(risk.exporter.toJson(snapshot));
      return;
    }
    sendJson(response,200,risk.exporter.summary(snapshot));
  });
}
