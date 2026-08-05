import {
  score, age, text
}
from './format.js';
export class HazardDetailPanel {
  constructor(root) {
    this.root=root;
  }
  render(event) {
    if(!event) {
      this.root.innerHTML='<div class="hazard-empty">Select a hazard.</div>';
      return;
    }
    const reasons=(event.materiality?.reasons||[]).map(reason=>`<span>${text(reason.replaceAll('_',' '))}</span>`).join('');
    this.root.innerHTML=`<article class="hazard-detail-card"><header><span>${text(event.type.replaceAll('_',' '))}</span><b>${score(event.materiality?.score)} / 100</b></header><h3>${text(event.title)}</h3><p>${text(event.summary||event.region||'No additional description supplied by the source.')}</p><dl><div><dt>AGE</dt><dd>${age(event.time)}</dd></div><div><dt>CONFIDENCE</dt><dd>${score(event.confidence)}</dd></div><div><dt>SOURCE</dt><dd>${text(event.source)}</dd></div><div><dt>LOCATION</dt><dd>${event.point.lat.toFixed(2)}, ${event.point.lon.toFixed(2)}</dd></div></dl><div class="hazard-reasons">${reasons}</div></article>`;
  }
}
