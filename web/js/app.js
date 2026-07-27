(async function(){
const $=id=>document.getElementById(id);
MoneyMap.init();
MoneyMap.legend();
$('panelClose').onclick=()=>$('panel').style.display='none';

async function load(){
  const [s,m]=await Promise.all([API.state(),API.mapData()]);
  window.APP_STATE=s;
  window.MAP_DATA=m;
  MoneyMap.setData(m,s);
  Renderers.liveBrief(s.liveBrief);
}

try{await load();}catch(e){Renderers.panel('Load failed',`<div class="card"><h3>Backend failed</h3><p>${e.message}</p></div>`)}

document.querySelectorAll('#tabs button[data-tab]').forEach(btn=>btn.onclick=async()=>{
  const tab=btn.dataset.tab;
  const s=window.APP_STATE||await API.state();
  if(tab==='live')Renderers.liveBrief(s.liveBrief);
  else if(tab==='area')Renderers.areaScanForm();
  else if(tab==='money')Renderers.markets(await API.markets());
  else if(tab==='sources')Renderers.sources(await API.sources());
  else if(tab==='crisis')Renderers.crisis(s);
  else if(tab==='travel')Renderers.travel(s);
  else if(tab==='city')Renderers.cityRisk();
  else if(tab==='risk')Renderers.countryRisk(s);
});

async function runAreaScanFromText(q){
  const query=String(q||'').trim();
  if(!query)return;
  Renderers.panel('Area Scan',`<div class="card"><h3>Scanning ${query}</h3><div class="loader"><span></span></div><p class="plain">Geocoding, drawing 5 mile circle, checking emergency infrastructure, crime where available, live events and weather.</p></div>`);
  try{
    const result=await API.areaScan({query,radiusMiles:5});
    if(result.ok&&result.target&&window.MoneyMap&&MoneyMap.drawAreaScan)MoneyMap.drawAreaScan(result);
    Renderers.areaScanResult(result);
  }catch(e){
    Renderers.panel('Area Scan failed',`<div class="card"><h3>Scan failed</h3><p class="plain">${e.message}</p></div>`);
  }
}

$('searchBtn').onclick=async()=>{
  const q=$('searchBox').value.trim();
  await runAreaScanFromText(q);
};

document.addEventListener('click',async e=>{
  if(e.target&&e.target.id==='areaScanRun'){
    const q=($('areaScanQuery')||{}).value||'';
    const radius=Number(($('areaScanRadius')||{}).value||5);
    Renderers.panel('Area Scan',`<div class="card"><h3>Scanning ${q}</h3><div class="loader"><span></span></div><p class="plain">Building radius intelligence. This can take a few seconds.</p></div>`);
    try{
      const result=await API.areaScan({query:q,radiusMiles:radius});
      if(result.ok&&result.target&&window.MoneyMap&&MoneyMap.drawAreaScan)MoneyMap.drawAreaScan(result);
      Renderers.areaScanResult(result);
    }catch(err){
      Renderers.panel('Area Scan failed',`<div class="card"><h3>Scan failed</h3><p class="plain">${err.message}</p></div>`);
    }
  }
});

const ev=new EventSource('/api/stream');
ev.onmessage=msg=>{try{const p=JSON.parse(msg.data);if(p.state){window.APP_STATE=p.state;API.mapData().then(m=>{window.MAP_DATA=m;MoneyMap.setData(m,p.state);});}}catch{}};
})();
