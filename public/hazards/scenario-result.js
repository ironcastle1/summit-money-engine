import {
  score, money, text
}
from './format.js';
export class HazardScenarioResult {
  constructor(root) {
    this.root=root;
  }
  render(result) {
    if(!result) {
      this.root.innerHTML='';
      return;
    }
    const cascades=(result.cascadingRisks||[]).map(item=>`<li><b>${text(item.type.replaceAll('_',' '))}</b><span>${score(item.probability)}% probability</span></li>`).join('');
    this.root.innerHTML=`<article class="hazard-scenario-result"><div class="hazard-kpis"><span><b>${score(result.priority.score)}</b><small>PRIORITY</small></span><span><b>${result.exposure.population.estimatedPopulation.toLocaleString()}</b><small>EST. EXPOSED</small></span><span><b>${result.exposure.infrastructure.count}</b><small>ASSETS</small></span><span><b>${money(result.economics.estimatedTotalUsd)}</b><small>MODELLED LOSS</small></span></div><h4>CASCADE PATHS</h4><ul>${cascades||'<li>No cascade above threshold</li>'}</ul><small>Scenario estimates are model outputs, not observed casualties or confirmed losses.</small></article>`;
  }
}
