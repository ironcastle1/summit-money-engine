import {
  escapeHtml,
  score
}
from './format.js';
export function countryRiskDetail(profile){
  if(!profile)return'<div class="country-risk-empty">Select a country to inspect its political-risk evidence.</div>';
  const drivers=(profile.risk.components||[]).filter(item=>item.state!=='UNAVAILABLE').sort((a,b)=>b.score*b.weight-a.score*a.weight);
  return `<section class="country-risk-detail"><header><div><small>${escapeHtml(profile.country.iso2)} · ${escapeHtml(profile.country.region||'')}</small><h2>${escapeHtml(profile.country.name)}</h2>${profile.country.nativeName?`<p>(${
    escapeHtml(profile.country.nativeName)
  })</p>`:''}</div><div class="country-risk-gauge" data-band="${profile.risk.band.id}"><strong>${score(profile.risk.score)}</strong><span>${escapeHtml(profile.risk.band.label)}</span></div></header><div class="country-risk-metrics"><div><span>CONFIDENCE</span><b>${score(profile.risk.confidence)}%</b></div><div><span>COVERAGE</span><b>${score(profile.risk.coverage)}%</b></div><div><span>EVIDENCE</span><b>${drivers.length}</b></div></div><h3>PRIMARY DRIVERS</h3><div class="country-risk-drivers">${drivers.slice(0,10).map(item=>`<div><span>${
    escapeHtml(item.id)
  }
  </span><b>${
    score(item.score)
  }
  </b><i style="width:${Math.max(2,item.score)}%"></i><small>${
    escapeHtml(item.state)
  }
  · confidence ${
    score(item.confidence)
  }
  %</small></div>`).join('')}</div><h3>ASSESSMENT</h3><p>${escapeHtml(profile.briefing?.assessment||profile.risk.disclosure)}</p><small>${escapeHtml(profile.risk.disclosure)}</small></section>`;
}
