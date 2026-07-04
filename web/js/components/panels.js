window.Panels = (() => {
  const ids = { markets:'marketsPanel', signals:'signalsPanel', rapid:'rapidPanel', charts:'chartsPanel', context:'contextPanel' };
  function toggle(name){ const el=document.getElementById(ids[name]); if(el) el.classList.toggle('open'); setTimeout(()=>window.MoneyMap?.resize(),60); }
  function open(name){ const el=document.getElementById(ids[name]); if(el) el.classList.add('open'); setTimeout(()=>window.MoneyMap?.resize(),60); }
  function close(name){ const el=document.getElementById(ids[name]); if(el) el.classList.remove('open'); setTimeout(()=>window.MoneyMap?.resize(),60); }
  function init(){
    document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>toggle(b.dataset.panel)));
    document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>close(b.dataset.close)));
  }
  return { init, toggle, open, close };
})();
