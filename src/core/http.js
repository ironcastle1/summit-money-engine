import {config} from '../config.js';
export async function fetchResponse(url,{timeoutMs=config.sourceTimeoutMs,retries=0,headers={},...opts}={}){
  let last;
  for(let attempt=0;attempt<=retries;attempt++){
    const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),timeoutMs);
    const started=Date.now();
    try{
      const res=await fetch(url,{redirect:'follow',signal:ctl.signal,...opts,headers:{'user-agent':config.userAgent,'accept':'*/*',...headers}});
      const body=await res.text();
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      return{ok:true,status:res.status,body,headers:res.headers,durationMs:Date.now()-started,url:res.url};
    }catch(e){last=e;if(attempt<retries)await new Promise(r=>setTimeout(r,180*(attempt+1)));}
    finally{clearTimeout(timer);}
  }
  throw last||new Error('request failed');
}
export async function runPool(tasks,limit=10){const out=new Array(tasks.length);let next=0;async function worker(){while(true){const i=next++;if(i>=tasks.length)return;const started=Date.now();try{out[i]={ok:true,value:await tasks[i](),durationMs:Date.now()-started};}catch(error){out[i]={ok:false,error,durationMs:Date.now()-started};}}}await Promise.all(Array.from({length:Math.min(limit,tasks.length)},worker));return out;}
