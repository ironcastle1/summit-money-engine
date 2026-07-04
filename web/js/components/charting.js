window.Charts = (() => {
  const charts = new Map();
  function line(id, data, label){
    const canvas=document.getElementById(id); if(!canvas || !window.Chart) return;
    if(charts.has(id)) charts.get(id).destroy();
    const labels=(data||[]).map((_,i)=>i+1); const vals=(data||[]).map(x=>x.v);
    charts.set(id,new Chart(canvas,{type:'line',data:{labels,datasets:[{label,data:vals,borderColor:'#00d8ff',backgroundColor:'rgba(0,216,255,.12)',pointRadius:0,tension:.25,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#dff8ff'}}},scales:{x:{ticks:{display:false},grid:{color:'rgba(255,255,255,.05)'}},y:{ticks:{color:'#9cc5d8'},grid:{color:'rgba(255,255,255,.08)'}}}}}));
  }
  function renderCharts(klines){
    const el=document.getElementById('charts');
    const keys=Object.keys(klines||{}).slice(0,8);
    el.innerHTML='<div class="chart-grid">'+keys.map((k,i)=>`<div class="chart-box"><b>${k}</b><canvas id="chart${i}"></canvas></div>`).join('')+'</div>';
    setTimeout(()=>keys.forEach((k,i)=>line(`chart${i}`,klines[k],k)),80);
  }
  return { line, renderCharts };
})();
