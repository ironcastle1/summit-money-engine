export function setupPanels(){
  const app = document.getElementById('app');
  const openLeft = () => { app.classList.add('left-open'); localStorage.setItem('sme-left','open'); setTimeout(()=>window.dispatchEvent(new Event('resize')), 250); };
  const closeLeft = () => { app.classList.remove('left-open'); localStorage.setItem('sme-left','closed'); setTimeout(()=>window.dispatchEvent(new Event('resize')), 250); };
  const openRight = () => { app.classList.add('right-open'); localStorage.setItem('sme-right','open'); setTimeout(()=>window.dispatchEvent(new Event('resize')), 250); };
  const closeRight = () => { app.classList.remove('right-open'); localStorage.setItem('sme-right','closed'); setTimeout(()=>window.dispatchEvent(new Event('resize')), 250); };

  document.getElementById('leftTab').onclick = () => app.classList.contains('left-open') ? closeLeft() : openLeft();
  document.getElementById('rightTab').onclick = () => app.classList.contains('right-open') ? closeRight() : openRight();
  document.getElementById('leftClose').onclick = closeLeft;
  document.getElementById('rightClose').onclick = closeRight;
  document.getElementById('chartsToggle').onclick = () => { app.classList.toggle('charts-open'); setTimeout(()=>window.dispatchEvent(new Event('resize')), 250); };

  // Start map-first by default. Restore only if the user explicitly opened panels before.
  if (localStorage.getItem('sme-left') === 'open') app.classList.add('left-open');
  if (localStorage.getItem('sme-right') === 'open') app.classList.add('right-open');
}
