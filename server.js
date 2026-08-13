import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './src/config.js';
import { IntelligenceService } from './src/service/intelligence-service.js';
import { createApiRouter } from './src/api/router.js';
import { json, text } from './src/core/response.js';
import { log } from './src/core/log.js';

const here=path.dirname(fileURLToPath(import.meta.url)),publicDir=path.join(here,'public'),maplibreDir=path.join(here,'node_modules','maplibre-gl','dist');
const service=await new IntelligenceService().init(),api=createApiRouter(service);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
  try{const url=new URL(req.url||'/','http://'+(req.headers.host||`localhost:${config.port}`));if(url.pathname.startsWith('/api/'))return await api(req,res,url);if(url.pathname==='/vendor/maplibre-gl.mjs'||url.pathname==='/vendor/maplibre-gl.css')return await serveMapLibre(req,res,url.pathname);return await serve(req,res,url.pathname);}catch(error){log.error('request-failed',{message:error.message,path:req.url});if(!res.headersSent)json(res,500,{error:'internal_error'});else res.end();}
});

async function serveMapLibre(req,res,pathname){
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'method_not_allowed'});
  const file=pathname.endsWith('.css')?'maplibre-gl.css':'maplibre-gl.mjs';
  const target=path.join(maplibreDir,file);
  try{const body=await fs.readFile(target);const type=file.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8';res.writeHead(200,{'content-type':type,'content-length':body.length,'cache-control':'public,max-age=86400','x-content-type-options':'nosniff'});if(req.method==='HEAD')return res.end();res.end(body);}catch(error){if(error.code==='ENOENT')return text(res,503,'Map renderer dependency is not installed. Run npm install.');throw error;}
}

async function serve(req,res,pathname){
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'method_not_allowed'});let p=decodeURIComponent(pathname);if(p==='/')p='/index.html';const target=path.normalize(path.join(publicDir,p));if(!target.startsWith(publicDir))return json(res,403,{error:'forbidden'});
  try{const stat=await fs.stat(target);if(stat.isDirectory())return serve(req,res,path.join(p,'index.html'));const body=await fs.readFile(target);const ext=path.extname(target);res.writeHead(200,{'content-type':MIME[ext]||'application/octet-stream','content-length':body.length,'cache-control':ext==='.html'?'no-cache':'public,max-age=300','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','content-security-policy':"default-src 'self'; img-src 'self' data: blob: https://tiles.openfreemap.org https://server.arcgisonline.com; style-src 'self'; script-src 'self'; connect-src 'self' https://tiles.openfreemap.org https://server.arcgisonline.com; worker-src 'self' blob:; font-src 'self' data: https://tiles.openfreemap.org"});if(req.method==='HEAD')return res.end();res.end(body);}catch(error){if(error.code==='ENOENT')return text(res,404,'Not found');throw error;}
}
server.listen(config.port,config.host,()=>log.info('merlin-ready',{port:config.port,fixtureMode:config.fixtureMode,sources:service.sources.length}));
function shutdown(signal){log.info('shutdown',{signal});server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),5000).unref();}
process.on('SIGINT',()=>shutdown('SIGINT'));process.on('SIGTERM',()=>shutdown('SIGTERM'));
