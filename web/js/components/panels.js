function toggleClass(root, openClass, closedClass){
  const open = root.classList.contains(openClass);
  root.classList.toggle(openClass, !open);
  root.classList.toggle(closedClass, open);
  setTimeout(()=>window.dispatchEvent(new Event('resize')), 120);
}
export function setupPanels(){
  const root = document.getElementById('app');
  const markets = document.getElementById('marketsMenu');
  const signals = document.getElementById('signalsMenu');
  const lClose = document.getElementById('leftClose');
  const rClose = document.getElementById('rightClose');
  const charts = document.getElementById('chartsToggle');
  const rapid = document.getElementById('rapidMenu');

  markets?.addEventListener('click', () => { toggleClass(root, 'left-open', 'left-closed'); markets.classList.toggle('active', root.classList.contains('left-open')); });
  signals?.addEventListener('click', () => { toggleClass(root, 'right-open', 'right-closed'); signals.classList.toggle('active', root.classList.contains('right-open')); });
  lClose?.addEventListener('click', () => { root.classList.remove('left-open'); root.classList.add('left-closed'); markets?.classList.remove('active'); setTimeout(()=>window.dispatchEvent(new Event('resize')), 120); });
  rClose?.addEventListener('click', () => { root.classList.remove('right-open'); root.classList.add('right-closed'); signals?.classList.remove('active'); setTimeout(()=>window.dispatchEvent(new Event('resize')), 120); });
  charts?.addEventListener('click', () => { root.classList.toggle('charts-closed'); charts.classList.toggle('active', !root.classList.contains('charts-closed')); setTimeout(()=>window.dispatchEvent(new Event('resize')), 120); });
  rapid?.addEventListener('click', () => { root.classList.toggle('rapid-closed'); rapid.classList.toggle('active', !root.classList.contains('rapid-closed')); setTimeout(()=>window.dispatchEvent(new Event('resize')), 120); });
}
