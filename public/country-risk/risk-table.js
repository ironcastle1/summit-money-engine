import {
  escapeHtml,
  score
}
from './format.js';
export function riskTable(profiles=[],query=''){
  const filtered=profiles.filter(item=>`${item.country.name} ${item.country.nativeName||''} ${item.country.iso2}`.toLowerCase().includes(query.toLowerCase()));
  return `<div class="country-risk-table"><div class="country-risk-row country-risk-head"><span>COUNTRY</span><span>RISK</span><span>BAND</span><span>CONF.</span><span>COVERAGE</span></div>${filtered.map(item=>`<button class="country-risk-row" type="button" data-country-risk-id="${escapeHtml(item.country.iso2)}"><span><b>${
    escapeHtml(item.country.name)
  }
  </b><small>${
    escapeHtml(item.country.nativeName?`(${item.country.nativeName})`:'')
  }
  </small></span><strong>${
    score(item.risk.score)
  }
  </strong><em data-band="${item.risk.band.id}">${
    escapeHtml(item.risk.band.label)
  }
  </em><span>${
    score(item.risk.confidence)
  }
  %</span><span>${
    score(item.risk.coverage)
  }
  %</span></button>`).join('')}</div>`;
}
