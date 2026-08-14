import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {SOURCES} from '../src/source-catalog.js';
import {PUBLIC_SIGNAL_INDICATORS} from '../src/catalog/public-signal-indicators.js';
import {TRANSMISSION_RULES} from '../src/catalog/market-transmission.js';

const root=process.cwd();
const skip=new Set(['browser-output','screenshots','runtime','.git','node_modules']);
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(p));else out.push(p);}return out;}
const files=walk(root),js=files.filter(x=>x.endsWith('.js')||x.endsWith('.mjs'));
const syntaxFailures=[];for(const f of js){const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status)syntaxFailures.push({file:path.relative(root,f),error:(r.stderr||r.stdout).trim()});}
const seed=JSON.parse(fs.readFileSync(path.join(root,'seed/build-snapshot.json'),'utf8'));
const countries=JSON.parse(fs.readFileSync(path.join(root,'public/data/countries.json'),'utf8')).countries;
const cities=JSON.parse(fs.readFileSync(path.join(root,'public/data/cities.json'),'utf8')).cities;
const ports=JSON.parse(fs.readFileSync(path.join(root,'public/data/ports.json'),'utf8')).ports;
const routes=JSON.parse(fs.readFileSync(path.join(root,'public/data/routes.json'),'utf8'));
const lines=JSON.parse(fs.readFileSync(path.join(root,'public/data/tech-base-lines.json'),'utf8'));
const polygons=JSON.parse(fs.readFileSync(path.join(root,'public/data/country-polygons.geojson'),'utf8'));
const secretPatterns=[/\bsk-[A-Za-z0-9_-]{20,}/g,/\bghp_[A-Za-z0-9]{20,}/g,/AKIA[0-9A-Z]{16}/g,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g];
const secrets=[];for(const f of files.filter(x=>/\.(?:js|mjs|json|html|css|md|ya?ml|txt|py)$/.test(x))){const txt=fs.readFileSync(f,'utf8');for(const re of secretPatterns){for(const m of txt.matchAll(re))secrets.push({file:path.relative(root,f),match:m[0].slice(0,16)+'…'});}}
const sourceIds=new Set(SOURCES.map(s=>s.id));
const report={ok:false,version:'8.0.0',files:files.length,javascriptFiles:js.length,syntaxFailures,secretsFound:secrets,sourceCatalog:{total:SOURCES.length,uniqueIds:sourceIds.size,gdelt:SOURCES.filter(s=>s.kind==='gdelt').length,rss:SOURCES.filter(s=>s.kind==='rss').length,json:SOURCES.filter(s=>s.kind==='json').length,market:SOURCES.filter(s=>s.kind==='market').length},analysis:{publicIndicators:PUBLIC_SIGNAL_INDICATORS.length,transmissionRules:TRANSMISSION_RULES.length},seed:{capturedAt:seed.capturedAt,records:seed.records.length,markets:seed.markets.length,allHttps:seed.records.every(r=>/^https:\/\//.test(r.url))},reference:{countries:countries.length,cities:cities.length,ports:ports.length,routes:routes.features?.length??routes.length,borderLineFeatures:lines.features.length,countryPolygons:polygons.features.length},assets:{mapMercatorBytes:fs.statSync(path.join(root,'public/assets/world-tech-mercator.jpg')).size}};
report.ok=!syntaxFailures.length&&!secrets.length&&SOURCES.length===44&&sourceIds.size===SOURCES.length&&seed.records.length>=14&&seed.markets.length>=7&&report.seed.allHttps&&countries.length===232&&cities.length===259&&ports.length===75&&report.reference.routes>=15&&report.reference.borderLineFeatures>=900&&report.reference.countryPolygons>=170&&report.assets.mapMercatorBytes>500000;
fs.writeFileSync(path.join(root,'MERLIN_V8_STATIC_VERIFY.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.ok)process.exit(1);
