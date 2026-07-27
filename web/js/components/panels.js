window.Panels = (() => {
  const info = () => document.getElementById("infoPanel");
  const drawer = () => document.getElementById("drawerPanel");
  function afterResize(){ setTimeout(()=>{ if(window.MoneyMap && typeof window.MoneyMap.resize === "function") window.MoneyMap.resize(); },80); }
  function closeAll(){ const i=info(), d=drawer(); if(i) i.classList.remove("open","active"); if(d) d.classList.remove("open","active"); document.querySelectorAll(".menu button[data-panel]").forEach(b=>b.classList.remove("active")); afterResize(); }
  function setInfo(title, html, panelName){ closeAll(); const t=document.getElementById("infoTitle"), b=document.getElementById("infoBody"), p=info(); if(t) t.textContent=title||"Info"; if(b) b.innerHTML=html||""; if(p) p.classList.add("open","active"); if(panelName) document.querySelector(`[data-panel="${panelName}"]`)?.classList.add("active"); afterResize(); }
  function setDrawer(title, html, panelName){ closeAll(); const t=document.getElementById("drawerTitle"), b=document.getElementById("drawerBody"), p=drawer(); if(t) t.textContent=title||"Detail"; if(b) b.innerHTML=html||""; if(p) p.classList.add("open","active"); if(panelName) document.querySelector(`[data-panel="${panelName}"]`)?.classList.add("active"); afterResize(); }
  function togglePanel(name){ const button=document.querySelector(`[data-panel="${name}"]`); if(button?.classList.contains("active")){ closeAll(); return; } if(window.Renderers && typeof window.Renderers.openPanel === "function") window.Renderers.openPanel(name); }
  function init(){ document.querySelectorAll("[data-panel]").forEach(b=>b.addEventListener("click",()=>togglePanel(b.dataset.panel))); document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",closeAll)); document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeAll(); }); }
  return { init, closeAll, setInfo, setDrawer, togglePanel };
})();
