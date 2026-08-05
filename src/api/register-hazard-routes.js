import {
  readJsonBody
}
from '../http/body.js';
import {
  sendJson
}
from '../http/response.js';
import {
  boundedString, clampInteger
}
from '../core/validation.js';
function list(value) {
  return String(value||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean).slice(0, 30);
}
function owner(context) {
  return String(context?.user?.id||context?.session?.userId||'anonymous');
}
function bounds(query) {
  const keys=['west', 'south', 'east', 'north'];
  if(keys.every(k=>query.get(k)===null))return null;
  const values=Object.fromEntries(keys.map(k=>[k, Number(query.get(k))]));
  return Object.values(values).every(Number.isFinite)?values:null;
}
export function registerHazardRoutes(router, services) {
  const hazards=services.hazards;
  router.get('/api/hazards/catalog', async( {
    response
  })=>sendJson(response, 200, hazards.catalogue(), {
    cacheControl:'public, max-age=3600'
  }));
  router.get('/api/hazards/snapshot', async( {
    response, context
  })=>sendJson(response, 200, await hazards.snapshot( {
    types:list(context.query.get('types')), bounds:bounds(context.query), maximumAgeHours:clampInteger(context.query.get('maximumAgeHours'), 336, 1, 8760), limit:clampInteger(context.query.get('limit'), 1000, 1, 5000), materialOnly:String(context.query.get('materialOnly')||'true').toLowerCase()!=='false'
  }), {
    cacheControl:'no-store'
  }));
  router.get('/api/hazards/diagnostics', async( {
    response
  })=>sendJson(response, 200, hazards.diagnostics()));
  router.get('/api/hazards/:id', async( {
    response, params
  })=> {
    const event=await hazards.event(boundedString(params.id, 'id', {
      min:2, max:180
    }));
    if(!event) {
      sendJson(response, 404, {
        error: {
          code:'HAZARD_NOT_FOUND', message:'Hazard event not found'
        }
      });
      return;
    }
    sendJson(response, 200, {
      event
    });
  });
  router.post('/api/hazards/scenario', async( {
    request, response
  })=>sendJson(response, 200, await hazards.scenario(await readJsonBody(request, {
    maximumBytes:1_500_000
  }))));
  router.post('/api/hazards/exposure', async( {
    request, response
  })=>sendJson(response, 200, await hazards.exposure(await readJsonBody(request, {
    maximumBytes:2_000_000
  }))));
  router.post('/api/hazards/portfolio', async( {
    request, response
  })=>sendJson(response, 200, await hazards.portfolio(await readJsonBody(request, {
    maximumBytes:3_000_000
  }))));
  router.get('/api/hazards/watchlist', async( {
    response, context
  })=>sendJson(response, 200, {
    watches:await hazards.watchlist.list(owner(context)), generatedAt:new Date().toISOString()
  }));
  router.post('/api/hazards/watchlist', async( {
    request, response, context
  })=>sendJson(response, 201, await hazards.watchlist.add(owner(context), await readJsonBody(request, {
    maximumBytes:250_000
  }))));
  router.post('/api/hazards/watchlist/remove', async( {
    request, response, context
  })=> {
    const body=await readJsonBody(request, {
      maximumBytes:50_000
    });
    sendJson(response, 200, {
      removed:await hazards.watchlist.remove(owner(context), boundedString(body.id, 'id', {
        min:2, max:180
      }))
    });
  });
  router.post('/api/hazards/watchlist/evaluate', async( {
    request, response, context
  })=> {
    const body=await readJsonBody(request, {
      maximumBytes:1_500_000
    });
    const events=body.events|| (await hazards.snapshot(body)).events;
    sendJson(response, 200, {
      alerts:await hazards.watchlist.evaluate(owner(context), events), generatedAt:new Date().toISOString()
    });
  });
  router.post('/api/hazards/export', async( {
    request, response
  })=> {
    const body=await readJsonBody(request, {
      maximumBytes:1_500_000
    });
    const snapshot=await hazards.snapshot(body);
    const format=String(body.format||'geojson').toLowerCase();
    if(format==='csv') {
      response.statusCode=200;
      response.setHeader('content-type', 'text/csv; charset=utf-8');
      response.end(hazards.exporter.toCsv(snapshot.events));
      return;
    }
    sendJson(response, 200, format==='summary'?hazards.exporter.summary(snapshot.events):hazards.exporter.toGeoJson(snapshot.events, {
      includeFootprints:body.includeFootprints===true
    }));
  });
}
