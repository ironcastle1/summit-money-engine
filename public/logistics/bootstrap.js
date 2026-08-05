import { LogisticsController } from './logistics-controller.js';
function ensureRoot() { let root = document.getElementById('logistics-panel'); if (!root) { root = document.createElement('aside'); root.id = 'logistics-panel'; root.className = 'logistics-panel hidden'; document.querySelector('.map-stage')?.append(root); } return root; }
export async function installLogisticsSystem(options) {
  const root = ensureRoot(); let button = document.getElementById('logistics-toggle');
  if (!button) { button = document.createElement('button'); button.id = 'logistics-toggle'; button.type = 'button'; button.className = 'logistics-toggle'; button.textContent = 'ROUTE EXPOSURE'; document.querySelector('.map-tools')?.append(button); }
  const controller = new LogisticsController({ map: options.map, root }); button.addEventListener('click', () => controller.toggle());
  try { await controller.start(); button.classList.add('is-ready'); return controller; } catch (error) { button.classList.add('is-error'); button.title = error.message; console.error('Logistics system failed to start', error); return null; }
}
