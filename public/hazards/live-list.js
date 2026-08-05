import {
  score, age, text
}
from './format.js';
export class HazardLiveList {
  constructor(options) {
    this.root=options.root;
    this.onSelect=options.onSelect;
  }
  render(snapshot) {
    const events=snapshot?.events||[];
    this.root.innerHTML=events.length?events.map(event=>`<button class="hazard-row" data-id="${text(event.id)}"><span class="hazard-score band-${text(event.materiality?.impact?.band||event.severityBand)}">${score(event.materiality?.score)}</span><span><b>${text(event.title)}</b><small>${text(event.type.replaceAll('_',' '))} · ${age(event.time)} · ${text(event.source)}</small></span></button>`).join(''):'<div class="hazard-empty">No material hazards in the current window.</div>';
    this.root.querySelectorAll('[data-id]').forEach(button=>button.addEventListener('click', ()=>this.onSelect?.(button.dataset.id)));
  }
}
