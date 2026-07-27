window.Charts = (() => {
  const charts = new Map();
  function money(v){ const n=Number(v); if(!Number.isFinite(n)) return '—'; return n.toLocaleString(undefined,{maximumFractionDigits:n<10?4:2}); }
  function line(id, data, label, yLabel='Price', projection=null){
    const canvas=document.getElementById(id); if(!canvas || !window.Chart) return;
    if(charts.has(id)) charts.get(id).destroy();
    const points=(data||[]).filter(x=>Number.isFinite(Number(x.v)));
    if(!points.length){
      const box=canvas.parentElement;
      if(box) box.insertAdjacentHTML('beforeend','<p class="chart-note">No source candle data returned for this symbol.</p>');
      return;
    }
    const labels=points.map(x=>x.t?new Date(x.t).toLocaleString([], {hour:'2-digit', minute:'2-digit'}):'');
    const vals=points.map(x=>Number(x.v));
    const datasets=[{label,borderColor:'#00d8ff',backgroundColor:'rgba(0,216,255,.10)',pointRadius:0,tension:.18,fill:true,data:vals}];
    if(projection && projection.length){
      datasets.push({label:'projection path',borderColor:'#ffd94a',backgroundColor:'transparent',borderDash:[7,7],pointRadius:0,tension:.2,data:Array(Math.max(0, vals.length-projection.length)).fill(null).concat(projection.map(x=>Number(x.v)))});
    }
    charts.set(id,new Chart(canvas,{type:'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:'#dff8ff'}},tooltip:{callbacks:{label:(ctx)=>`${ctx.dataset.label}: ${money(ctx.parsed.y)}`}}},scales:{x:{title:{display:true,text:'Time',color:'#9cc5d8'},ticks:{color:'#9cc5d8',maxTicksLimit:7},grid:{color:'rgba(100,190,255,.08)'}},y:{title:{display:true,text:yLabel,color:'#9cc5d8'},ticks:{color:'#9cc5d8'},grid:{color:'rgba(100,190,255,.12)'}}}}}));
  }
  function grid(containerId, entries){
    const el=document.getElementById(containerId); if(!el) return;
    el.innerHTML='<div class="chart-grid">'+entries.map((e,i)=>`<div class="chart-box"><b>${e.title}</b><canvas id="${containerId}Chart${i}"></canvas><p class="chart-note">x-axis: time · y-axis: ${e.y||'price'}</p></div>`).join('')+'</div>';
    setTimeout(()=>entries.forEach((e,i)=>line(`${containerId}Chart${i}`, e.data, e.title, e.y||'Price', e.projection)),80);
  }
  return { line, grid };
})();
