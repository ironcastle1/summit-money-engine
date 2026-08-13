import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { log } from '../core/log.js';
const file=()=>path.join(config.dataDir,'strategic-snapshot.json');
export async function loadSnapshot(){
  try{return JSON.parse(await fs.readFile(file(),'utf8'));}catch(error){if(error.code!=='ENOENT')log.warn('snapshot-load-failed',{message:error.message});return null;}
}
export async function saveSnapshot(snapshot){
  await fs.mkdir(config.dataDir,{recursive:true}); const target=file(),tmp=`${target}.tmp`; await fs.writeFile(tmp,JSON.stringify(snapshot),'utf8'); await fs.rename(tmp,target);
}
