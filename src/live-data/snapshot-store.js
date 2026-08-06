import path from 'node:path';
import { JsonDocumentStore } from '../infra/persistence/json-document-store.js';
export class LiveSnapshotStore{
  constructor(options={}){this.filePath=path.resolve(options.filePath||'runtime-data/live-data.json');this.store=options.store||new JsonDocumentStore({filePath:this.filePath,defaultValue:{schemaVersion:1,updatedAt:null,sources:{},runs:[]}});}
  async load(){return this.store.load();}
  async read(){return this.store.read();}
  async source(id){const data=await this.read();return data.sources?.[id]||null;}
  async saveSource(id,result){return this.store.update(document=>{document.schemaVersion=1;document.updatedAt=new Date().toISOString();document.sources||={};document.sources[id]=structuredClone(result);return document.sources[id];});}
  async saveRun(run){return this.store.update(document=>{document.runs||=[];document.runs.unshift(structuredClone(run));document.runs=document.runs.slice(0,100);document.updatedAt=new Date().toISOString();return run;});}
  async close(){await this.store.close();}
}
