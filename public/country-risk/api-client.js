async function request(path,options={
}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),options.timeoutMs||15000);
  try{
    const response=await fetch(path,{
      method:options.method||'GET',headers:{
        'content-type':'application/json'
      },body:options.body===undefined?undefined:JSON.stringify(options.body),signal:controller.signal
    });
    if(!response.ok)throw new Error(`Country risk request failed (${response.status})`);
    return await response.json();
  }
  finally{
    clearTimeout(timer);
  }
}
export function createCountryRiskApi(){
  return Object.freeze({
    catalog:()=>request('/api/country-risk/catalog'),snapshot:value=>request('/api/country-risk/snapshot',{
      method:'POST',body:value||{
      }
    }),country:id=>request(`/api/country-risk/country/${encodeURIComponent(id)}`),compare:value=>request('/api/country-risk/compare',{
      method:'POST',body:value
    }),scenario:value=>request('/api/country-risk/scenario',{
      method:'POST',body:value
    }),watchlist:()=>request('/api/country-risk/watchlist'),addWatch:value=>request('/api/country-risk/watchlist',{
      method:'POST',body:value
    }),removeWatch:id=>request('/api/country-risk/watchlist/remove',{
      method:'POST',body:{
        id
      }
    }),alerts:()=>request('/api/country-risk/alerts',{
      method:'POST',body:{
      }
    })
  });
}
