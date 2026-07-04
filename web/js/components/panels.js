export function setupPanels(){
  const app = document.getElementById('app');
  document.getElementById('leftTab').onclick = () => app.classList.add('left-open');
  document.getElementById('rightTab').onclick = () => app.classList.add('right-open');
  document.getElementById('leftClose').onclick = () => app.classList.remove('left-open');
  document.getElementById('rightClose').onclick = () => app.classList.remove('right-open');
  document.getElementById('chartsToggle').onclick = () => app.classList.toggle('charts-open');
}
