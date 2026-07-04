window.Panels = (() => {
  const info = () => document.getElementById('infoPanel');
  const drawer = () => document.getElementById('drawerPanel');
  function closeAll(){ info().classList.remove('open'); drawer().classList.remove('open'); document.querySelectorAll('.menu button[data-panel]').forEach(b=>b.classList.remove('active')); setTimeout(()=>MoneyMap?.resize?.(),80); }
  function setInfo(title, html, panelName){ closeAll(); document.getElementById('infoTitle').textContent = title; document.getElementById('infoBody').innerHTML = html; info().classList.add('open'); if(panelName) document.querySelector(`[data-panel="${panelName}"]`)?.classList.add('active'); setTimeout(()=>MoneyMap?.resize?.(),80); }
  function setDrawer(title, html, panelName){ closeAll(); document.getElementById('drawerTitle').textContent = title; document.getElementById('drawerBody').innerHTML = html; drawer().classList.add('open'); if(panelName) document.querySelector(`[data-panel="${panelName}"]`)?.classList.add('active'); setTimeout(()=>MoneyMap?.resize?.(),80); }
  function togglePanel(name){
    const button = document.querySelector(`[data-panel="${name}"]`);
    const already = button?.classList.contains('active');
    if(already){ closeAll(); return; }
    Renderers.openPanel(name);
  }
  function init(){
    document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>togglePanel(b.dataset.panel)));
    document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click', closeAll));
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeAll(); });
  }
  return { init, closeAll, setInfo, setDrawer, togglePanel };
})();
