import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
const port=Number(process.env.MERLIN_SMOKE_PORT||3298);
const child=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),MERLIN_DISABLE_LIVE:'1',MERLIN_RUNTIME_DIR:'/tmp/merlin-v8-smoke-runtime'},stdio:['ignore','pipe','pipe']});
let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(path){const r=await fetch(`http://127.0.0.1:${port}${path}`);if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);const type=r.headers.get('content-type')||'';return type.includes('json')?r.json():r.arrayBuffer();}
try{
 let health;for(let i=0;i<60;i++){try{health=await get('/api/health');break;}catch{}await sleep(100);}if(!health)throw new Error(`server did not become ready: ${log}`);
 const snapshot=await get('/api/snapshot'),ref=await get('/api/reference'),sources=await get('/api/sources'),country=await get('/api/country/GB');
 const map=await get('/assets/world-tech-mercator.jpg'),lines=await get('/data/tech-base-lines.json'),polys=await get('/data/country-polygons.geojson'),html=await get('/');
 const report={ok:true,health,snapshot:{mode:snapshot.dataMode,signals:snapshot.signals.length,markets:snapshot.markets.length,opportunities:snapshot.opportunities.length,conflicts:snapshot.conflicts.length},reference:{countries:ref.countries.length,cities:ref.cities.length,ports:ref.ports.length,routes:ref.routes.features?.length??ref.routes.length,strategicNodes:ref.strategicNodes.length},sources:{total:sources.sources.length,responded:sources.coverage.responded},country:{name:country.country.name,signals:country.signals.length,risk:country.risk.score},assets:{mapBytes:map.byteLength,lineFeatures:lines.features.length,polygonFeatures:polys.features.length,htmlBytes:html.byteLength}};
 if(report.snapshot.signals<10||report.snapshot.markets<6||report.reference.countries<200||report.sources.total<40||report.assets.mapBytes<500000)throw new Error(`smoke assertions failed: ${JSON.stringify(report)}`);
 await fs.writeFile(process.env.MERLIN_SMOKE_REPORT||'MERLIN_V8_HTTP_SMOKE.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{child.kill('SIGTERM');setTimeout(()=>child.kill('SIGKILL'),1500).unref();}
