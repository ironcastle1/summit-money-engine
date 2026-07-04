function toggleClass(root, openClass, closedClass){
  const open = root.classList.contains(openClass);
  root.classList.toggle(openClass, !open);
  root.classList.toggle(closedClass, open);
}
export function setupPanels(){
  const root = document.getElementById('app');
  const markets = document.getElementById('marketsMenu');
  const signals = document.getElementById('signalsMenu');
  const lClose = document.getElementById('leftClose');
  const rClose = document.getElementById('rightClose');
  const charts = document.getElementById('chartsToggle');
  const rapid = document.getElementById('rapidMenu');

  markets?.addEventListener('click', () => toggleClass(root, 'left-open', 'left-closed'));
  signals?.addEventListener('click', () => toggleClass(root, 'right-open', 'right-closed'));
  lClose?.addEventListener('click', () => { root.classList.remove('left-open'); root.classList.add('left-closed'); });
  rClose?.addEventListener('click', () => { root.classList.remove('right-open'); root.classList.add('right-closed'); });
  charts?.addEventListener('click', () => { root.classList.toggle('charts-closed'); charts.classList.toggle('active', !root.classList.contains('charts-closed')); });
  rapid?.addEventListener('click', () => { root.classList.toggle('rapid-closed'); rapid.classList.toggle('active', !root.classList.contains('rapid-closed')); });
}
