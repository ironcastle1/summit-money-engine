import fs from 'node:fs/promises';import path from 'node:path';import {config} from '../config.js';
const file=()=>path.join(config.runtimeDir,'last-known-good.json');
export async function loadStored(){try{return JSON.parse(await fs.readFile(file(),'utf8'));}catch{return null;}}
export async function saveStored(v){await fs.mkdir(config.runtimeDir,{recursive:true});const p=file(),tmp=p+'.tmp';await fs.writeFile(tmp,JSON.stringify(v));await fs.rename(tmp,p);}
