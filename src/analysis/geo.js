import {REGIONS} from '../catalog/regions.js';import {STRATEGIC_NODES} from '../catalog/strategic-nodes.js';
const aliases=[
 ['middle-east',29,45,['iran','iraq','israel','gaza','lebanon','syria','saudi','qatar','uae','emirates','yemen','oman','hormuz','red sea','suez','gulf','tehran','dubai','riyadh']],
 ['europe',50,14,['ukraine','europe','eu ','european','nato','britain','united kingdom','germany','france','italy','poland','black sea','danube','brussels']],
 ['russia-eurasia',58,56,['russia','russian','moscow','kremlin','belarus','kazakhstan','caucasus','orsk','orenburg']],
 ['north-america',39,-99,['united states','u.s.','america','washington','federal reserve','canada','mexico','wall street','new york']],
 ['strategic-asia',31,116,['china','chinese','taiwan','japan','korea','india','philippines','vietnam','malacca','tokyo','beijing','taipei','yen','boJ'.toLowerCase()]]
];
export function locateRecord(r,{countries=[],cities=[],ports=[]}={}){if(Number.isFinite(Number(r.lat))&&Number.isFinite(Number(r.lon)))return{lat:Number(r.lat),lon:Number(r.lon),regionId:r.regionHint||regionFromCoords(Number(r.lat),Number(r.lon)),countryIso2:null,locationLabel:null};const t=`${r.title||''} ${r.summary||''}`.toLowerCase();
 for(const n of STRATEGIC_NODES){if((n.keywords||[]).some(k=>t.includes(String(k).toLowerCase()))||t.includes(n.name.toLowerCase()))return{lat:n.lat,lon:n.lon,regionId:n.regionId,countryIso2:null,locationLabel:n.name};}
 for(const p of ports){if(t.includes(p.name.toLowerCase()))return{lat:p.coordinates.lat,lon:p.coordinates.lon,regionId:regionForCountry(p.countryCode),countryIso2:p.countryCode,locationLabel:p.name};}
 for(const c of cities){if(t.includes(c.name.toLowerCase())&&c.name.length>4)return{lat:c.lat,lon:c.lon,regionId:regionForCountry(c.countryCode),countryIso2:c.countryCode,locationLabel:c.name};}
 for(const c of countries){const names=[c.name,c.nativeName,...(c.aliases||[])].filter(Boolean).map(x=>String(x).toLowerCase());if(names.some(n=>n.length>3&&t.includes(n)))return{lat:c.lat,lon:c.lon,regionId:regionForCountry(c.iso2),countryIso2:c.iso2,locationLabel:c.name};}
 for(const [id,lat,lon,terms] of aliases)if(terms.some(x=>t.includes(x)))return{lat,lon,regionId:id,countryIso2:null,locationLabel:null};return{lat:20,lon:10,regionId:r.sourceRegion&&r.sourceRegion!=='world'?r.sourceRegion:'world',countryIso2:null,locationLabel:null};}
export function regionForCountry(iso2){return REGIONS.find(r=>r.id!=='world'&&(r.countries||[]).includes(iso2))?.id||'world';}
function regionFromCoords(lat,lon){if(lat>10&&lat<45&&lon>25&&lon<65)return'middle-east';if(lat>34&&lat<72&&lon>-15&&lon<45)return'europe';if(lat>40&&lat<75&&lon>=45&&lon<180)return'russia-eurasia';if(lat>10&&lat<75&&lon<-50)return'north-america';if(lat>-10&&lat<55&&lon>65&&lon<155)return'strategic-asia';return'world';}
