import {
  escapeConflict
}
from './format.js';
export function conflictScenarioPanel(catalog = {
}) {
  return `<form id="conflict-scenario" class="conflict-scenario"><h3>SCENARIO</h3><label>TYPE<select name="type">${(catalog.scenarios || []).map(item => `<option value="${escapeConflict(item.id)}">${escapeConflict(item.label)}</option>`).join('')}</select></label><label>SEVERITY<input name="severity" type="range" min="0" max="100" value="60"></label><label>HORIZON<input name="horizonDays" type="number" min="1" max="365" value="30"></label><button type="submit">RUN SCENARIO</button><output id="conflict-scenario-result"></output></form>`;
}
