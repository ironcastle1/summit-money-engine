import { config } from '../config.js';

const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));

export async function fetchText(url, options={}){
  const response=await fetchWithRetry(url,options);
  return { text:await response.text(), response };
}
export async function fetchJson(url, options={}){
  const response=await fetchWithRetry(url,options);
  return { json:await response.json(), response };
}
export async function fetchWithRetry(url,{timeoutMs=config.sourceTimeoutMs,retries=1,headers={},method='GET',body}={}){
  let last;
  for(let attempt=0;attempt<=retries;attempt++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(new Error('source_timeout')),timeoutMs);
    try{
      const response=await fetch(url,{method,body,headers:{'user-agent':config.sourceUserAgent,'accept':'*/*',...headers},signal:controller.signal,redirect:'follow'});
      if(!response.ok) throw new Error(`http_${response.status}`);
      return response;
    }catch(error){
      last=error;
      if(attempt<retries) await sleep(250*(attempt+1));
    }finally{ clearTimeout(timer); }
  }
  throw last;
}
export async function runPool(tasks, concurrency=config.concurrency){
  const out=new Array(tasks.length); let cursor=0;
  async function worker(){
    while(true){
      const i=cursor++; if(i>=tasks.length)return;
      const started=Date.now();
      try{ out[i]={ok:true,value:await tasks[i](),durationMs:Date.now()-started}; }
      catch(error){ out[i]={ok:false,error,durationMs:Date.now()-started}; }
    }
  }
  await Promise.all(Array.from({length:Math.min(concurrency,tasks.length)},worker));
  return out;
}
