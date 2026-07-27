(async function(){
const $=id=>document.getElementById(id);
MoneyMap.init(); MoneyMap.legend();
$('panelClose').onclick=()=>$('panel').style.display='none';
async function load(){const [s,m]=await Promise.all([API.state(),API.mapData()]);window.APP_STATE=s;window.MAP_DATA=m;MoneyMap.setData(m,s);Renderers.liveBrief(s.liveBrief);} 
try{await load();}catch(e){Renderers.panel('Load failed',`<div class="card"><h3>Backend failed</h3><p>${e.message}</p></div>`)}

document.querySelectorAll('#tabs button[data-tab]').forEach(btn=>btn.onclick=async()=>{
  const tab=btn.dataset.tab;const s=window.APP_STATE||await API.state();
  if(tab==='live')Renderers.liveBrief(s.liveBrief);
  else if(tab==='money')Renderers.markets(await API.markets());
  else if(tab==='sources')Renderers.sources(await API.sources());
  else if(tab==='crisis')Renderers.crisis(s);
  else if(tab==='travel')Renderers.travel(s);
  else if(tab==='city')Renderers.cityRisk();
  else if(tab==='risk')Renderers.countryRisk(s);
});
$('searchBtn').onclick=async()=>{const q=$('searchBox').value.trim();if(!q)return;Renderers.panel('Search',`<div class="card"><h3>Searching</h3><div class="loader"><span></span></div></div>`);const data=await API.search(q);if(data.places&&data.places[0]){const p=data.places[0];window.map.setView([p.lat,p.lng],10);MoneyMap.openPlace(p.lat,p.lng);}else Renderers.panel('Search',`<div class="card"><h3>No place found</h3></div>`)};
const ev=new EventSource('/api/stream');ev.onmessage=msg=>{try{const p=JSON.parse(msg.data);if(p.state){window.APP_STATE=p.state;API.mapData().then(m=>{window.MAP_DATA=m;MoneyMap.setData(m,p.state);});}}catch{}};
})();
