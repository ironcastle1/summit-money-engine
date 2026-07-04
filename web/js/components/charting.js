window.Charts = (() => {
  const charts = new Map();
  function line(id, data, label, yLabel='Price'){
    const canvas=document.getElementById(id); if(!canvas || !window.Chart) return;
    if(charts.has(id)) charts.get(id).destroy();
    const points=(data||[]).filter(x=>Number.isFinite(Number(x.v)));
    const labels=points.map(x=>x.t?new Date(x.t).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}):'');
    const vals=points.map(x=>Number(x.v));
    charts.set(id,new Chart(canvas,{type:'line',data:{labels,datasets:[{label,borderColor:'#00d8ff',backgroundColor:'rgba(0,216,255,.12)',pointRadius:0,tension:.22,fill:true,data:vals}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:'#dff8ff'}},tooltip:{enabled:true}},scales:{x:{title:{display:true,text:'Time',color:'#9cc5d8'},ticks:{color:'#9cc5d8',maxTicksLimit:6},grid:{color:'rgba(255,255,255,.05)'}},y:{title:{display:true,text:yLabel,color:'#9cc5d8'},ticks:{color:'#9cc5d8'},grid:{color:'rgba(255,255,255,.08)'}}}}}));
  }
  function renderCharts(klines){
    const el=document.getElementById('charts');
    const keys=Object.keys(klines||{}).slice(0,10);
    el.innerHTML='<div class="chart-grid">'+keys.map((k,i)=>`<div class="chart-box"><b>${k}</b><canvas id="chart${i}"></canvas></div>`).join('')+'</div>' || '<div class="warn">No chart data yet.</div>';
    setTimeout(()=>keys.forEach((k,i)=>line(`chart${i}`,klines[k],k,'Price')),80);
  }
  return { line, renderCharts };
})();
